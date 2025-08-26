const { test, expect } = require('@playwright/test');
const { runQuery } = require('../sqlcred/db.utilis');
const { Revenuemodel } = require('../Baseconfg/Revenuemodel');
const fs = require('fs');
const path = require('path');

async function saveQueryResult(queryOrFilePath, outputFilePath, isQuery = false) {
  const queryText = isQuery ? queryOrFilePath : fs.readFileSync(queryOrFilePath, 'utf8');
  const result = await runQuery(queryText);
  fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`✅ Results saved to: ${outputFilePath}`);
}

test('Save query to SQL file', async () => {
  const RA = new Revenuemodel({ deal_sid: 413378 });
  const queryRevB = RA.RevenueAllocationA();   // ✅ Get SQL query text

  const queryFilePath = path.join(
    'S:',
    'Anshul',
    'Base Config Regression Testing',
    'Test Files',
    'SQL Queries',
    'qc_compare_RevenueAllocationA.sql'
  );

  if (!fs.existsSync(queryFilePath)) {
    fs.writeFileSync(queryFilePath, queryRevB.trim(), 'utf8');
    console.log(`✅ Query saved to: ${queryFilePath}`);
  } else {
    console.log(`ℹ️ Query file already exists: ${queryFilePath}`);
  }
});

  test('Run SQL and compare Known vs Test', async () => {
  const RA = new Revenuemodel({ deal_sid: 41336788 });
  const revA=RA.RevenueAllocationA();
  const queryFilePath = path.join(
    'S:',
    'Anshul',
    'Base Config Regression Testing',
    'Test Files',
    'SQL Queries',
    'qc_compare_RevenueAllocationA.sql'
  );

  const knownResultPath = path.join(
    'S:',
    'Anshul',
    'Base Config Regression Testing',
    'Test Results',
    'Known',
    'qc_compare_RevenueAllocationA.txt'
  );

  const testResultPath = path.join(
    'S:',
    'Anshul',
    'Base Config Regression Testing',
    'Test Results',
    'From_Test',
    'qc_compare_RevenueAllocationA.txt'
  );

  // If Known file does not exist, create it
  if (!fs.existsSync(knownResultPath)) {
    await saveQueryResult(queryFilePath, knownResultPath);
  }

  // Always create/overwrite Test file (fresh run)
  await saveQueryResult(queryFilePath, testResultPath);

  // Compare Known vs Test results
  const knownLines = fs.readFileSync(knownResultPath, 'utf8').split(/\r?\n/);
  const testLines = fs.readFileSync(testResultPath, 'utf8').split(/\r?\n/);

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
    console.log('❌ Differences found! Showing mismatched values:');
    console.table(mismatches);

    const reportPath = path.join(
      'S:',
      'Anshul',
      'Base Config Regression Testing',
      'Test Results',
      'Reports',
      'qc_compare_RevenueAllocationB_mismatches.json'
    );
    fs.writeFileSync(reportPath, JSON.stringify(mismatches, null, 2), 'utf8');
    console.log(`📄 Mismatch report saved: ${reportPath}`);
  }

  expect(mismatches, 'There should be no mismatched lines').toHaveLength(0);
});
