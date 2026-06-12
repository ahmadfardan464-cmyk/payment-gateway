import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18805');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages.find(p => !p.url().includes('sw.js')) || pages[0];
  
  console.log('URL:', page.url());
  
  try {
    // Navigate directly to project deployments
    await page.goto('https://dash.cloudflare.com/0becfc9754d51754f5436cac5c1bfa5b/workers-and-pages/payment-gateway/deployments');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/sd1-deployments.png' });
    console.log('Deployments page loaded');
    
    // Look for redeploy button with multiple selectors
    const redeploySelectors = [
      'button:has-text("Redeploy")',
      'button:has-text("Retry")', 
      'button:has-text("Deploy")',
      'button[data-testid="redeploy"]',
      'a:has-text("Redeploy")'
    ];
    
    for (const sel of redeploySelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ force: true });
        console.log('Clicked:', sel);
        await page.waitForTimeout(15000);
        await page.screenshot({ path: '/home/user/.openclaw/workspace/sd2-redeployed.png' });
        break;
      }
    }
    
    // Navigate to settings/variables
    await page.goto('https://dash.cloudflare.com/0becfc9754d51754f5436cac5c1bfa5b/workers-and-pages/payment-gateway/settings/environment-variables');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/sd3-variables.png' });
    console.log('Variables page');
    
    // Add RESEND_API_KEY
    const addBtn = page.locator('button:has-text("Add"), button:has-text("Add variable")').first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click({ force: true });
      await page.waitForTimeout(1000);
      
      await page.fill('input[placeholder*="name" i], input[name="key"]', 'RESEND_API_KEY');
      await page.fill('input[placeholder*="value" i], textarea[name="value"]', 're_UHDQW54J_NtjHLu5XVt2rDS44Mi2DzXcw');
      
      await page.click('button:has-text("Save"), button:has-text("Deploy")').first();
      console.log('RESEND_API_KEY saved!');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/home/user/.openclaw/workspace/sd4-saved.png' });
    }
    
  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/sd-error.png' });
  }
  
  console.log('Done!');
  await page.waitForTimeout(5000);
  await browser.close();
})();
