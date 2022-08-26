const ssh2mysql = require("ssh2-connect-mysql");
const fs = require("fs");
require('dotenv').config()
console.log('process.env.DB_SSH_USER',process.env.DB_SSH_USER)
const ssh_conf = {
  host: process.env.DB_SSH_HOST,
  port: 22,
  username: process.env.DB_SSH_USER,
  privateKey: fs.readFileSync("./chee-finance.cer"),
};
const db_conf = {
  host: "127.0.0.1",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};
let query = function (sqlVal) {
  return new Promise((resolve, reject) => {
    ssh2mysql.connect(ssh_conf, db_conf).then((sql) => {
      sql.query(sqlVal, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        // ssh2mysql.close();
      });
    });
  });
};

async function getDbData(sql) {
  let data = await query(sql);
  return data;
}

module.exports = getDbData;