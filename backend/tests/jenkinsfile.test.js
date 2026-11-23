const fs = require('fs');
const path = require('path');

describe('Jenkinsfile Declarative Pipeline Verification (Priority 2)', () => {
  const jenkinsfilePath = path.join(__dirname, '../../Jenkinsfile');
  let content;

  beforeAll(() => {
    expect(fs.existsSync(jenkinsfilePath)).toBe(true);
    content = fs.readFileSync(jenkinsfilePath, 'utf8');
  });

  it('should be a valid declarative pipeline structure', () => {
    expect(content).toMatch(/pipeline\s*\{/);
    expect(content).toMatch(/agent\s+any/);
    expect(content).toMatch(/stages\s*\{/);
    expect(content).toMatch(/post\s*\{/);
  });

  it('should define all 7 required stages', () => {
    const requiredStages = [
      'Checkout',
      'Install Dependencies',
      'Backend Lint & Checks',
      'Frontend Build',
      'Backend Tests',
      'Test Coverage',
      'Build Verification'
    ];

    for (const stageName of requiredStages) {
      const stageRegex = new RegExp(`stage\\(['"]${stageName}['"]\\)`);
      expect(content).toMatch(stageRegex);
    }
  });

  it('should have balanced curly braces throughout the file', () => {
    let openCount = 0;
    for (const char of content) {
      if (char === '{') openCount++;
      if (char === '}') openCount--;
    }
    expect(openCount).toBe(0);
  });

  it('should contain zero hardcoded deployment passwords or secrets', () => {
    expect(content).not.toMatch(/password\s*=\s*['"][^'"]+['"]/i);
    expect(content).not.toMatch(/api_key\s*=\s*['"][^'"]+['"]/i);
    expect(content).not.toMatch(/aws_secret/i);
  });

  it('should archive coverage and distribution artifacts in post blocks', () => {
    expect(content).toMatch(/archiveArtifacts artifacts:\s*['"]backend\/coverage\/\*\*['"]/);
    expect(content).toMatch(/archiveArtifacts artifacts:\s*['"]frontend\/dist\/\*\*['"]/);
  });
});
