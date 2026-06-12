import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const context = browser.contexts()[0];
  const pages = context.pages();
  
  let page = pages.find(p => p.url().includes('stripe.com') || p.url().includes('google.com'));
  if (!page) page = pages[0];
  
  console.log('Current URL:', page.url());
  await page.screenshot({ path: '/home/user/.openclaw/workspace/current-state.png' });
  
  // If on login page, try to sign in with Google again
  if (await page.locator('input[type="email"]').isVisible().catch(() => false)) {
    console.log('On login page, clicking Google...');
    await page.click('button:has-text("Google"), a:has-text("Google")');
    await page.waitForTimeout(10000);
  }
  
  // Navigate to API keys directly
  await page.goto('https://dashboard.stripe.com/apikeys');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/apikeys-attempt.png' });
  
  console.log('URL after navigate:', page.url());
  
  // Check if keys visible
  const bodyText = await page.textContent('body');
  const skMatch = bodyText.match(/sk_test_[a-zA-Z0-9]{24,}/);
  const pkMatch = bodyText.match(/pk_test_[a-zA-Z0-9]{24,}/);
  
  if (skMatch) console.log('SECRET_KEY:', skMatch[0]);
  if (pkMatch) console.log('PUBLISHABLE_KEY:', pkMatch[0]);
  
  // Also check for "Complete your setup" or account creation flow
  if (bodyText.includes('Complete your setup') || bodyText.includes('Get started')) {
    console.log('Account setup needed');
  }
  
  await browser.close();
})();
