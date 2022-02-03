const mysql = require('mysql2');
require('dotenv').config();

// base database configuration with mysql2
const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// database configuration for multiprogramming with mysql2
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

dbConnection.connect((err) => {
    if (err) {
        console.log('Error connecting', err);
        return;
    }
    console.log('connected as id ' + dbConnection.threadId);
});


module.exports = {
    connection: dbConnection, pool: pool
};