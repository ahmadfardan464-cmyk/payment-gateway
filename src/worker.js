// Midtrans Worker — Cloudflare Workers compatible (no npm packages)

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
    
    return new Response('Not Found', { status: 404 });
  }
};

async function handleMidtransCharge(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { customer, amount } = body;
    
    const orderId = 'ORDER-' + Date.now();
    
    // Call Midtrans API directly with fetch
    const auth = btoa(env.MIDTRANS_SERVER_KEY + ':');
    
    const midtransResponse = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Basic ' + auth
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        customer_details: {
          first_name: customer?.first_name || 'Customer',
          email: customer?.email || 'customer@example.com',
          phone: customer?.phone || ''
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
          finish: env.FRONTEND_URL + '/success'
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
  const body = await request.json();
  const { order_id, transaction_status } = body;
  
  if (transaction_status === 'capture' || transaction_status === 'settlement') {
    // Send email via Resend API directly with fetch
    await sendEmailViaFetch(env, order_id);
  }
  
  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function sendEmailViaFetch(env, orderId) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.RESEND_API_KEY
      },
      body: JSON.stringify({
        from: 'Fardanista <noreply@fardanista.com>',
        to: 'ahmadfardan464@gmail.com',
        subject: '🎉 AI Prompt Engineering Pack — Link Download',
        html: `
          <h2>Terima kasih! 🎉</h2>
          <p>Order ID: <strong>${orderId}</strong></p>
          <p>AI Prompt Engineering Pack siap di-download:</p>
          <a href="${env.FRONTEND_URL}/download?order=${orderId}" 
             style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Download Sekarang
          </a>
          <p style="margin-top:24px;color:#666">Link aktif selama 7 hari.</p>
        `
      })
    });
    
    if (!response.ok) {
      console.error('Email failed:', await response.text());
    }
    
  } catch (err) {
    console.error('Email error:', err.message);
  }
}
