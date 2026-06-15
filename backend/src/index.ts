import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import tareaRoutes from './routes/tarea.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORRECCIÓN: Montamos ambos enrutadores directo en /api para respetar las URLs del frontend
app.use('/api', authRoutes);  
app.use('/api', tareaRoutes); 

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 API Arquitectónica S.I.P activa y mapeada correctamente en puerto ${PORT}`);
});