// const mysql = require('mysql2');
// const dotenv = require('dotenv');
// dotenv.config();

// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME,
// });

// module.exports = connection;


const knex = require('knex');
// Import the configuration you already wrote in knexfile.js
// (Assumes knexfile.js is in the root folder, one level up from 'config')
const config = require('../knexfile.js');

// Initialize the connection using the 'development' settings
// This automatically pulls in the SSL settings you added earlier!
const db = knex(config.development);

module.exports = db;