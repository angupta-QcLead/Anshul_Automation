const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');
const { runQuery } = require('../../sqlcred/db.utilis');
const { Revenuemodel } = require('../../Baseconfg/Revenuemodel');
const fs = require('fs');
const path = require('path');

let queryFilePathB, knownResultPathB, testResultPathB, reportPathB, queryTextB;

// 🔧 JSON formatter for RevenueAllocationA (ScopeA style)
const formatAsJson = (rows) => {
  if (!rows || rows.length === 0) return "[]";

  return JSON.stringify(
    rows.map(row => ({
      reportingperiod: row.reportingperiod,
      actualperiod: row.actualperiod,
      activitytype: row.ActivityType,
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

Given('I have a valid RevenueAllocationB SQL query', async function () {
  const RB = new Revenuemodel({ deal_sid: 4134 });
  queryTextB = RB.RevenueAllocationB();

 queryFilePathB = path.join(
    'S:', 'Anshul', 'Base Config Regression Testing', 'Test Files', 'SQL Queries', 'qc_compare_RevenueAllocationB.sql'
  );
  knownResultPathB = path.join(
    'S:', 'Anshul', 'Base Config Regression Testing', 'Test Results', 'Known', 'qc_compare_RevenueAllocationB.txt'
  );
  testResultPathB = path.join(
    'S:', 'Anshul', 'Base Config Regression Testing', 'Test Results', 'From_Test', 'qc_compare_RevenueAllocationB.txt'
  );
  reportPathB = path.join(
    'S:', 'Anshul', 'Base Config Regression Testing', 'Test Results', 'Reports', 'qc_compare_RevenueAllocationB_mismatches.json'
  );

  // Ensure folders exist
  fs.mkdirSync(path.dirname(queryFilePathB), { recursive: true });
  fs.mkdirSync(path.dirname(knownResultPathB), { recursive: true });
  fs.mkdirSync(path.dirname(testResultPathB), { recursive: true });
  fs.mkdirSync(path.dirname(reportPathB), { recursive: true });

  // Create SQL file if missing
  if (!fs.existsSync(queryFilePathB)) {
    fs.writeFileSync(queryFilePathB, queryTextB.trim(), 'utf8');
    console.log(`✅ SQL file created: ${queryFilePathB}`);
  } else {
    console.log(`ℹ️ SQL file already exists: ${queryFilePathB}`);
  }
});

When('I run the query RevenueB and save the results', async function () {
  const resultB = await runQuery(queryTextB);

  // 🔄 Convert result → JSON
  const jsonResultB = formatAsJson(resultB);

  // ❌ Do NOT overwrite Known each run
  if (!fs.existsSync(knownResultPathB)) {
    fs.writeFileSync(knownResultPathB, jsonResultB, 'utf8');
    console.log(`✅ Baseline created: ${knownResultPathB}`);
  } else {
    console.log(`ℹ️ Using existing baseline: ${knownResultPathB}`);
  }

  // ❌ Do NOT overwrite Test each run
if (!fs.existsSync(testResultPathB)) {
  fs.writeFileSync(testResultPathB, jsonResultB, 'utf8');
  console.log(`✅ Test file created: ${testResultPathB}`);
} else {
  console.log(`ℹ️ Using existing test file: ${testResultPathB}`);
}

//   // ✅ Always overwrite Test
//   fs.writeFileSync(testResultPathB, jsonResultB, 'utf8');
//   console.log(`✅ Test result saved: ${testResultPathB}`);
});


// Keep your Then step as-is for now




Then('RevenueAllocationB results should match the known baseline', async function () {
  const knownTextB = fs.readFileSync(knownResultPathB, 'utf8');
  const testTextB = fs.readFileSync(testResultPathB, 'utf8');

  const knownLinesB = knownTextB.split(/\r?\n/);
  const testLinesB = testTextB.split(/\r?\n/);

  const mismatches = [];
  const maxLen = Math.max(knownLinesB.length, testLinesB.length);

  for (let i = 0; i < maxLen; i++) {
    const knownLineRevB = knownLinesB[i] || '';
    const testLineRevB = testLinesB[i] || '';
    if (knownLineRevB !== testLineRevB) {
      mismatches.push({
        line: i + 1,
        known: knownLineRevB,
        test: testLineRevB
      });
    }
  }

  if (mismatches.length === 0) {
    console.log('✅ No difference found between Known and Test results.');
  } else {
    console.log(`❌ ${mismatches.length} differences found!`);
    console.table(mismatches);
    fs.writeFileSync(reportPathB, JSON.stringify(mismatches, null, 2), 'utf8');
    console.log(`📄 Mismatch report saved: ${reportPathB}`);
  }

  assert.strictEqual(mismatches.length, 0, 'There should be no mismatched lines');
});