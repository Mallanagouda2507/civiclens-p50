/**
 * BasePage - Page Object Model Base Class for CivicLens Selenium E2E
 */
const path = require('path');
const backendDir = path.join(__dirname, '../../../backend');
const { By, until } = require(path.join(backendDir, 'node_modules/selenium-webdriver'));

class BasePage {
  constructor(driver, baseUrl = 'http://localhost:5174') {
    this.driver = driver;
    this.baseUrl = baseUrl;
  }

  async navigate(endpoint = '') {
    await this.driver.get(`${this.baseUrl}${endpoint}`);
  }

  async getTitle() {
    return await this.driver.getTitle();
  }

  async waitForElement(locator, timeoutMs = 10000) {
    return await this.driver.wait(until.elementLocated(locator), timeoutMs);
  }

  async click(locator) {
    const el = await this.waitForElement(locator);
    await el.click();
    return el;
  }

  async type(locator, text) {
    const el = await this.waitForElement(locator);
    await el.clear();
    await el.sendKeys(text);
    return el;
  }
}

module.exports = BasePage;
