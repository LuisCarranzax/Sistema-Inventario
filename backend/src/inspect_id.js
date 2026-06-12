const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspect() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await connection.query('SELECT * FROM servicios_tecnicos WHERE id = 25');
    console.log('--- ROW 25 ---');
    console.log(rows[0]);
  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

inspect();
