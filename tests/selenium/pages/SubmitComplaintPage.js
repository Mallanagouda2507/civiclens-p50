/**
 * SubmitComplaintPage - Page Object for Complaint Submission View
 */
const path = require('path');
const backendDir = path.join(__dirname, '../../../backend');
const { By, until } = require(path.join(backendDir, 'node_modules/selenium-webdriver'));
const BasePage = require('./BasePage');

class SubmitComplaintPage extends BasePage {
  constructor(driver, baseUrl) {
    super(driver, baseUrl);
    this.formLocator = By.id('complaint-form');
    this.titleInput = By.name('title');
    this.descInput = By.name('description');
    this.addressInput = By.name('address');
    this.submitBtn = By.css('button[type="submit"]');
    this.feedbackAlert = By.css('.bg-emerald-50, .border-emerald-200, [role="alert"]');
  }

  async navigateToSubmitPage() {
    await this.navigate('/submit');
    await this.waitForElement(this.titleInput);
  }

  async fillComplaintForm({ title, description, address, coordinates }) {
    await this.type(this.titleInput, title);
    await this.type(this.descInput, description);
    if (address) {
      await this.type(this.addressInput, address);
    }
  }

  async submit() {
    await this.click(this.submitBtn);
  }

  async getFeedbackText() {
    const alert = await this.waitForElement(this.feedbackAlert, 8000);
    return await alert.getText();
  }
}

module.exports = SubmitComplaintPage;
