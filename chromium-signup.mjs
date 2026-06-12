import { chromium } from 'playwright';

const EMAIL = 'ahmadfardan464@gmail.com';
const PASSWORD = '***';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18801');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages[0];
  
  console.log('Initial URL:', page.url());
  
  // Navigate to Stripe register
  await page.goto('https://dashboard.stripe.com/register');
  await page.waitForTimeout(3000);
  
  // Handle cookie consent first
  const cookieBtn = page.locator('button:has-text("Accept all"), button:has-text("Reject all")').first();
  if (await cookieBtn.isVisible().catch(() => false)) {
    await cookieBtn.click({ force: true });
    await page.waitForTimeout(1000);
  }
  
  await page.screenshot({ path: '/home/user/.openclaw/workspace/c1-register.png' });
  
  // Click Google with force and retry
  console.log('Clicking Google button...');
  const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google"), #continue_with_google').first();
  await googleBtn.click({ force: true, timeout: 10000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/c2-google.png' });
  
  // Fill email
  await page.fill('input[type="email"], input[name="identifier"]', EMAIL);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4000);
  
  // Fill password
  await page.fill('input[type="password"]', PASSWORD);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/c3-after-pw.png' });
  
  // Handle 2FA if needed
  if (page.url().includes('/challenge/')) {
    console.log('2FA needed - waiting 45s');
    await page.screenshot({ path: '/home/user/.openclaw/workspace/c4-2fa.png' });
    await page.waitForTimeout(45000);
  }
  
  // Handle consent
  if (page.url().includes('accounts.google.com')) {
    const allowBtn = page.locator('button:has-text("Allow")').first();
    if (await allowBtn.isVisible().catch(() => false)) {
      await allowBtn.click();
      console.log('Clicked Allow');
    }
    await page.waitForTimeout(8000);
  }
  
  await page.screenshot({ path: '/home/user/.openclaw/workspace/c5-final.png' });
  console.log('Final URL:', page.url());
  
  // Navigate to API keys
  await page.goto('https://dashboard.stripe.com/apikeys');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/c6-apikeys.png' });
  
  const bodyText = await page.textContent('body');
  const skMatch = bodyText.match(/sk_test_[a-zA-Z0-9]{24,}/);
  if (skMatch) {
    console.log('SECRET_KEY:', skMatch[0]);
  } else {
    console.log('No keys found. URL:', page.url());
  }
  
  await browser.close();
})();
