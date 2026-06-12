import { chromium } from 'playwright';

const EMAIL = 'ahmadfardan464@gmail.com';
const PASSWORD = '***';

(async () => {
  const context = await chromium.launchPersistentContext('/home/user/.chrome-data', {
    headless: false,
    executablePath: '/usr/bin/chromium',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,720',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=18804'
    ],
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Open Cloudflare login
    console.log('Opening Cloudflare login...');
    await page.goto('https://dash.cloudflare.com/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/cf-login.png' });
    
    // Click Google sign-in
    const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google")').first();
    if (await googleBtn.isVisible().catch(() => false)) {
      await googleBtn.click();
    } else {
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button, a');
        for (const btn of btns) {
          if (btn.textContent?.includes('Google')) { btn.click(); break; }
        }
      });
    }
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/cf-google.png' });
    
    // Step 2: Google OAuth
    if (page.url().includes('accounts.google.com')) {
      console.log('Google auth...');
      await page.fill('input[type="email"], input[name="identifier"]', EMAIL);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(4000);
      
      await page.fill('input[type="password"]', PASSWORD);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: '/home/user/.openclaw/workspace/cf-after-pw.png' });
      
      if (page.url().includes('/challenge/')) {
        console.log('2FA - waiting 60s for Ezlik to verify');
        await page.screenshot({ path: '/home/user/.openclaw/workspace/cf-2fa.png' });
        await page.waitForTimeout(60000);
      }
      
      const allowBtn = page.locator('button:has-text("Allow")').first();
      if (await allowBtn.isVisible().catch(() => false)) {
        await allowBtn.click();
        await page.waitForTimeout(5000);
      }
    }
    
    await page.screenshot({ path: '/home/user/.openclaw/workspace/cf-dashboard.png' });
    console.log('URL:', page.url());
    
    // Step 3: Navigate to Workers and redeploy
    if (page.url().includes('dash.cloudflare.com')) {
      console.log('On Cloudflare!');
      
      await page.goto('https://dash.cloudflare.com/0becfc9754d51754f5436cac5c1bfa5b/workers-and-pages');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/home/user/.openclaw/workspace/cf-workers.png' });
      
      const projectLink = page.locator('text=payment-gateway').first();
      if (await projectLink.isVisible().catch(() => false)) {
        await projectLink.click();
        await page.waitForTimeout(3000);
        
        const redeployBtn = page.locator('button:has-text("Redeploy"), button:has-text("Retry"), button:has-text("Deploy")').first();
        if (await redeployBtn.isVisible().catch(() => false)) {
          await redeployBtn.click();
          console.log('Redeploy clicked!');
          await page.waitForTimeout(10000);
          await page.screenshot({ path: '/home/user/.openclaw/workspace/cf-deployed.png' });
        }
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/cf-error.png' });
  }
  
  await page.waitForTimeout(30000);
  await context.close();
})();
