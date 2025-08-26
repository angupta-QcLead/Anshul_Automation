// tests/sql-connection.spec.js
const { test, expect } = require('@playwright/test');
const { runQuery } = require('../sqlcred/db.utilis');

test('Test SQL Connection', async () => {
  const result = await runQuery('SELECT GETDATE() AS CurrentTime');
  console.log('✅ SQL Query Result:', result);

  expect(result.length).toBeGreaterThan(0);
  expect(result[0]).toHaveProperty('CurrentTime');
});
