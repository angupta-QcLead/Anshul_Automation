const { Given, When, Then, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { chromium } = require('playwright');
//test

setDefaultTimeout(60 * 1000);
 // increase timeout for UI steps

let browser, context, page;

Before(async function () {
  browser = await chromium.launch({ headless: false }); // set true for CI
  context = await browser.newContext();
  page = await context.newPage();
  this.page = page;
});

After(async function () {
  await browser.close();
});

Given('I navigate to the login page', async function () {
  await this.page.goto('https://practicetestautomation.com/practice-test-login/?utm_source=chatgpt.com');
});

When('I enter username {string} and password {string}', async function (username, password) {
   //await this.page.goto('https://practicetestautomation.com/practice-test-login/?utm_source=chatgpt.com');
  //await this.page.waitForLoadState('domcontentloaded');
  await this.page.waitForSelector('#username');
  await this.page.fill('#username', username);
  await this.page.fill('#password', password);

await this.page.locator('#submit').click();



});

Then('I should see the dashboard', async function () {
  await this.page.waitForSelector('h1:has-text("Logged In Successfully")');
});

// success message appears after login

