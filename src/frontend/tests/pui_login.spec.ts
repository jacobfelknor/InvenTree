import { expect, test } from './baseFixtures.js';
import { logoutUrl, user } from './defaults.js';
import { navigate } from './helpers.js';
import { doLogin, doQuickLogin } from './login.js';

test('Login - Basic Test', async ({ page }) => {
  await doLogin(page);

  // Check that the username is provided
  await page.getByText(user.username);

  // Logout (via menu)
  await page.getByRole('button', { name: 'Ally Access' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();

  await page.waitForURL('**/web/login');
  await page.getByLabel('username');
});

test('Login - Quick Test', async ({ page }) => {
  await doQuickLogin(page);

  // Check that the username is provided
  await page.getByText(user.username);

  await expect(page).toHaveTitle(/^InvenTree/);

  // Go to the dashboard
  await navigate(page, '');
  await page.waitForURL('**/web');

  await page.getByText('InvenTree Demo Server - ').waitFor();

  // Logout (via URL)
  await navigate(page, 'logout');
  await page.waitForURL('**/web/login');
  await page.getByLabel('username');
});

/**
 * Test various types of login failure
 */
test('Login - Failures', async ({ page }) => {
  const loginWithError = async () => {
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.getByText('Login failed').waitFor();
    await page.getByText('Check your input and try again').waitFor();
    await page.locator('#login').getByRole('button').click();
  };

  // Navigate to the 'login' page
  await navigate(page, logoutUrl);
  await expect(page).toHaveTitle(/^InvenTree.*$/);
  await page.waitForURL('**/web/login');

  // Attempt login with invalid credentials
  await page.getByLabel('login-username').fill('invalid user');
  await page.getByLabel('login-password').fill('invalid password');

  await loginWithError();

  // Attempt login with valid (but disabled) user
  await page.getByLabel('login-username').fill('ian');
  await page.getByLabel('login-password').fill('inactive');

  await loginWithError();

  // Attempt login with no username
  await page.getByLabel('login-username').fill('');
  await page.getByLabel('login-password').fill('hunter2');

  await loginWithError();

  // Attempt login with no password
  await page.getByLabel('login-username').fill('ian');
  await page.getByLabel('login-password').fill('');

  await loginWithError();
});

test('Login - Change Password', async ({ page }) => {
  await doQuickLogin(page, 'noaccess', 'youshallnotpass');

  // Navigate to the 'change password' page
  await navigate(page, 'settings/user/account');
  await page.getByLabel('action-menu-account-actions').click();
  await page.getByLabel('action-menu-account-actions-change-password').click();

  // First attempt with some errors
  await page.getByLabel('password', { exact: true }).fill('youshallnotpass');
  await page.getByLabel('input-password-1').fill('12345');
  await page.getByLabel('input-password-2').fill('54321');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByText('The two password fields didn’t match').waitFor();

  await page.getByLabel('input-password-2').fill('12345');
  await page.getByRole('button', { name: 'Confirm' }).click();

  await page.getByText('This password is too short').waitFor();
  await page.getByText('This password is entirely numeric').waitFor();

  await page.getByLabel('input-password-1').fill('youshallnotpass');
  await page.getByLabel('input-password-2').fill('youshallnotpass');
  await page.getByRole('button', { name: 'Confirm' }).click();

  await page.getByText('Password Changed').waitFor();
  await page.getByText('The password was set successfully').waitFor();

  await page.waitForTimeout(1000);
});
