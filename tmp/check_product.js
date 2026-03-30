const { Client } = require('pg');

async function checkProduct() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'admin_tienda',
    password: 'millennial.2026',
    database: 'tienda_db'
  });

  try {
    await client.connect();
    const productId = 'b5da6c7f-6d72-4739-af2f-32612f5bcc48';
    
    // Consultar el producto en el schema 'web' (según .env)
    const result = await client.query('SELECT * FROM web.garments WHERE id = $1', [productId]);
    
    if (result.rows.length === 0) {
      console.log('Producto no encontrado');
      return;
    }

    const product = result.rows[0];
    console.log('--- PRODUCTO ---');
    console.log(JSON.stringify(product, null, 2));
    console.log('--- ATRIBUTOS DINÁMICOS ---');
    console.log(JSON.stringify(product.atributos_dinamicos || {}, null, 2));
    
  } catch (err) {
    console.error('Error al consultar:', err.message);
  } finally {
    await client.end();
  }
}

checkProduct();
