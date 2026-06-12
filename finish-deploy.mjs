import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18805');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages.find(p => !p.url().includes('sw.js')) || pages[0];
  
  console.log('Current URL:', page.url());
  await page.screenshot({ path: '/home/user/.openclaw/workspace/fd1-dashboard.png' });
  
  try {
    // Navigate to Workers & Pages
    await page.goto('https://dash.cloudflare.com/0becfc9754d51754f5436cac5c1bfa5b/workers-and-pages');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/fd2-workers.png' });
    console.log('Workers page loaded');
    
    // Find payment-gateway project
    const project = page.locator('text=payment-gateway').first();
    if (await project.isVisible().catch(() => false)) {
      await project.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/home/user/.openclaw/workspace/fd3-project.png' });
      console.log('Project clicked');
      
      // Check deployments tab
      const deploymentsTab = page.locator('a:has-text("Deployments"), button:has-text("Deployments")').first();
      if (await deploymentsTab.isVisible().catch(() => false)) {
        await deploymentsTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/home/user/.openclaw/workspace/fd4-deployments.png' });
        console.log('Deployments tab clicked');
        
        // Look for redeploy/retry button
        const redeployBtn = page.locator('button:has-text("Redeploy"), button:has-text("Retry"), button:has-text("Deploy")').first();
        if (await redeployBtn.isVisible().catch(() => false)) {
          await redeployBtn.click();
          console.log('🎉 REDEPLOY CLICKED!');
          await page.waitForTimeout(15000);
          await page.screenshot({ path: '/home/user/.openclaw/workspace/fd5-redeployed.png' });
        } else {
          console.log('No redeploy button found');
          
          // Maybe build already succeeded - check for success indicator
          const pageText = await page.textContent('body');
          if (pageText.includes('Success') || pageText.includes('Deployed')) {
            console.log('Build already successful!');
          }
        }
      }
      
      // Set variables/secrets
      await page.goto('https://dash.cloudflare.com/0becfc9754d51754f5436cac5c1bfa5b/workers-and-pages/payment-gateway/settings/environment-variables');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/home/user/.openclaw/workspace/fd6-variables.png' });
      console.log('Variables page');
      
      // Look for add variable button
      const addVarBtn = page.locator('button:has-text("Add variable"), button:has-text("Add"), a:has-text("Add variable")').first();
      if (await addVarBtn.isVisible().catch(() => false)) {
        await addVarBtn.click();
        await page.waitForTimeout(1000);
        
        // Fill RESEND_API_KEY
        const nameInput = page.locator('input[placeholder="Name"], input[name="name"]').first();
        const valueInput = page.locator('input[placeholder="Value"], input[name="value"], textarea[name="value"]').first();
        
        if (await nameInput.isVisible().catch(() => false)) {
          await nameInput.fill('RESEND_API_KEY');
          await valueInput.fill('re_UHDQW54J_NtjHLu5XVt2rDS44Mi2DzXcw');
          
          await page.click('button:has-text("Save"), button:has-text("Add")').first();
          console.log('RESEND_API_KEY added!');
          await page.waitForTimeout(2000);
        }
      }
    } else {
      console.log('payment-gateway project not found');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/fd-error.png' });
  }
  
  await page.screenshot({ path: '/home/user/.openclaw/workspace/fd-final.png' });
  console.log('Done!');
  await page.waitForTimeout(10000);
  await browser.close();
})();
