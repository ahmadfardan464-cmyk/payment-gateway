export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    if (url.pathname === '/midtrans/charge' && request.method === 'POST') {
      return handleMidtransCharge(request, env, corsHeaders);
    }
    
    if (url.pathname === '/midtrans/callback' && request.method === 'POST') {
      return handleMidtransCallback(request, env);
    }
    
    if (url.pathname === '/checkout') {
      return handleCheckout(request, env, corsHeaders);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

async function handleMidtransCharge(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { customer, amount } = body;
    
    const orderId = 'ORDER-' + Date.now();
    
    // Call Midtrans API to create Snap token
    const midtransResponse = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Basic ' + btoa(env.MIDTRANS_SERVER_KEY + ':')
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        customer_details: {
          first_name: customer.first_name || 'Customer',
          email: customer.email || 'customer@example.com',
          phone: customer.phone || ''
        },
        item_details: [{
          id: 'ai-prompt-pack',
          price: amount,
          quantity: 1,
          name: 'AI Prompt Engineering Pack',
          brand: 'Fardanista',
          category: 'Digital Product',
          merchant_name: 'Fardanista'
        }],
        callbacks: {
          finish: 'https://ahmadfardan464-cmyk.github.io/ai-prompt-pack/success'
        }
      })
    });
    
    const data = await midtransResponse.json();
    
    if (!midtransResponse.ok) {
      return new Response(JSON.stringify({ error: data.error_messages?.[0] || 'Midtrans error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Log pending sale
    await env.SALES_KV.put('pending:' + orderId, JSON.stringify({
      order_id: orderId,
      amount: amount,
      status: 'pending',
      created_at: new Date().toISOString()
    }));
    
    return new Response(JSON.stringify({ token: data.token, redirect_url: data.redirect_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleMidtransCallback(request, env) {
  try {
    const body = await request.json();
    const { order_id, transaction_status, status_code } = body;
    
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      // Payment success - send product email
      if (env.SALES_KV) {
        const orderData = await env.SALES_KV.get('pending:' + order_id);
        if (orderData) {
          const order = JSON.parse(orderData);
          
          // Send email via Resend
          await sendProductEmail(env, order.email || order_id + '@customer.com', order_id);
          
          // Update status
          await env.SALES_KV.put('sale:' + order_id, JSON.stringify({
            ...order,
            status: 'paid',
            paid_at: new Date().toISOString()
          }));
        }
      } else {
        // Fallback: send email without KV storage
        // Use customer_email from callback body, or default to test email
        const customerEmail = body.customer_email || 'ahmadfardan464@gmail.com';
        await sendProductEmail(env, customerEmail, order_id);
      }
    }
    
    return new Response(JSON.stringify({ received: true }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, received: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleCheckout(request, env, corsHeaders) {
  // Keep Stripe checkout as alternative for international customers
  // ... existing Stripe code ...
  return new Response('Stripe checkout', { status: 200 });
}

async function sendProductEmail(env, email, orderId) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: email,
      subject: '🎉 AI Prompt Engineering Pack — Link Download',
      html: `
        <h2>Terima kasih! 🎉</h2>
        <p>Order ID: <strong>${orderId}</strong></p>
        <p>AI Prompt Engineering Pack siap di-download:</p>
        <a href="https://storage.fardanista.com/downloads/ai-prompt-pack.zip?token=***"
           style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Download Sekarang
        </a>
        <p style="margin-top:24px;color:#666">Link aktif selama 7 hari.</p>
      `
    })
  });
}
