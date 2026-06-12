import { chromium } from 'playwright';

const EMAIL = 'ahmadfardan464@gmail.com';
const PASSWORD = '***';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18801');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages[0];
  
  await page.goto('https://dashboard.stripe.com/register');
  await page.waitForTimeout(3000);
  
  // Click Google via JS
  await page.evaluate(() => {
    const btn = document.querySelector('#continue_with_google') || 
                document.querySelector('button[data-testid="google-sign-in"]') ||
                Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Google'));
    if (btn) btn.click();
  });
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/fa1-after-google-click.png' });
  
  // Check if new page/popup opened
  const allPages = context.pages();
  console.log('All pages:', allPages.map(p => p.url()));
  
  // Find Google page
  let googlePage = allPages.find(p => p.url().includes('accounts.google.com'));
  if (googlePage) {
    console.log('Google page found!');
    page = googlePage;
  }
  
  if (page.url().includes('accounts.google.com')) {
    await page.fill('input[type="email"], input[name="identifier"]', EMAIL);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000);
    
    await page.fill('input[type="password"]', PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    
    if (page.url().includes('/challenge/')) {
      console.log('2FA - waiting 45s');
      await page.waitForTimeout(45000);
    }
    
    const allowBtn = page.locator('button:has-text("Allow")').first();
    if (await allowBtn.isVisible().catch(() => false)) {
      await allowBtn.click();
    }
    await page.waitForTimeout(8000);
  }
  
  await page.screenshot({ path: '/home/user/.openclaw/workspace/fa2-final.png' });
  console.log('Final URL:', page.url());
  
  // Navigate to API keys
  await page.goto('https://dashboard.stripe.com/apikeys');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/fa3-apikeys.png' });
  
  const bodyText = await page.textContent('body');
  const skMatch = bodyText.match(/sk_test_[a-zA-Z0-9]{24,}/);
  if (skMatch) console.log('SECRET_KEY:', skMatch[0]);
  else console.log('No keys. URL:', page.url());
  
  await browser.close();
})();
