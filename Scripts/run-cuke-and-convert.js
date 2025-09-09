// scripts/run-cuke-and-convert.js
// Improved: robust npx invocation (works when spawned by another process) and safer XML output

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function ensureResultsDir() {
  const dir = path.join(process.cwd(), 'results');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function runCommandString(cmdString) {
  // Use shell:true so commands like "npx" are resolved by the system shell (works on Windows when PATH differs)
  return new Promise((resolve, reject) => {
    const child = spawn(cmdString, { stdio: 'inherit', shell: true });
    child.on('error', (err) => reject(err));
    child.on('close', (code, signal) => {
      if (signal) return reject(new Error(`Process terminated with signal ${signal}`));
      resolve(code);
    });
  });
}

function escapeXml(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function convertCucumberJsonToJUnit(inPath, outPath) {
  if (!fs.existsSync(inPath)) throw new Error(`Input not found: ${inPath}`);
  const raw = fs.readFileSync(inPath, 'utf8');
  let features = JSON.parse(raw);
  if (!Array.isArray(features)) features = [features];

  let totalTests = 0, totalFailures = 0;
  let suitesXml = '';

  features.forEach(feature => {
    const fname = feature.name || feature.uri || 'Unnamed Feature';
    const elements = feature.elements || [];
    const testcases = [];

    elements.forEach(elem => {
      if (!elem || !elem.type) return;
      const isScenario = elem.type === 'scenario' || elem.type === 'scenario_outline' || elem.keyword === 'Scenario';
      if (!isScenario) return;

      totalTests++;
      const sname = elem.name || 'Unnamed Scenario';
      const steps = elem.steps || [];
      let failedStep = null;
      let duration = 0;
      const stepOutputs = [];

      steps.forEach(step => {
        const stepText = `${step.keyword || ''}${step.name || ''}`.trim();
        const status = (step.result && step.result.status) || 'unknown';
        const error = step.result && (step.result.error_message || step.result.message || step.result.stack);
        if (status === 'failed' && !failedStep) failedStep = { step: stepText, error };
        if (step.result && step.result.duration) {
          const d = Number(step.result.duration);
          if (!Number.isNaN(d)) duration += d / 1e9;
        }
        stepOutputs.push(error ? `${stepText} -> ${status}\n${error}` : `${stepText} -> ${status}`);
      });

      // Normalize classname: use forward slashes to avoid problematic backslashes
      let classname = (feature.uri || fname).toString().replace(/\\/g, '/');
      if (elem.location && elem.location.line) classname = `${classname}:${elem.location.line}`;

      let tc = `    <testcase classname="${escapeXml(classname)}" name="${escapeXml(sname)}" time="${duration.toFixed(3)}">\n`;
      if (failedStep) {
        totalFailures++;
        tc += `      <failure message="${escapeXml(failedStep.step)}">${escapeXml(failedStep.error || 'Step failed')}</failure>\n`;
      }
      tc += `      <system-out>${escapeXml(stepOutputs.join('\n'))}</system-out>\n`;
      tc += `    </testcase>\n`;
      testcases.push(tc);
    });

    const failures = (testcases.join('').match(/<failure/g) || []).length;
    suitesXml += `  <testsuite name="${escapeXml(fname)}" tests="${testcases.length}" failures="${failures}">\n${testcases.join('')}  </testsuite>\n`;
  });

  const finalXml = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites tests="${totalTests}" failures="${totalFailures}">\n${suitesXml}</testsuites>\n`;
  fs.writeFileSync(outPath, finalXml, 'utf8');
  return { totalTests, totalFailures };
}

(async () => {
  try {
    const resultsDir = ensureResultsDir();

    // timestamped raw json filename
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const rawJson = path.join(resultsDir, `cucumber-raw-${ts}.json`);
    const mergedJson = path.join(resultsDir, 'cucumber.json');
    const junitXml = path.join(resultsDir, 'cucumber.xml');

    // Build the cucumber command string (shell invocation)
    // Using 'npx cucumber-js ...' via shell so PATH resolution works in spawned environments.
    const featuresArgIndex = process.argv.indexOf('--features');
    const featuresArg = (featuresArgIndex !== -1 && process.argv[featuresArgIndex + 1]) ? process.argv[featuresArgIndex + 1] : 'tests/features';
    const requireArgIndex = process.argv.indexOf('--require');
    const requireArg = (requireArgIndex !== -1 && process.argv[requireArgIndex + 1]) ? process.argv[requireArgIndex + 1] : 'tests/steps/**/*.js';
    const cucumberCmd = `npx cucumber-js --format json:${rawJson} --parallel 1 ${featuresArg} --require ${requireArg}`;

    console.log('Running cucumber -> JSON:', rawJson);
    // run cucumber and stream output
    const code = await runCommandString(cucumberCmd);
    console.log('Cucumber exited with code', code);

    // merge json files in results/
    const allFiles = fs.readdirSync(resultsDir).filter(f => f.toLowerCase().endsWith('.json') && f !== 'cucumber.json');
    if (!allFiles.length) {
      throw new Error('No JSON files found in results/ to merge. Please ensure cucumber produced JSON.');
    }

    const mergedArray = [];
    allFiles.forEach(fname => {
      const p = path.join(resultsDir, fname);
      try {
        const text = fs.readFileSync(p, 'utf8').trim();
        if (!text) return;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) parsed.forEach(x => mergedArray.push(x));
        else mergedArray.push(parsed);
      } catch (err) {
        console.warn(`Warning: skipping ${fname} (parse error): ${err.message}`);
      }
    });
    fs.writeFileSync(mergedJson, JSON.stringify(mergedArray, null, 2), 'utf8');
    console.log(`Merged ${allFiles.length} JSON -> ${mergedJson} (features: ${mergedArray.length})`);

    // convert merged json -> junit xml
    const stats = convertCucumberJsonToJUnit(mergedJson, junitXml);
    console.log(`Wrote JUnit XML -> ${junitXml} (tests: ${stats.totalTests}, failures: ${stats.totalFailures})`);

    // exit with cucumber's exit code so Testmo CLI sees pass/fail
    process.exit(code || 0);
  } catch (err) {
    console.error('Error in run-cuke-and-convert.js:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
