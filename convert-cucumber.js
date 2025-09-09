// convert-cucumber.js
// Robust converter: cucumber JSON -> junit XML (marks failures)
const fs = require('fs');
const builder = require('junit-report-builder');

const inputFile = 'results/cucumber.json';
const outputFile = 'results/cucumber.xml';

if (!fs.existsSync(inputFile)) {
  console.error('❌ Input file not found:', inputFile);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
} catch (e) {
  console.error('❌ Failed to parse JSON:', e.message);
  process.exit(1);
}

function getElements(feature) {
  return feature.elements || feature.children || feature.scenario || [];
}
function getSteps(scenario) {
  return scenario.steps || scenario.objects || scenario.children || [];
}
function getStepStatus(step) {
  if (!step) return 'unknown';
  if (step.result && step.result.status) return step.result.status;
  if (step.status) return step.status;
  if (step.step && step.step.result && step.step.result.status) return step.step.result.status;
  return 'unknown';
}
function getStepError(step) {
  if (!step) return null;
  if (step.result && (step.result.error_message || step.result.message)) return step.result.error_message || step.result.message;
  if (step.error_message) return step.error_message;
  return null;
}

data.forEach(feature => {
  const featureName = feature.name || feature.uri || 'Unnamed Feature';
  const elements = getElements(feature);

  // create a testsuite for the feature
  const suite = builder.testSuite().name(featureName);

  elements.forEach(scenario => {
    const keyword = (scenario.keyword || '').toLowerCase();
    const isScenario =
      (scenario.type && scenario.type.toLowerCase() === 'scenario') ||
      keyword.includes('scenario') ||
      keyword.includes('scenario outline');

    if (!isScenario) return;

    const scenarioName = scenario.name || 'Unnamed Scenario';
    const testCase = suite.testCase().className(featureName).name(scenarioName);

    const steps = getSteps(scenario);
    let failed = false;
    const failureMessages = [];

    // Inspect every step for non-passed status
    steps.forEach((step, idx) => {
      const status = (getStepStatus(step) || '').toLowerCase();
      if (status !== 'passed') {
        // treat non-passed statuses as failures
        if (status === 'failed' || status === 'undefined' || status === 'pending' || status === 'skipped' || status === 'ambiguous' || status) {
          failed = true;
          const err = getStepError(step) || `Step status: ${status}`;
          const stepText = `${(step.keyword || '').trim()} ${(step.name || '').trim()}`.trim();
          failureMessages.push(`${stepText} -> ${status}${err ? `: ${err}` : ''}`);
        }
      }
    });

    // Also check scenario-level status if present
    if (!failed && scenario.status && typeof scenario.status === 'string') {
      const scStatus = scenario.status.toLowerCase();
      if (scStatus !== 'passed') {
        failed = true;
        failureMessages.push(`Scenario status: ${scStatus}`);
        if (scenario.error_message) failureMessages.push(scenario.error_message);
      }
    }

    // If any failures collected, add a <failure> element
    if (failed) {
      const message = failureMessages.join('\n') || 'Step(s) failed';
      testCase.failure(message, message);
    }
    // otherwise no failure element -> junit counts it as passed
  });
});

// write the XML
builder.writeTo(outputFile);
console.log(`✅ JUnit written to ${outputFile}`);
