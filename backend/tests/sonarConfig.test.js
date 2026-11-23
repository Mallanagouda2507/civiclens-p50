const fs = require('fs');
const path = require('path');

describe('SonarQube Configuration Verification (sonar-project.properties)', () => {
  const sonarPropertiesPath = path.join(__dirname, '../../sonar-project.properties');
  let propertiesContent;

  beforeAll(() => {
    expect(fs.existsSync(sonarPropertiesPath)).toBe(true);
    propertiesContent = fs.readFileSync(sonarPropertiesPath, 'utf8');
  });

  it('should define correct project identification keys', () => {
    expect(propertiesContent).toMatch(/sonar\.projectKey=civiclens-municipal-portal/);
    expect(propertiesContent).toMatch(/sonar\.projectName=CivicLens - Municipal Complaint Portal with Geotagging/);
    expect(propertiesContent).toMatch(/sonar\.projectVersion=1\.0\.0/);
  });

  it('should specify correct backend and frontend source directories', () => {
    expect(propertiesContent).toMatch(/sonar\.sources=.*backend\/controllers.*frontend\/src/);
  });

  it('should specify test directories including backend tests and selenium', () => {
    expect(propertiesContent).toMatch(/sonar\.tests=backend\/tests,tests\/selenium/);
    expect(propertiesContent).toMatch(/sonar\.test\.inclusions=.*backend\/tests\/\*\*\/\*\.test\.js/);
  });

  it('should configure exclusions for node_modules, dist, coverage, and test results', () => {
    expect(propertiesContent).toMatch(/sonar\.exclusions=.*node_modules/);
    expect(propertiesContent).toMatch(/sonar\.exclusions=.*frontend\/dist/);
    expect(propertiesContent).toMatch(/sonar\.exclusions=.*backend\/coverage/);
    expect(propertiesContent).toMatch(/sonar\.exclusions=.*test-results/);
  });

  it('should import the Jest LCOV coverage report path', () => {
    expect(propertiesContent).toMatch(/sonar\.javascript\.lcov\.reportPaths=backend\/coverage\/lcov\.info/);
  });
});
