const db = require('../backend/src/config/db');

async function update() {
  try {
    const [result] = await db.query('UPDATE productos SET fecha_abastecimiento = CURDATE() WHERE fecha_abastecimiento IS NULL');
    console.log('--- DATABASE UPDATE RESULTS ---');
    console.log(`Updated ${result.affectedRows} rows.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

update();
