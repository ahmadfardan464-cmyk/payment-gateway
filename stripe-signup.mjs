import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: '/usr/bin/chromium'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Open Stripe registration
  await page.goto('https://dashboard.stripe.com/register');
  
  console.log('Page loaded:', await page.title());
  
  // Wait for Google sign-in button
  const googleBtn = await page.locator('button:has-text("Google"), a:has-text("Google")').first();
  
  if (await googleBtn.isVisible().catch(() => false)) {
    console.log('Google button found, clicking...');
    await googleBtn.click();
    
    // Wait for Google popup or redirect
    await page.waitForTimeout(3000);
    
    console.log('Current URL:', page.url());
    
    // Check if we need to login to Google
    if (page.url().includes('accounts.google.com')) {
      console.log('Google login page detected');
      // We need credentials - pause for manual input or try stored password
    }
  } else {
    console.log('Google button not found, taking screenshot...');
    await page.screenshot({ path: '/home/user/.openclaw/workspace/stripe-page.png' });
    console.log('Screenshot saved to stripe-page.png');
  }
  
  await browser.close();
})();
