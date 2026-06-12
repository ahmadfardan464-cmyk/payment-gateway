import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18805');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages.find(p => !p.url().includes('sw.js')) || pages[0];
  
  try {
    // Step 1: Redeploy via direct URL
    await page.goto('https://dash.cloudflare.com/0becfc9754d51754f5436cac5c1bfa5b/workers-and-pages/payment-gateway/deployments');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/ji1.png' });
    
    // Try to find and click any deploy/redeploy button via JS
    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const text = btn.textContent || btn.innerText || '';
        if (text.toLowerCase().includes('redeploy') || text.toLowerCase().includes('retry') || text.toLowerCase().includes('deploy')) {
          btn.click();
          return text;
        }
      }
      return null;
    });
    console.log('Clicked button:', clicked);
    
    if (clicked) {
      await page.waitForTimeout(15000);
      await page.screenshot({ path: '/home/user/.openclaw/workspace/ji2.png' });
    }
    
    // Step 2: Set variables via JS injection
    await page.goto('https://dash.cloudflare.com/0becfc9754d51754f5436cac5c1bfa5b/workers-and-pages/payment-gateway/settings/environment-variables');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/ji3.png' });
    
    // Click Add button via JS
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const text = btn.textContent || btn.innerText || '';
        if (text.toLowerCase().includes('add')) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/ji4.png' });
    
    // Fill form via JS
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea');
      for (const input of inputs) {
        const placeholder = input.placeholder || '';
        const name = input.name || '';
        if (placeholder.toLowerCase().includes('name') || name.toLowerCase().includes('key') || name.toLowerCase().includes('name')) {
          input.value = 'RESEND_API_KEY';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (placeholder.toLowerCase().includes('value') || name.toLowerCase().includes('value')) {
          input.value = 're_UHDQW54J_NtjHLu5XVt2rDS44Mi2DzXcw';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      
      // Click save
      const saveBtns = document.querySelectorAll('button');
      for (const btn of saveBtns) {
        const text = btn.textContent || btn.innerText || '';
        if (text.toLowerCase().includes('save') || text.toLowerCase().includes('deploy')) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/ji5.png' });
    console.log('Variables set attempted');
    
  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/ji-error.png' });
  }
  
  console.log('Done!');
  await page.waitForTimeout(5000);
  await browser.close();
})();
