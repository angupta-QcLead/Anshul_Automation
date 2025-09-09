// Scripts/run-and-submit.js
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const feature = process.argv[2] || 'tests/features/RevenueAllocationA.feature';
const requireGlob = process.argv[3] || 'tests/steps/**/*.js';
const resultsDir = path.resolve(process.cwd(), 'results');
const jsonPath = path.join(resultsDir, 'cucumber.json');
const xmlPath = path.join(resultsDir, 'cucumber.xml');

if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

// 1) Run cucumber-js and write JSON (this prints progress to your terminal)
console.log('Running cucumber-js (will print to terminal) ...');
let r = spawnSync('npx', ['cucumber-js', feature, '--require', requireGlob, `--format=json:${jsonPath}`], { stdio: 'inherit', shell: true });
if (r.error) { console.error('Failed to run cucumber-js', r.error); process.exit(1); }

// 2) Convert cucumber.json -> junit xml using cucumber-junit
console.log(`Converting ${jsonPath} -> ${xmlPath} ...`);
let conv = spawnSync('npx', ['cucumber-junit', jsonPath], { encoding: 'utf8', shell: true });
if (conv.error) { console.error('Failed to run cucumber-junit', conv.error); process.exit(1); }
fs.writeFileSync(xmlPath, conv.stdout);
console.log('Wrote JUnit XML:', xmlPath);

// 3) Submit the xml to Testmo (Testmo token must be in env var TESTMO_TOKEN)
console.log('Submitting to Testmo (npx testmo automation:run:submit) ...');
const testmoArgs = [
  'testmo', 'automation:run:submit',
  '--instance', 'https://rightsline.testmo.net/',
  '--project-id', '14',
  '--name', 'RevenueAllocationA Local Run',
  '--source', 'local',
  '--results', xmlPath
];
let submit = spawnSync('npx', testmoArgs, { stdio: 'inherit', shell: true, env: process.env });
if (submit.error) { console.error('Failed to submit to Testmo', submit.error); process.exit(1); }
process.exit(submit.status);
