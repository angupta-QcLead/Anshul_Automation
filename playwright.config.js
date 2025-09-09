// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',       // ✅ your tests folder
  retries: 1,
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [
    ['list'],                                      // console output
    ['json', { outputFile: 'results/report.json' }], // JSON output
    ['junit', { outputFile: 'results/test-results.xml' }], // 🔑 JUnit for Testmo
    ['line'],                                     // simple line reporter
    ['allure-playwright']                         // Allure integration
  ],
});
