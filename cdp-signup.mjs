import { chromium } from 'playwright';

const EMAIL = 'ahmadfardan464@gmail.com';
const PASSWORD = '***';

(async () => {
  // Connect to existing CDP browser
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  console.log('Connected to CDP browser');
  
  const context = browser.contexts()[0];
  const pages = context.pages();
  console.log('Pages:', pages.map(p => p.url()));
  
  // Find or create Stripe page
  let page = pages.find(p => p.url().includes('stripe.com'));
  if (!page) {
    page = await context.newPage();
    await page.goto('https://dashboard.stripe.com/register');
  }
  
  console.log('Stripe page URL:', page.url());
  await page.waitForTimeout(3000);
  
  // Click Google button
  const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google"), [aria-label*="Google"]').first();
  if (await googleBtn.isVisible().catch(() => false)) {
    await googleBtn.click();
    console.log('Clicked Google button');
  }
  
  await page.waitForTimeout(5000);
  console.log('URL after click:', page.url());
  
  // Check if redirected to Google
  if (page.url().includes('accounts.google.com')) {
    console.log('On Google login page');
    await page.screenshot({ path: '/home/user/.openclaw/workspace/cdp-google.png' });
    
    // Check for error
    const bodyText = await page.textContent('body');
    if (bodyText.includes('Couldn\'t sign you in') || bodyText.includes('not be secure')) {
      console.log('Google blocked CDP browser. Stopping.');
      await browser.close();
      process.exit(1);
    }
    
    // Fill email
    await page.waitForSelector('input[type="email"], input[name="identifier"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="identifier"]', EMAIL);
    
    const nextBtn = page.locator('button:has-text("Next"), #identifierNext').first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    
    await page.waitForTimeout(4000);
    
    // Fill password
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    await page.fill('input[type="password"]', PASSWORD);
    
    const signInBtn = page.locator('button:has-text("Sign in"), #passwordNext').first();
    if (await signInBtn.isVisible().catch(() => false)) {
      await signInBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    
    await page.waitForTimeout(8000);
    
    // Handle 2FA if needed
    if (page.url().includes('/challenge/') || page.url().includes('/signin/v2/challenge')) {
      console.log('2FA required. Waiting 60s...');
      await page.waitForTimeout(60000);
    }
  }
  
  // Check final state
  await page.waitForTimeout(5000);
  console.log('Final URL:', page.url());
  await page.screenshot({ path: '/home/user/.openclaw/workspace/cdp-final.png' });
  
  if (page.url().includes('dashboard.stripe.com')) {
    console.log('Success! Stripe dashboard loaded.');
    
    await page.goto('https://dashboard.stripe.com/apikeys');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/cdp-apikeys.png' });
  }
  
  await browser.close();
})();
