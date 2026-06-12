import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  console.log('Connected to CDP');
  
  const context = browser.contexts()[0];
  const pages = context.pages();
  console.log('Pages:', pages.map(p => p.url()));
  
  let page = pages.find(p => p.url().includes('google.com') || p.url().includes('stripe.com'));
  if (!page) {
    page = await context.newPage();
    await page.goto('https://accounts.google.com/signin/oauth/legacy/consent');
  }
  
  console.log('Working with URL:', page.url());
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/consent-page.png' });
  
  // Find and click Allow button
  const allowSelectors = [
    'button:has-text("Allow")',
    '#submit_approve_access',
    'button[jsname="V67aGc"]',
    'button[role="button"]:nth-of-type(2)',
    'button[type="submit"]'
  ];
  
  for (const sel of allowSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      console.log('Clicked Allow via:', sel);
      break;
    }
  }
  
  await page.waitForTimeout(10000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/after-allow.png' });
  console.log('URL after click:', page.url());
  
  // Check Stripe
  if (page.url().includes('dashboard.stripe.com')) {
    console.log('Stripe loaded!');
    await page.goto('https://dashboard.stripe.com/apikeys');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/stripe-apikeys.png' });
    
    const bodyText = await page.textContent('body');
    const skMatch = bodyText.match(/sk_test_[a-zA-Z0-9]{24,}/);
    if (skMatch) {
      console.log('SECRET_KEY:', skMatch[0]);
    }
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();
