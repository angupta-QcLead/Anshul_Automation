// sqlcred/db.utilis.js
const { ConnectionPool } = require('./connectionPool');

const config = {
  user: 'alliant_batch',
  password: 'qssoqfz',
  server: 'vsconfig07\\SQL22',
  database: 'nxt_qc_test',
  port: 59651,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

const pool = new ConnectionPool(config);

async function runQuery(query) {
  return pool.runQuery(query);
}

module.exports = { runQuery };
