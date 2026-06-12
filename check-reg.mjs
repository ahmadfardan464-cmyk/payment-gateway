import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages.find(p => p.url().includes('stripe.com'));
  if (!page) page = pages[0];
  
  console.log('Current URL:', page.url());
  
  // Check if on registration/oauth page
  if (page.url().includes('register/oauth') || page.url().includes('dashboard.stripe.com')) {
    await page.screenshot({ path: '/home/user/.openclaw/workspace/reg-state.png' });
    
    // Look for registration form elements
    const bodyText = await page.textContent('body');
    console.log('Page contains:', bodyText.substring(0, 1000));
    
    // If there's a "Continue" or "Get started" button, click it
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Get started"), button:has-text("Complete")').first();
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(5000);
    }
  }
  
  // Try navigating to API keys again
  await page.goto('https://dashboard.stripe.com/apikeys');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/apikeys-check.png' });
  
  const bodyText = await page.textContent('body');
  const skMatch = bodyText.match(/sk_test_[a-zA-Z0-9]{24,}/);
  
  if (skMatch) {
    console.log('SECRET_KEY:', skMatch[0]);
  } else {
    console.log('Still on login/reg page. URL:', page.url());
  }
  
  await browser.close();
})();
