// knexfile.js
require('dotenv').config();

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      // Use the variables from .env, or fallback to local defaults if missing
      host: process.env.DB_HOST || '127.0.0.1',
      
      // IMPORTANT: TiDB uses port 4000, XAMPP uses 3306. 
      port: Number(process.env.DB_PORT) || 3306,
      
      user: process.env.DB_USER || 'root',
      
      // Fixed: Now looks for 'DB_PASS' to match your .env file
      password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
      
      database: process.env.DB_NAME || 'aurelia_travel',
      
      // REQUIRED for TiDB Cloud:
      ssl: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    },
    
    // ✅ RESOLVED: CONNECTION POOLING (Fixes Multi-User Crashes)
    pool: {
      min: 2, 
      max: 40, // Increased from default 10 to 40 for higher traffic
      
      // If a connection is idle for 30s, close it to free up RAM
      idleTimeoutMillis: 30000, 
      
      // If the database is busy, wait 5s for a slot, then fail (don't hang forever)
      acquireTimeoutMillis: 5000 
    },

    migrations: {
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeders'
    }
  }
};