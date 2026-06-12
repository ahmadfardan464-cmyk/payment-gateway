import { chromium } from 'playwright';

const USERNAME = 'ahmadfardan464';
const PASSWORD = '***';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18802');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages[0];
  
  // Go to GitHub login
  await page.goto('https://github.com/login');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-form.png' });
  
  // Fill username (not email) and password directly
  await page.fill('input[name="login"]', USERNAME);
  await page.fill('input[name="password"]', PASSWORD);
  
  // Click Sign in button
  await page.click('input[type="submit"], button[type="submit"]');
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-form-after.png' });
  console.log('URL after login:', page.url());
  
  // Handle 2FA if needed
  if (page.url().includes('/sessions/two-factor') || page.url().includes('/auth')) {
    console.log('2FA or auth required - waiting 45s');
    await page.waitForTimeout(45000);
  }
  
  // If logged in, go to token page
  if (page.url().includes('github.com') && !page.url().includes('login')) {
    console.log('Logged in!');
    
    await page.goto('https://github.com/settings/tokens/new');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-token-new.png' });
    
    // Fill token form
    const noteInput = page.locator('input[name="oauth_access_token[note]"], #oauth_access_token_note').first();
    if (await noteInput.isVisible().catch(() => false)) {
      await noteInput.fill('OpenClaw Deploy');
    }
    
    // Check workflow scope
    await page.check('input[value="workflow"]').catch(() => {});
    await page.check('input[value="repo"]').catch(() => {});
    
    await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-token-filled.png' });
    
    // Generate token
    await page.click('button:has-text("Generate token")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-token-result.png' });
    
    // Extract token from page
    const tokenText = await page.textContent('pre, .token').catch(() => '');
    if (tokenText.includes('ghp_')) {
      console.log('Token found:', tokenText.match(/ghp_[a-zA-Z0-9]+/)?.[0]);
    }
  }
  
  await browser.close();
})();
