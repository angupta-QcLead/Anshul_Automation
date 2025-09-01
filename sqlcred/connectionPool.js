// sqlcred/connectionPool.js
const sql = require('mssql');

class ConnectionPool {
  constructor(config) {
    this.pool = new sql.ConnectionPool(config);
    this.poolConnect = this.pool.connect();
  }

  async runQuery(query) {
    await this.poolConnect; // ensures pool is connected
    const request = this.pool.request();
    const result = await request.query(query);
    return result.recordset;
  }

  async close() {
    await this.pool.close();
  }
}

module.exports = { ConnectionPool };
