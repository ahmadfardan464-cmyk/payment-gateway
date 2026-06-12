import { chromium } from 'playwright';

const EMAIL = 'ahmadfardan464@gmail.com';
const PASSWORD = '***';

(async () => {
  const context = await chromium.launchPersistentContext('/tmp/chrome-cf', {
    headless: false,
    executablePath: '/usr/bin/chromium',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,720',
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ],
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Open Cloudflare login
    await page.goto('https://dash.cloudflare.com/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/cf1-login.png' });
    
    // Try to find email/password form (not Google OAuth)
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      console.log('Direct login form found!');
      await emailInput.fill(EMAIL);
      await page.fill('input[type="password"]', PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: '/home/user/.openclaw/workspace/cf2-direct.png' });
    } else {
      console.log('No direct form, Google OAuth only');
    }
    
    console.log('Final URL:', page.url());
    
  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/cf-error.png' });
  }
  
  await page.waitForTimeout(30000);
  await context.close();
})();
