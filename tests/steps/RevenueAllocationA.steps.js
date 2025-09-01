const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { runQuery } = require('../../sqlcred/db.utilis');
const { Revenuemodel } = require('../../Baseconfg/Revenuemodel');
const fs = require('fs');
const path = require('path');

let queryFilePath, knownResultPath, testResultPath, reportPath, queryText;

// 🔧 JSON formatter for RevenueAllocationA (ScopeA style)
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

Given('I have a valid RevenueAllocationA SQL query', async function () {
  const RA = new Revenuemodel({ deal_sid: 4133 });
  queryText = RA.RevenueAllocationA();

  queryFilePath = path.join(
    'S:', 'Anshul', 'Base Config Regression Testing', 'Test Files', 'SQL Queries', 'qc_compare_RevenueAllocationA.sql'
  );
  knownResultPath = path.join(
    'S:', 'Anshul', 'Base Config Regression Testing', 'Test Results', 'Known', 'qc_compare_RevenueAllocationA.txt'
  );
  testResultPath = path.join(
    'S:', 'Anshul', 'Base Config Regression Testing', 'Test Results', 'From_Test', 'qc_compare_RevenueAllocationA.txt'
  );
  reportPath = path.join(
    'S:', 'Anshul', 'Base Config Regression Testing', 'Test Results', 'Reports', 'qc_compare_RevenueAllocationA_mismatches.json'
  );

  // Ensure folders exist
  fs.mkdirSync(path.dirname(queryFilePath), { recursive: true });
  fs.mkdirSync(path.dirname(knownResultPath), { recursive: true });
  fs.mkdirSync(path.dirname(testResultPath), { recursive: true });
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  // Create SQL file if missing
  if (!fs.existsSync(queryFilePath)) {
    fs.writeFileSync(queryFilePath, queryText.trim(), 'utf8');
    console.log(`✅ SQL file created: ${queryFilePath}`);
  } else {
    console.log(`ℹ️ SQL file already exists: ${queryFilePath}`);
  }
});

When('I run the query and save the results', async function () {
  const result = await runQuery(queryText);

  // 🔄 Convert result → JSON
  const jsonResult = formatAsJson(result);

  // ❌ Do NOT overwrite Known each run
  if (!fs.existsSync(knownResultPath)) {
    fs.writeFileSync(knownResultPath, jsonResult, 'utf8');
    console.log(`✅ Baseline created: ${knownResultPath}`);
  } else {
    console.log(`ℹ️ Using existing baseline: ${knownResultPath}`);
  }

  // ✅ Always overwrite Test
  fs.writeFileSync(testResultPath, jsonResult, 'utf8');
  console.log(`✅ Test result saved: ${testResultPath}`);
});


// Keep your Then step as-is for now




Then('the results should match the known baseline', async function () {
  const knownText = fs.readFileSync(knownResultPath, 'utf8');
  const testText = fs.readFileSync(testResultPath, 'utf8');

  const knownLines = knownText.split(/\r?\n/);
  const testLines = testText.split(/\r?\n/);

  const mismatches = [];
  const maxLen = Math.max(knownLines.length, testLines.length);

  for (let i = 0; i < maxLen; i++) {
    const knownLine = knownLines[i] || '';
    const testLine = testLines[i] || '';
    if (knownLine !== testLine) {
      mismatches.push({
        line: i + 1,
        known: knownLine,
        test: testLine
      });
    }
  }

  if (mismatches.length === 0) {
    console.log('✅ No difference found between Known and Test results.');
  } else {
    console.log(`❌ ${mismatches.length} differences found!`);
    console.table(mismatches);
    fs.writeFileSync(reportPath, JSON.stringify(mismatches, null, 2), 'utf8');
    console.log(`📄 Mismatch report saved: ${reportPath}`);
  }

  assert.strictEqual(mismatches.length, 0, 'There should be no mismatched lines');
});
