import express    from 'express'
import cors       from 'cors'
import dotenv     from 'dotenv'
import path       from 'path'
import authRoutes       from './routes/auth.routes'
import tareaRoutes      from './routes/tarea.routes'
import incidenciaRoutes from './routes/incidencia.routes'

dotenv.config()

const app  = express()
const PORT = Number(process.env.PORT) || 4000

app.use(cors({ origin: process.env.FRONTEND_URL || '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api', authRoutes)
app.use('/api', tareaRoutes)
app.use('/api', incidenciaRoutes)

app.get('/api/health', (_req, res) => {
  const ahora = new Date()
  const hora  = ahora.getHours()
  const turno = hora >= 6 && hora < 14 ? 'MANANA' : hora >= 14 && hora < 22 ? 'TARDE' : 'NOCHE'
  res.json({
    ok:       true,
    ts:       ahora.toISOString(),
    horaLocal: ahora.toLocaleString('es-CL'),
    horaServidor: hora,
    turnoActivo: turno,
    tz: process.env.TZ ?? 'no configurado',
  })
})

app.listen(PORT, () => console.log(`✅ Backend S.I. Protection corriendo en puerto ${PORT}`))