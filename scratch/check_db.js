const db = require('../backend/src/config/db');

async function testControllerQuery() {
  try {
    const query = `
      SELECT p.*, c.nombre AS categoria_nombre 
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.id DESC
    `;
    const [productos] = await db.query(query);
    console.log('--- PRODUCTS FROM CONTROLLER QUERY ---');
    console.log(productos);
  } catch (err) {
    console.error('ERROR running query:', err);
  } finally {
    process.exit();
  }
}

testControllerQuery();
