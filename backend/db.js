const { Pool } = require('pg');

// Conexión mediante la variable de entorno configurada en Docker Compose
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const inicializarDB = async () => {
  try {
    // 1. Creamos la estructura de la tabla si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS actividades (
        id SERIAL PRIMARY KEY,
        guardia VARCHAR(100) NOT NULL,
        instalacion VARCHAR(100) NOT NULL,
        novedad TEXT NOT NULL,
        tipo VARCHAR(50) DEFAULT 'RUTINA',
        hora VARCHAR(50) NOT NULL
      );
    `);
    
    console.log('[DB] Estructura de tabla verificada.');
    console.log('[DB] Conexión a PostgreSQL 100% operativa (Base de datos vacía para presentación).');
    
  } catch (err) {
    console.error('[DB] Error crítico conectando a PostgreSQL:', err);
  }
};

inicializarDB();

module.exports = pool;