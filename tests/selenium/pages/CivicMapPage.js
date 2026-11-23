/**
 * CivicMapPage - Page Object for Interactive Leaflet Civic Map View
 */
const path = require('path');
const backendDir = path.join(__dirname, '../../../backend');
const { By, until } = require(path.join(backendDir, 'node_modules/selenium-webdriver'));
const BasePage = require('./BasePage');

class CivicMapPage extends BasePage {
  constructor(driver, baseUrl) {
    super(driver, baseUrl);
    this.mapContainer = By.css('.leaflet-container');
    this.tilePane = By.css('.leaflet-tile-pane');
    this.markerPane = By.css('.leaflet-marker-pane');
    this.filterDropdown = By.name('departmentFilter');
  }

  async navigateToMap() {
    await this.navigate('/map');
    await this.waitForElement(this.mapContainer, 10000);
  }

  async isMapRendered() {
    const container = await this.waitForElement(this.mapContainer);
    const tilePane = await this.waitForElement(this.tilePane);
    return (await container.isDisplayed()) && (tilePane !== null);
  }
}

module.exports = CivicMapPage;
