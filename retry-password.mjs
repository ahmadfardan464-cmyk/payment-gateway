import { chromium } from 'playwright';

const PASSWORD = '***';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18806');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages[0];
  
  console.log('URL:', page.url());
  await page.screenshot({ path: '/home/user/.openclaw/workspace/rp-start.png' });
  
  if (page.url().includes('accounts.google.com')) {
    console.log('On Google page');
    
    // Find password field
    const passField = page.locator('input[type="password"]').first();
    if (await passField.isVisible().catch(() => false)) {
      // Clear and type password character by character
      await passField.click();
      await passField.fill('');
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
      
      // Type slowly
      for (const char of PASSWORD) {
        await page.keyboard.press(char);
        await page.waitForTimeout(50);
      }
      
      console.log('Password typed');
      await page.screenshot({ path: '/home/user/.openclaw/workspace/rp-filled.png' });
      
      // Click Next button instead of Enter
      const nextBtn = page.locator('button:has-text("Next"), #passwordNext, span:has-text("Next")').first();
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        console.log('Clicked Next');
      } else {
        await page.keyboard.press('Enter');
      }
      
      await page.waitForTimeout(5000);
      await page.screenshot({ path: '/home/user/.openclaw/workspace/rp-after-submit.png' });
      
      // Check for 2FA
      if (page.url().includes('/challenge/')) {
        console.log('2FA! Ezlik, tap YES on phone. Waiting 60s...');
        await page.waitForTimeout(60000);
      }
      
      // Check for Allow
      const allowBtn = page.locator('button:has-text("Allow")').first();
      if (await allowBtn.isVisible().catch(() => false)) {
        await allowBtn.click();
        await page.waitForTimeout(5000);
      }
    }
  }
  
  console.log('Final URL:', page.url());
  await page.screenshot({ path: '/home/user/.openclaw/workspace/rp-final.png' });
  
  await page.waitForTimeout(10000);
  await browser.close();
})();
