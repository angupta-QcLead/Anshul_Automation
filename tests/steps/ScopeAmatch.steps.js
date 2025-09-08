// tests/steps/RevenueAllocationA.steps.js
const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { runQuery } = require('../../sqlcred/db.utilis');
const { royaltymodel } = require('../../Baseconfg/Royalty'); // Revenue model, not Royalty
const fs = require('fs');
const path = require('path');

let queryFilePath, knownResultPath, testResultPath, reportPath, queryText;

// ---------------------
// JSON Formatter
// ---------------------
const formatAsJson = (rows) => {
  if (!rows || rows.length === 0) return "[]";

  return JSON.stringify(
    rows.map(row => ({
      reporting_period: row.reportingperiod,
      actual_period: row.actualperiod,
      activity_type: row.ActivityType,
      Catalog: row.CatlogType,
      Channel: row.Channel || "Channel A",
      Territory: row.Territory,
      Media: row.Media,
      Language: row.Language,
      Bundles: row.Bundle || 0,
      "Price1 (Retail Price)": row.Price1Retailprice,
      Units: row.unit,
      Amount: row.Amount
    })),
    null,
    2
  );
};

// ---------------------
// Setup SQL + Paths
// ---------------------
Given('I have a valid ScopeA SQL query', async function () {
  const SA = new royaltymodel({ deal_sid: 4135 }); // <-- use RevenueAllocationA deal_sid
  queryText = SA.ScopeA();             // <-- make sure this method exists

  queryFilePath = path.join(
    'S:', 'Anshul', 'Base Config Regression Testing', 'Test Files', 'SQL Queries', 'qc_compare_ScopeA.sql'
  );
  knownResultPath = path.join(
    'S:', 'Anshul', 'Base Config Regression Testing', 'Test Files', 'Known', 'qc_compare_ScopeA.txt'
  );
  testResultPath = path.join(
    'S:', 'Anshul', 'Base Config Regression Testing', 'Test Files', 'From_Test', 'qc_compare_ScopeA.txt'
  );
  reportPath = path.join(
    'S:', 'Anshul', 'Base Config Regression Testing', 'Test Files', 'qc_compare_ScopeA_mismatches.json'
  );

  fs.mkdirSync(path.dirname(queryFilePath), { recursive: true });
  fs.mkdirSync(path.dirname(knownResultPath), { recursive: true });
  fs.mkdirSync(path.dirname(testResultPath), { recursive: true });
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  if (!fs.existsSync(queryFilePath)) {
    fs.writeFileSync(queryFilePath, queryText.trim(), 'utf8');
    console.log(`✅ SQL file created: ${queryFilePath}`);
  } else {
    console.log(`ℹ️ SQL file already exists: ${queryFilePath}`);
  }
});

// ---------------------
// Run + Save Results
// ---------------------
When('I run the Scope A query and save the results', async function () {
  const result = await runQuery(queryText);
  const jsonResult = formatAsJson(result);

  if (!fs.existsSync(knownResultPath)) {
    fs.writeFileSync(knownResultPath, jsonResult, 'utf8');
    console.log(`✅ Baseline created: ${knownResultPath}`);
  } else {
    console.log(`ℹ️ Using existing baseline: ${knownResultPath}`);
  }

  fs.writeFileSync(testResultPath, jsonResult, 'utf8');
  console.log(`✅ Test result saved: ${testResultPath}`);
});

// ---------------------
// Compare Known vs Test
// ---------------------
Then('ScopeA results should match the known baseline', async function () {
  const knownData = JSON.parse(fs.readFileSync(knownResultPath, 'utf8'));
  const testData  = JSON.parse(fs.readFileSync(testResultPath, 'utf8'));

  const mismatches = [];
  const maxLen = Math.max(knownData.length, testData.length);

  for (let i = 0; i < maxLen; i++) {
    const knownRow = knownData[i] || {};
    const testRow  = testData[i] || {};
    const allFields = new Set([...Object.keys(knownRow), ...Object.keys(testRow)]);

    allFields.forEach(field => {
      if (knownRow[field] !== testRow[field]) {
        mismatches.push({
          index: i + 1,
          known: `${field}: ${knownRow[field]}`,
          test:  `${field}: ${testRow[field]}`
        });
      }
    });
  }

  if (mismatches.length === 0) {
    console.log('✅ No difference found between ScopeA Known and Test results.');
  } else {
    console.log(`❌ ${mismatches.length} difference(s) found!`);
    console.table(mismatches, ["index", "known", "test"]);
    fs.writeFileSync(reportPath, JSON.stringify(mismatches, null, 2), 'utf8');
    console.log(`📄 Mismatch report saved: ${reportPath}`);
  }

  assert.strictEqual(mismatches.length, 0, 'There should be no mismatched values');
});
