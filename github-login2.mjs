import { chromium } from 'playwright';

const EMAIL = 'ahmadfardan464@gmail.com';
const PASSWORD = '***';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18802');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages[0];
  
  console.log('URL:', page.url());
  
  // Handle Google OAuth for GitHub
  if (page.url().includes('accounts.google.com')) {
    console.log('Google auth page - filling...');
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
    
    // Click Allow for GitHub
    const allowBtn = page.locator('button:has-text("Allow")').first();
    if (await allowBtn.isVisible().catch(() => false)) {
      await allowBtn.click();
      await page.waitForTimeout(5000);
    }
  }
  
  console.log('Final URL:', page.url());
  await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-final.png' });
  
  // If on GitHub, try to create token
  if (page.url().includes('github.com') && !page.url().includes('login')) {
    console.log('Logged in to GitHub!');
    
    await page.goto('https://github.com/settings/tokens/new');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-token-page.png' });
    
    // Note field might have different selector
    const noteInput = page.locator('input[name="oauth_access_token[note]"], input[placeholder*="Note"], input[id="oauth_access_token_note"]').first();
    if (await noteInput.isVisible().catch(() => false)) {
      await noteInput.fill('OpenClaw Deploy');
    }
    
    // Check scopes
    await page.check('input[value="workflow"]').catch(() => console.log('workflow checkbox not found'));
    await page.check('input[value="repo"]').catch(() => console.log('repo checkbox not found'));
    
    await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-token-filled.png' });
    
    const submitBtn = page.locator('button:has-text("Generate token"), button[type="submit"]').first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/home/user/.openclaw/workspace/gh-token-result.png' });
      console.log('Token creation attempted');
    }
  }
  
  await browser.close();
})();
