import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages.find(p => p.url().includes('stripe.com'));
  if (!page) page = pages[0];
  
  console.log('Current URL:', page.url());
  
  // Navigate to API keys
  await page.goto('https://dashboard.stripe.com/apikeys');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/apikeys-final.png' });
  
  const bodyText = await page.textContent('body');
  const skMatch = bodyText.match(/sk_test_[a-zA-Z0-9]{24,}/);
  const pkMatch = bodyText.match(/pk_test_[a-zA-Z0-9]{24,}/);
  
  if (skMatch) {
    console.log('SECRET_KEY:', skMatch[0]);
    const fs = await import('fs');
    fs.writeFileSync('/home/user/.openclaw/workspace/stripe-keys.json', JSON.stringify({
      secretKey: skMatch[0],
      publishableKey: pkMatch ? pkMatch[0] : null
    }));
    console.log('Keys saved!');
  } else {
    console.log('No keys found. URL:', page.url());
    console.log('Page text sample:', bodyText.substring(0, 500));
  }
  
  await browser.close();
})();
