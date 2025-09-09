// scripts/merge-cucumber-json.js (dedupe version)
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(process.cwd(), 'results');
const outFile = path.join(resultsDir, 'cucumber.json');

if (!fs.existsSync(resultsDir)) {
  console.error('results/ not found');
  process.exit(1);
}

const files = fs.readdirSync(resultsDir).filter(f => f.toLowerCase().endsWith('.json') && f !== 'cucumber.json');

if (!files.length) {
  console.error('No JSON files found in results/. Run cucumber to produce JSON.');
  process.exit(1);
}

const merged = [];
const seenKeys = new Set();

for (const file of files) {
  const full = path.join(resultsDir, file);
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (e) {
    console.warn(`Skipping ${file}: parse error ${e.message}`);
    continue;
  }
  const features = Array.isArray(parsed) ? parsed : [parsed];
  for (const feat of features) {
    const uri = feat.uri || feat.name || '';
    const elements = feat.elements || [];
    const newElements = [];
    for (const el of elements) {
      const name = el.name || '';
      const line = (el.location && el.location.line) || el.line || '';
      const key = `${uri}||${name}||${line}`;
      if (seenKeys.has(key)) {
        // duplicate scenario - skip
        continue;
      }
      seenKeys.add(key);
      newElements.push(el);
    }
    if (newElements.length) {
      // ensure feature object contains only the deduped elements
      const cleanFeature = Object.assign({}, feat, { elements: newElements });
      merged.push(cleanFeature);
    }
  }
}

fs.writeFileSync(outFile, JSON.stringify(merged, null, 2), 'utf8');
console.log(`Merged ${files.length} json files -> ${outFile} (features: ${merged.length})`);
process.exit(0);
