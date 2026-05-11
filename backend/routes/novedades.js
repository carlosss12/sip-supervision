const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET: Estadísticas en tiempo real
router.get('/stats', async (req, res) => {
  try {
    const totalRes = await pool.query('SELECT COUNT(*) FROM actividades');
    const rutinaRes = await pool.query("SELECT COUNT(*) FROM actividades WHERE tipo = 'RUTINA'");
    const alertaRes = await pool.query("SELECT COUNT(*) FROM actividades WHERE tipo = 'ALERTA'");
    const criticoRes = await pool.query("SELECT COUNT(*) FROM actividades WHERE tipo = 'CRÍTICO'");

    res.json({
      total: parseInt(totalRes.rows[0].count),
      rutina: parseInt(rutinaRes.rows[0].count),
      alerta: parseInt(alertaRes.rows[0].count),
      critico: parseInt(criticoRes.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo métricas de la DB' });
  }
});

// GET: Listar registros con filtro
router.get('/', async (req, res) => {
  const { tipo } = req.query;
  try {
    let query = 'SELECT * FROM actividades ORDER BY id DESC';
    let params = [];

    if (tipo && tipo !== 'TODOS') {
      query = 'SELECT * FROM actividades WHERE tipo = $1 ORDER BY id DESC';
      params = [tipo];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error consultando la DB' });
  }
});

// POST: Registrar nueva entrada
router.post('/', async (req, res) => {
  const { guardia, instalacion, novedad, tipo } = req.body;
  const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  try {
    const result = await pool.query(
      'INSERT INTO actividades (guardia, instalacion, novedad, tipo, hora) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        guardia || "Oficial de Guardia",
        instalacion || "CCTV General",
        novedad || "Registro sin detalle",
        tipo || "RUTINA",
        hora
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error insertando en la DB' });
  }
});

// DELETE: Marcar como resuelto (¡La nueva función básica!)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM actividades WHERE id = $1', [req.params.id]);
    res.json({ message: 'Registro resuelto y eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error eliminando en la DB' });
  }
});

module.exports = router;