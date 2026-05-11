const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const novedadesRoutes = require('./routes/novedades');

app.use(cors());
app.use(express.json());

app.use('/api/actividades', novedadesRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[S.I. PROTECTION] Motor API operativo en puerto ${PORT}`);
});