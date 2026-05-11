const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;
const novedadesRoutes = require('./routes/novedades');

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

// Inyección de rutas modulares
app.use('/api/actividades', novedadesRoutes);

app.listen(PORT, () => {
  console.log(`[S.I. PROTECTION] Motor API operativo en puerto ${PORT}`);
});