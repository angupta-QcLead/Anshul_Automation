// sqlcred/connectionPool.js
import sql from 'mssql';

class ConnectionPool {
  constructor(config) {
    if (!config || !config.user || !config.server || !config.database) {
      throw new Error('❌ Invalid DB config: missing required fields');
    }
    this.config = config;
    this.pool = null;
  }
async createPool() {
    if (this.pool) return this.pool;
        console.log("🔍 Config passed to sql.connect:", this.config);
    this.pool = await sql.connect(this.config);
    console.log('✅ SQL Connection Established');
    return this.pool;
      return this.pool;
  }

  async runQuery(query) {
    const pool = await this.createPool();
    const res = await pool.request().query(query);
    return res.recordset;
  }
}

module.exports = ConnectionPool;
