#!/bin/bash
set -e

echo "🚀 Payment Gateway Auto-Deploy"
echo "================================"

# Check dependencies
if ! command -v wrangler &> /dev/null; then
  echo "Installing Wrangler..."
  npm install -g wrangler
fi

if ! command -v stripe &> /dev/null; then
  echo "Installing Stripe CLI..."
  # Auto-install stripe CLI for webhook testing
  curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public_key.pub | gpg --import
  brew install stripe/stripe-cli/stripe 2>/dev/null || \
    apt install stripe 2>/dev/null || \
    echo "Please install Stripe CLI manually: https://stripe.com/docs/stripe-cli"
fi

# Login to Cloudflare
echo ""
echo "🔐 Login to Cloudflare..."
wrangler login

# Check if user has Stripe keys
if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo ""
  echo "⚠️  Stripe Secret Key not found."
  echo "Get it from: https://dashboard.stripe.com/apikeys"
  read -p "Enter Stripe Secret Key (sk_test_...): " STRIPE_SECRET_KEY
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
  echo ""
  echo "⚠️  Stripe Webhook Secret not found."
  echo "Add endpoint in Stripe Dashboard:"
  echo "  URL: https://payment-gateway.YOUR_SUBDOMAIN.workers.dev/webhook"
  echo "  Events: checkout.session.completed"
  read -p "Enter Webhook Secret (whsec_...): " STRIPE_WEBHOOK_SECRET
fi

if [ -z "$RESEND_API_KEY" ]; then
  echo ""
  echo "⚠️  Resend API Key not found."
  echo "Get it from: https://resend.com/api-keys"
  read -p "Enter Resend API Key (re_...): " RESEND_API_KEY
fi

# Generate download secret
DOWNLOAD_SECRET=$(openssl rand -hex 32)

# Create KV namespace if not exists
echo ""
echo "📦 Setting up Cloudflare KV..."
wrangler kv:namespace create "SALES_KV" || true

# Set secrets
echo ""
echo "🔒 Setting secrets..."
echo "$STRIPE_SECRET_KEY" | wrangler secret put STRIPE_SECRET_KEY
echo "$STRIPE_WEBHOOK_SECRET" | wrangler secret put STRIPE_WEBHOOK_SECRET
echo "$RESEND_API_KEY" | wrangler secret put RESEND_API_KEY
echo "$DOWNLOAD_SECRET" | wrangler secret put DOWNLOAD_SECRET

# Deploy worker
echo ""
echo "🌍 Deploying worker..."
wrangler deploy

# Get worker URL
WORKER_URL=$(wrangler worker get payment-gateway | grep -oP 'https?://[^\s]+' | head -1 || echo "")

# Update frontend with real URL
if [ -n "$WORKER_URL" ]; then
  echo ""
  echo "🔗 Updating frontend with worker URL..."
  sed -i "s|payment-worker.YOUR_SUBDOMAIN.workers.dev|$WORKER_URL|g" public/index.html
fi

# Deploy pages
echo ""
echo "📄 Deploying static site..."
wrangler pages deploy public --project-name=payment-gateway

echo ""
echo "✅ Done!"
echo "========"
echo "Worker: $WORKER_URL"
echo "Frontend: https://payment-gateway.pages.dev"
echo ""
echo "Next: Add your product ZIP to Cloudflare R2 or GitHub releases"
echo "Then update the download URL in worker.js"
