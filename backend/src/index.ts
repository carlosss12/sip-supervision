import express    from 'express'
import cors       from 'cors'
import dotenv     from 'dotenv'
import path       from 'path'
import authRoutes  from './routes/auth.routes'
import tareaRoutes from './routes/tarea.routes'

dotenv.config()

const app  = express()
const PORT = Number(process.env.PORT) || 4000

app.use(cors({
  origin:  process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api', authRoutes)
app.use('/api', tareaRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`✅ Backend S.I. Protection corriendo en puerto ${PORT}`)
})