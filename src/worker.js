export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Route: POST /checkout — create Stripe session
    if (url.pathname === '/checkout' && request.method === 'POST') {
      return handleCheckout(request, env, corsHeaders);
    }
    
    // Route: POST /webhook — Stripe events
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

async function handleCheckout(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { customer_email } = body;
    
    const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'AI Prompt Engineering Pack',
            description: '3000+ premium prompts. Lifetime access.',
            images: ['https://ahmadfardan464-cmyk.github.io/ai-prompt-pack/assets/cover.png']
          },
          unit_amount: 1700 // $17.00
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: 'https://ahmadfardan464-cmyk.github.io/ai-prompt-pack/success',
      cancel_url: 'https://ahmadfardan464-cmyk.github.io/ai-prompt-pack/',
      customer_email: customer_email || undefined,
      metadata: {
        product_id: 'ai-prompt-pack',
        sku: 'APP-001'
      }
    });
    
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleWebhook(request, env) {
  const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
  const sig = request.headers.get('stripe-signature');
  let event;
  
  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Send product email
    await sendProductEmail(env, session.customer_email, session.id);
    
    // Log sale
    await logSale(env, session);
  }
  
  return new Response(JSON.stringify({ received: true }));
}

async function sendProductEmail(env, email, orderId) {
  // Using Resend (free tier, 100/day)
  const resend = new (await import('resend')).Resend(env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'noreply@fardanista.com',
    to: email,
    subject: '🎉 Your AI Prompt Engineering Pack is here!',
    html: `
      <h2>Thanks for your purchase! 🎉</h2>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>Your AI Prompt Engineering Pack is ready for download:</p>
      <a href="https://storage.fardanista.com/downloads/ai-prompt-pack.zip?token=${await generateToken(env, orderId)}" 
         style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
        Download Now
      </a>
      <p style="margin-top:24px;color:#666">Questions? Reply to this email.</p>
    `
  });
}

async function logSale(env, session) {
  // Simple KV logging (replace with proper DB later)
  const key = `sale:${Date.now()}`;
  await env.SALES_KV.put(key, JSON.stringify({
    order_id: session.id,
    email: session.customer_email,
    amount: session.amount_total,
    currency: session.currency,
    product: session.metadata?.product_id,
    created_at: new Date().toISOString()
  }));
}

async function generateToken(env, orderId) {
  // Simple HMAC token for download link
  const encoder = new TextEncoder();
  const data = encoder.encode(orderId + ':' + Date.now());
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(env.DOWNLOAD_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
