import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: '/usr/bin/chromium',
    args: ['--disable-blink-features=AutomationControlled', '--window-size=1280,720']
  });
  
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages.find(p => p.url().includes('google.com'));
  
  if (!page) {
    page = await context.newPage();
    await page.goto('https://accounts.google.com/signin/oauth/legacy/consent');
  }
  
  console.log('Current URL:', page.url());
  await page.screenshot({ path: '/home/user/.openclaw/workspace/consent-page.png' });
  
  // Click Allow
  const allowBtn = page.locator('button:has-text("Allow"), #submit_approve_access').first();
  if (await allowBtn.isVisible().catch(() => false)) {
    await allowBtn.click();
    console.log('Clicked Allow');
  } else {
    // Try by button id or other selectors
    await page.click('button[jsname="V67aGc"], button[role="button"]:nth-of-type(2)');
    console.log('Clicked second button (likely Allow)');
  }
  
  await page.waitForTimeout(10000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/after-allow.png' });
  console.log('URL after Allow:', page.url());
  
  // Check if on Stripe
  if (page.url().includes('dashboard.stripe.com')) {
    console.log('Stripe loaded! Navigating to API keys...');
    await page.goto('https://dashboard.stripe.com/apikeys');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/stripe-apikeys.png' });
    
    // Extract secret key
    const bodyText = await page.textContent('body');
    const skMatch = bodyText.match(/sk_test_[a-zA-Z0-9]{24,}/);
    if (skMatch) {
      console.log('SECRET_KEY:', skMatch[0]);
    }
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
})();
