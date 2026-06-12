import { chromium } from 'playwright';

const EMAIL = 'ahmadfardan464@gmail.com';
const PASSWORD = '***';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18802');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages[0];
  
  console.log('Current URL:', page.url());
  
  if (!page.url().includes('github.com/login')) {
    await page.goto('https://github.com/login');
    await page.waitForTimeout(3000);
  }
  
  await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-login.png' });
  
  // Fill login form
  await page.fill('input[name="login"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('input[type="submit"], button[type="submit"]');
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-after-login.png' });
  
  console.log('URL after login:', page.url());
  
  // Handle 2FA if needed
  if (page.url().includes('/sessions/two-factor')) {
    console.log('2FA required - waiting 45s');
    await page.waitForTimeout(45000);
  }
  
  // Check if logged in
  if (page.url().includes('github.com')) {
    console.log('On GitHub');
    
    // Navigate to token settings
    await page.goto('https://github.com/settings/tokens/new');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-token.png' });
    
    // Fill token form
    await page.fill('input[name="oauth_access_token[note]"]', 'OpenClaw Deploy');
    await page.check('input[value="workflow"]');
    await page.check('input[value="repo"]');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-token-created.png' });
    
    console.log('Token created!');
  }
  
  await browser.close();
})();
