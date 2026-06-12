import { chromium } from 'playwright';

const EMAIL = 'ahmadfardan464@gmail.com';
const PASSWORD = '***';

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
  console.log('STEP 1: Opening Stripe register...');
  await page.goto('https://dashboard.stripe.com/register');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/step1-stripe.png' });
  console.log('Screenshot: step1-stripe.png');
  
  // Click Google
  console.log('STEP 2: Clicking Google button...');
  const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google")').first();
  await googleBtn.click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/step2-google.png' });
  console.log('Screenshot: step2-google.png');
  
  // Step 3: Fill email
  console.log('STEP 3: Filling email...');
  await page.fill('input[type="email"], input[name="identifier"]', EMAIL);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/step3-email.png' });
  console.log('Screenshot: step3-email.png - EMAIL FILLED');
  
  // Click Next
  console.log('STEP 4: Clicking Next...');
  const nextBtn = page.locator('button:has-text("Next"), #identifierNext').first();
  await nextBtn.click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/step4-password.png' });
  console.log('Screenshot: step4-password.png');
  
  // Step 5: Fill password
  console.log('STEP 5: Filling password...');
  await page.fill('input[type="password"]', PASSWORD);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/step5-password-filled.png' });
  console.log('Screenshot: step5-password-filled.png - PASSWORD FILLED');
  
  // Click Sign in
  console.log('STEP 6: Clicking Sign in...');
  const signInBtn = page.locator('button:has-text("Sign in"), #passwordNext').first();
  await signInBtn.click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/step6-after-signin.png' });
  console.log('Screenshot: step6-after-signin.png');
  
  // Step 7: Check state - may need 2FA
  console.log('STEP 7: Waiting for page to settle...');
  await page.waitForTimeout(10000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/step7-final.png' });
  console.log('Screenshot: step7-final.png');
  console.log('Final URL:', page.url());
  
  // Keep browser open for manual intervention
  console.log('Browser open for 120s. You can guide me via chat.');
  await page.waitForTimeout(120000);
  
  await browser.close();
})();
