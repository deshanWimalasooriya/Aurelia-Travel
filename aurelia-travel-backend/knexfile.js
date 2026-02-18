require('dotenv').config();

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      
      // Fixed: Ensure port is a number
      port: Number(process.env.DB_PORT) || 3306,
      
      user: process.env.DB_USER || 'root',
      
      password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
      
      database: process.env.DB_NAME || 'aurelia_travel',
      
      // ✅ WEAKNESS RESOLVED: Smart SSL
      // If you are on localhost (XAMPP), SSL is disabled.
      // If you are on TiDB/Cloud, SSL is enabled.
      ssl: (process.env.DB_HOST === '127.0.0.1' || process.env.DB_HOST === 'localhost') 
        ? false 
        : {
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2'
          },

      // ✅ WEAKNESS RESOLVED: Type Casting
      // Forces MySQL 'DECIMAL' (Prices) to return as Numbers in JS.
      // Prevents logic errors like "10.00" + 5 = "10.005"
      typeCast: function (field, next) {
        if (field.type === 'DECIMAL' || field.type === 'NEWDECIMAL') {
          const value = field.string();
          return (value === null) ? null : Number(value);
        }
        return next();
      }
    },
    
    // ✅ RESOLVED: CONNECTION POOLING
    pool: {
      min: 2, 
      max: 40, // Optimized for 50-100 concurrent users
      
      // Free up memory if connection is idle for 30s
      idleTimeoutMillis: 30000, 
      
      // Fail fast if DB is overloaded (prevents infinite loading spinners)
      acquireTimeoutMillis: 5000,

      // ✅ WEAKNESS RESOLVED: Startup Safety
      // If the DB is down when you start the server, don't crash the app immediately.
      // Keep trying to connect in the background.
      propagateCreateError: false 
    },

    migrations: {
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeders'
    }
  }
};