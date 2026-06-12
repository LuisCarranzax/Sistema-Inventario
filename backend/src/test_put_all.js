const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAll() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const states = ['en_revision', 'reparado', 'entregado', 'agendado', 'instalado'];
  console.log('Testing SQL updates directly in database:');
  
  for (const state of states) {
    try {
      let query = `UPDATE servicios_tecnicos SET estado = ? WHERE id = 25`;
      if (state === 'entregado') {
        query = `UPDATE servicios_tecnicos SET estado = ?, fecha_entrega = CURRENT_TIMESTAMP WHERE id = 25`;
      }
      await connection.query(query, [state, 25]);
      console.log(`- State '${state}': SUCCESS`);
    } catch (error) {
      console.log(`- State '${state}': FAILED - ${error.message}`);
    }
  }

  await connection.end();
}

testAll();
