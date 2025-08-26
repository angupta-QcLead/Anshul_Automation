const { test, expect } = require('@playwright/test');
const { runQuery } = require('../sqlcred/db.utilis');
const { Revenuemodel } = require('../Baseconfg/Revenuemodel');
const fs = require('fs');
const path = require('path');

async function saveQueryResult(queryOrFilePath, outputFilePath, isQuery = false) {
  // Ensure output folder exists
  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });

  // if isQuery=true -> queryOrFilePath is the SQL text, else treat it as a file path
  const queryText = isQuery ? queryOrFilePath : fs.readFileSync(queryOrFilePath, 'utf8');
  const result = await runQuery(queryText);
  fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`✅ Results saved to: ${outputFilePath}`);
  return result;
}

test('Save query to SQL file', async () => {
  const RA = new Revenuemodel({ deal_sid: 4133 });
  const queryText = RA.RevenueAllocationA();

  // Run the query to validate the deal id
  const result = await runQuery(queryText);

  // Fail cleanly with a helpful message if no rows
  expect(result?.length ?? 0).toBeGreaterThan(
    0,
    `❌ Test failed: deal_sid ${RA.config.deal_sid} is incorrect (no data returned).`
  );

  // Save the SQL file (ensure directories exist)
  const queryFilePath = path.join(
    'S:',
    'Anshul',
    'Base Config Regression Testing',
    'Test Files',
    'SQL Queries',
    'qc_compare_RevenueAllocationA.sql'
  );
  fs.mkdirSync(path.dirname(queryFilePath), { recursive: true });

  // Overwrite the SQL file with the current queryText so it can't be stale
  fs.writeFileSync(queryFilePath, queryText.trim(), 'utf8');
  console.log(`✅ Query saved to: ${queryFilePath}`);
});

test('Run SQL and compare Known vs Test', async () => {
  const RA = new Revenuemodel({ deal_sid: 4133 });
  const queryText = RA.RevenueAllocationA();

  // Validate the deal id first
  const result = await runQuery(queryText);
  expect(result?.length ?? 0).toBeGreaterThan(
    0,
    `❌ Test failed: deal_sid ${RA.config.deal_sid} is incorrect (no data returned).`
  );
  console.log(`✅ Rows returned for deal_sid ${RA.config.deal_sid}:`, result.length);

  // Paths (ensure their parent folders exist)
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
  const reportPath = path.join(
    'S:',
    'Anshul',
    'Base Config Regression Testing',
    'Test Results',
    'Reports',
    'qc_compare_RevenueAllocationB_mismatches.json'
  );
  fs.mkdirSync(path.dirname(queryFilePath), { recursive: true });
  fs.mkdirSync(path.dirname(knownResultPath), { recursive: true });
  fs.mkdirSync(path.dirname(testResultPath), { recursive: true });
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  // If Known file doesn't exist, create it using the *current queryText* (not the saved file)
  if (!fs.existsSync(knownResultPath)) {
    await saveQueryResult(queryText, knownResultPath, true); // pass queryText directly
  }

  // Always create/overwrite Test file using current queryText
  await saveQueryResult(queryText, testResultPath, true);

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
    fs.writeFileSync(reportPath, JSON.stringify(mismatches, null, 2), 'utf8');
    console.log(`📄 Mismatch report saved: ${reportPath}`);
  }

  expect(mismatches, 'There should be no mismatched lines').toHaveLength(0);
});
