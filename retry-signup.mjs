import { chromium } from 'playwright';

const EMAIL = 'ahmadfardan464@gmail.com';
const PASSWORD = 'XaR36bw4@i4&'; // raw password with &

(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: '/usr/bin/chromium',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,720',
      '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ]
  });
  
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  // Step 1: Stripe register
  await page.goto('https://dashboard.stripe.com/register');
  await page.waitForTimeout(3000);
  
  // Click Google
  const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google")').first();
  await googleBtn.click();
  await page.waitForTimeout(5000);
  
  // Fill email
  await page.fill('input[type="email"], input[name="identifier"]', EMAIL);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);
  
  // Fill password - try multiple methods
  console.log('Filling password...');
  
  // Method 1: direct fill
  await page.fill('input[type="password"]', PASSWORD);
  await page.waitForTimeout(1000);
  
  // Method 2: click field first then type
  await page.click('input[type="password"]');
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await page.type('input[type="password"]', PASSWORD, { delay: 50 });
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/retry-password-filled.png' });
  console.log('Screenshot: retry-password-filled.png');
  
  // Click Sign in
  await page.keyboard.press('Enter');
  await page.waitForTimeout(10000);
  
  await page.screenshot({ path: '/home/user/.openclaw/workspace/retry-after-signin.png' });
  console.log('Screenshot: retry-after-signin.png');
  console.log('Final URL:', page.url());
  
  // Keep open for verification
  await page.waitForTimeout(60000);
  await browser.close();
})();
