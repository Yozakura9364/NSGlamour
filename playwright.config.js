const {
  describePreferredSystemBrowser,
  getPreferredPlaywrightLaunchOptions,
} = require("./scripts/playwright-system-browser");

const launchOptions = getPreferredPlaywrightLaunchOptions();

console.log(`[playwright] ${describePreferredSystemBrowser()}`);

module.exports = {
  testDir: "./tests",
  reporter: "list",
  use: {
    headless: true,
    launchOptions,
  },
};
