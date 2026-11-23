/**
 * CivicLens P50 - Selenium WebDriver Automated E2E Test Suite
 *
 * Verifies:
 * 1. Opening the application and verifying brand header
 * 2. Navigating to and loading the complaint submission form
 * 3. Submitting a complaint with valid form data & geotag
 * 4. Verifying submission feedback and unique tracking ID generation
 * 5. Navigating to the Civic Map and verifying Leaflet map rendering
 */

const path = require('path');
const fs = require('fs');

// Resolve modules from backend/node_modules
const backendDir = path.join(__dirname, '../../backend');
const express = require(path.join(backendDir, 'node_modules/express'));
const { Builder, By, until } = require(path.join(backendDir, 'node_modules/selenium-webdriver'));
const chrome = require(path.join(backendDir, 'node_modules/selenium-webdriver/chrome'));

// Load backend app and dataStore
const backendApp = require('../../backend/server');
const { dataStore } = require('../../backend/services/dataStore');

const TEST_PORT = 5174;

async function runSuite() {
  console.log('===============================================================');
  console.log(' CivicLens P50 - Selenium WebDriver E2E Automated Verification');
  console.log('===============================================================');

  const testReport = {
    testSuite: 'CivicLens Selenium E2E Suite',
    timestamp: new Date().toISOString(),
    browser: 'Google Chrome (Headless)',
    totalActions: 5,
    passedActions: 0,
    failedActions: 0,
    steps: []
  };

  // 1. Setup unified test server serving frontend/dist and mounting backend /api
  const unifiedApp = express();
  unifiedApp.use(express.static(path.join(__dirname, '../../frontend/dist')));
  unifiedApp.use(backendApp);

  let server;
  await new Promise((resolve) => {
    server = unifiedApp.listen(TEST_PORT, async () => {
      console.log(`[E2E Server] Unified CivicLens test server running at http://localhost:${TEST_PORT}`);
      await dataStore.initDefaults();
      resolve();
    });
  });

  // 2. Configure Chrome Headless Options
  const chromeOptions = new chrome.Options();
  chromeOptions.addArguments(
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--window-size=1280,800'
  );
  chromeOptions.setChromeBinaryPath('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');

  let driver;
  try {
    console.log('[Selenium] Initializing WebDriver for Chrome...');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build();
    console.log('[Selenium] Browser instance launched successfully.');

    // -------------------------------------------------------------
    // Test Action 1: Opening the application
    // -------------------------------------------------------------
    console.log('\n--> Action 1: Opening the application...');
    const startTime1 = Date.now();
    await driver.get(`http://localhost:${TEST_PORT}`);
    await driver.wait(until.elementLocated(By.tagName('header')), 10000);
    const title = await driver.getTitle();

    if (title.includes('CivicLens')) {
      console.log(`    √ Application opened. Title: "${title}" (${Date.now() - startTime1}ms)`);
      testReport.steps.push({
        name: 'Action 1: Opening the application',
        status: 'PASSED',
        details: `Page loaded with title: ${title}`
      });
      testReport.passedActions++;
    } else {
      throw new Error(`Unexpected page title: ${title}`);
    }

    // -------------------------------------------------------------
    // Test Action 2: Loading the complaint submission page
    // -------------------------------------------------------------
    console.log('\n--> Action 2: Loading complaint submission page...');
    const startTime2 = Date.now();
    const fileComplaintTab = await driver.findElement(
      By.xpath("//button[contains(., 'File Complaint')]")
    );
    // Use JS click to guarantee triggering React synthetic event in headless mode
    await driver.executeScript("arguments[0].click();", fileComplaintTab);

    // Wait for the submission form title to be visible
    await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(., 'File a Municipal Grievance')]")),
      8000
    );

    const titleInput = await driver.findElement(By.name('title'));
    const descInput = await driver.findElement(By.name('description'));
    const addressInput = await driver.findElement(By.name('address'));

    if (titleInput && descInput && addressInput) {
      console.log(`    √ Complaint submission form loaded successfully with all required inputs (${Date.now() - startTime2}ms)`);
      testReport.steps.push({
        name: 'Action 2: Loading complaint submission page',
        status: 'PASSED',
        details: 'Submission form loaded with title, description, address, and interactive map picker'
      });
      testReport.passedActions++;
    }

    // -------------------------------------------------------------
    // Test Action 3: Submitting a complaint with valid information
    // -------------------------------------------------------------
    console.log('\n--> Action 3: Submitting complaint with valid information...');
    const startTime3 = Date.now();
    const testComplaintTitle = 'Selenium P50 Automated Test: Road Pothole Indiranagar';
    const testComplaintDesc = 'Major asphalt crater verified by automated Selenium WebDriver integration test suite.';
    const testAddress = '100ft Road, Near Metro Pillar 82, Indiranagar, Bengaluru';

    await titleInput.clear();
    await titleInput.sendKeys(testComplaintTitle);

    await descInput.clear();
    await descInput.sendKeys(testComplaintDesc);

    await addressInput.clear();
    await addressInput.sendKeys(testAddress);

    // Click submit button
    const submitBtn = await driver.findElement(By.xpath("//button[@type='submit']"));
    await driver.executeScript("arguments[0].click();", submitBtn);
    console.log(`    √ Form fields populated and submission triggered (${Date.now() - startTime3}ms)`);
    testReport.steps.push({
      name: 'Action 3: Submitting a complaint with valid information',
      status: 'PASSED',
      details: `Submitted: "${testComplaintTitle}" at "${testAddress}"`
    });
    testReport.passedActions++;

    // -------------------------------------------------------------
    // Test Action 4: Verifying complaint submission feedback
    // -------------------------------------------------------------
    console.log('\n--> Action 4: Verifying complaint submission feedback...');
    const startTime4 = Date.now();
    // Wait for success confirmation card
    await driver.wait(
      until.elementLocated(By.xpath("//h2[contains(., 'Grievance Lodged Successfully!')]")),
      10000
    );

    // Locate tracking ID
    const trackingIdElement = await driver.findElement(
      By.xpath("//span[contains(text(), 'CL-2026-')]")
    );
    const trackingIdText = await trackingIdElement.getText();

    if (trackingIdText.startsWith('CL-2026-')) {
      console.log(`    √ Submission feedback confirmed! Generated Tracking ID: ${trackingIdText} (${Date.now() - startTime4}ms)`);
      testReport.steps.push({
        name: 'Action 4: Verifying complaint submission feedback',
        status: 'PASSED',
        details: `Confirmed feedback banner and tracking reference ID: ${trackingIdText}`
      });
      testReport.passedActions++;
    } else {
      throw new Error(`Invalid tracking ID received: ${trackingIdText}`);
    }

    // -------------------------------------------------------------
    // Test Action 5: Verifying that the Leaflet map renders
    // -------------------------------------------------------------
    console.log('\n--> Action 5: Verifying Leaflet map rendering...');
    const startTime5 = Date.now();
    const civicMapTab = await driver.findElement(
      By.xpath("//button[contains(., 'Civic Map')]")
    );
    await driver.executeScript("arguments[0].click();", civicMapTab);

    // Wait for the Leaflet map container to be created and initialized
    await driver.wait(
      until.elementLocated(By.css('.leaflet-container')),
      10000
    );

    // Wait for leaflet tile pane or marker layer
    await driver.wait(
      until.elementLocated(By.css('.leaflet-tile-pane')),
      8000
    );

    const mapElement = await driver.findElement(By.css('.leaflet-container'));
    const isMapDisplayed = await mapElement.isDisplayed();

    if (isMapDisplayed) {
      console.log(`    √ Leaflet interactive GIS map rendered and displayed (${Date.now() - startTime5}ms)`);
      testReport.steps.push({
        name: 'Action 5: Verifying Leaflet map renders',
        status: 'PASSED',
        details: 'Leaflet GIS map container (.leaflet-container) and tile pane successfully initialized and rendered'
      });
      testReport.passedActions++;
    } else {
      throw new Error('Leaflet map container found but isDisplayed returned false.');
    }

  } catch (error) {
    console.error(`\n[Selenium Error] Test failed: ${error.message}`);
    try {
      const logs = await driver.manage().logs().get('browser');
      console.error('BROWSER CONSOLE LOGS:', JSON.stringify(logs, null, 2));
      const html = await driver.getPageSource();
      console.error('CURRENT PAGE HTML:', html);
    } catch (e) {
      console.error('Could not retrieve browser logs/HTML:', e.message);
    }
    testReport.steps.push({
      name: 'Selenium Execution Failure',
      status: 'FAILED',
      error: error.message
    });
    testReport.failedActions++;
  } finally {
    if (driver) {
      console.log('\n[Selenium] Closing WebDriver session...');
      await driver.quit();
    }
    if (server) {
      console.log('[E2E Server] Closing test server...');
      server.close();
    }
  }

  // Ensure output evidence directory exists
  const resultsDir = path.join(__dirname, '../../test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const outputPath = path.join(resultsDir, 'selenium-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(testReport, null, 2));
  console.log(`\n[Evidence] Results written to: ${outputPath}`);

  console.log('\n===============================================================');
  console.log(` Selenium E2E Summary: ${testReport.passedActions} / ${testReport.totalActions} Actions Passed`);
  console.log('===============================================================');

  if (testReport.failedActions > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('[Fatal Error]:', err);
  process.exit(1);
});
