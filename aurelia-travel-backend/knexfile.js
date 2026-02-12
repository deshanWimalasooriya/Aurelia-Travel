// knexfile.js
require('dotenv').config();

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      // Use the variables from .env, or fallback to local defaults if missing
      host: process.env.DB_HOST || '127.0.0.1',
      
      // IMPORTANT: TiDB uses port 4000, XAMPP uses 3306. 
      // We now read this from the .env file instead of hardcoding it.
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
    migrations: {
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeders'
    }
  }
};