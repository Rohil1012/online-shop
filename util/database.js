// For sequelize database

const Sequelize = require("sequelize");

const sequelize = new Sequelize("node-complete", "root", "Rohil@1012", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;

// const mysql = require('mysql2');

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     database: 'node-complete',
//     password: 'Rohil@1012'
// });

// module.exports = pool.promise();
