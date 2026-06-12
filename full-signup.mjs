import { chromium } from 'playwright';

const EMAIL = 'ahmadfardan464@gmail.com';
const PASSWORD = 'XaR36bw4@i4&';

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
  
  try {
    // Step 1: Stripe register
    await page.goto('https://dashboard.stripe.com/register');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/f1-register.png' });
    
    // Click Google
    await page.click('button:has-text("Google"), a:has-text("Google")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/f2-google.png' });
    
    // Fill email
    await page.fill('input[type="email"], input[name="identifier"]', EMAIL);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/f3-email.png' });
    
    // Fill password
    await page.fill('input[type="password"]', PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/f4-password.png' });
    
    // Handle 2FA if shown
    if (page.url().includes('/challenge/')) {
      console.log('2FA detected - waiting 45s for manual verification');
      await page.screenshot({ path: '/home/user/.openclaw/workspace/f4-2fa.png' });
      await page.waitForTimeout(45000);
    }
    
    // Handle OAuth consent
    if (page.url().includes('accounts.google.com')) {
      console.log('Google page - clicking Allow or waiting');
      const allowBtn = page.locator('button:has-text("Allow")').first();
      if (await allowBtn.isVisible().catch(() => false)) {
        await allowBtn.click();
        console.log('Clicked Allow');
      }
      await page.waitForTimeout(8000);
    }
    
    await page.screenshot({ path: '/home/user/.openclaw/workspace/f5-after-oauth.png' });
    console.log('URL after OAuth:', page.url());
    
    // Step 2: Complete Stripe setup if needed
    if (page.url().includes('dashboard.stripe.com')) {
      console.log('On Stripe dashboard');
      
      // Check if we need to fill registration form
      if (await page.locator('input[name="businessProfile[name]"], input[placeholder*="business"]').isVisible().catch(() => false)) {
        console.log('Filling Stripe registration form...');
        await page.fill('input[name="businessProfile[name]"]', 'Fardanista');
        await page.selectOption('select[name="businessProfile[product_description]"]', 'software');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);
      }
      
      // Navigate to API keys
      await page.goto('https://dashboard.stripe.com/apikeys');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: '/home/user/.openclaw/workspace/f6-apikeys.png' });
      
      const bodyText = await page.textContent('body');
      const skMatch = bodyText.match(/sk_test_[a-zA-Z0-9]{24,}/);
      const pkMatch = bodyText.match(/pk_test_[a-zA-Z0-9]{24,}/);
      
      if (skMatch) {
        console.log('SECRET_KEY:', skMatch[0]);
        // Save to file
        const fs = await import('fs');
        fs.writeFileSync('/home/user/.openclaw/workspace/stripe-keys.json', JSON.stringify({
          secretKey: skMatch[0],
          publishableKey: pkMatch ? pkMatch[0] : null
        }));
        console.log('Keys saved to stripe-keys.json');
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/error-state.png' });
  }
  
  await page.waitForTimeout(10000);
  await browser.close();
})();
