import { chromium } from 'playwright';

const EMAIL = 'ahmadfardan464@gmail.com';
const PASSWORD = '***';
const RESEND_KEY = 're_UHDQW54J_NtjHLu5XVt2rDS44Mi2DzXcw';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18805');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages[0];
  
  console.log('Browser URL:', page.url());
  
  try {
    // Step 1: Ensure on Cloudflare login
    if (!page.url().includes('dash.cloudflare.com')) {
      await page.goto('https://dash.cloudflare.com/login');
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: '/home/user/.openclaw/workspace/d1-login.png' });
    
    // Step 2: Click Google sign-in
    console.log('Clicking Google...');
    await page.click('button:has-text("Google"), a:has-text("Google")').catch(() => {
      // Fallback: find by data-testid or other
      return page.evaluate(() => {
        const btns = document.querySelectorAll('button, a');
        for (const btn of btns) {
          if (btn.textContent?.includes('Google') || btn.innerText?.includes('Google')) {
            btn.click(); return true;
          }
        }
        return false;
      });
    });
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/d2-google.png' });
    console.log('URL after Google click:', page.url());
    
    // Step 3: Google OAuth flow
    if (page.url().includes('accounts.google.com')) {
      console.log('Google auth...');
      
      // Fill email
      await page.fill('input[type="email"], input[name="identifier"]', EMAIL);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(4000);
      
      // Fill password
      await page.fill('input[type="password"]', PASSWORD);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: '/home/user/.openclaw/workspace/d3-after-pw.png' });
      
      // Handle 2FA
      if (page.url().includes('/challenge/')) {
        console.log('2FA detected! Ezlik, please tap YES on your phone (Itel RS4). Waiting 60s...');
        await page.screenshot({ path: '/home/user/.openclaw/workspace/d4-2fa.png' });
        await page.waitForTimeout(60000);
      }
      
      // Allow Cloudflare
      const allowBtn = page.locator('button:has-text("Allow")').first();
      if (await allowBtn.isVisible().catch(() => false)) {
        await allowBtn.click();
        await page.waitForTimeout(5000);
      }
    }
    
    await page.screenshot({ path: '/home/user/.openclaw/workspace/d5-dashboard.png' });
    console.log('Final URL:', page.url());
    
    // Step 4: Navigate to Workers
    if (page.url().includes('dash.cloudflare.com')) {
      console.log('On Cloudflare dashboard!');
      
      // Go to Workers & Pages
      await page.goto('https://dash.cloudflare.com/0becfc9754d51754f5436cac5c1bfa5b/workers-and-pages');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/home/user/.openclaw/workspace/d6-workers.png' });
      
      // Find payment-gateway project
      const project = page.locator('text=payment-gateway').first();
      if (await project.isVisible().catch(() => false)) {
        await project.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/home/user/.openclaw/workspace/d7-project.png' });
        
        // Navigate to Deployments tab
        const deploymentsTab = page.locator('a:has-text("Deployments"), button:has-text("Deployments")').first();
        if (await deploymentsTab.isVisible().catch(() => false)) {
          await deploymentsTab.click();
          await page.waitForTimeout(2000);
        }
        
        // Find and click redeploy/retry button
        const redeployBtn = page.locator('button:has-text("Redeploy"), button:has-text("Retry"), button:has-text("Deploy")').first();
        if (await redeployBtn.isVisible().catch(() => false)) {
          await redeployBtn.click();
          console.log('🎉 REDEPLOY CLICKED! Waiting for build...');
          await page.waitForTimeout(15000);
          await page.screenshot({ path: '/home/user/.openclaw/workspace/d8-deployed.png' });
        } else {
          console.log('No redeploy button found');
        }
      } else {
        console.log('Project not found');
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/d-error.png' });
  }
  
  console.log('Done. Browser will close in 30s...');
  await page.waitForTimeout(30000);
  await browser.close();
})();
