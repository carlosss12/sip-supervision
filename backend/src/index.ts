import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 1. Endpoint de verificación de salud (Healthcheck solicitado por el profesor)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ ok: true, timestamp: new Date() });
});

// 2. Login institucional por verificación de Email y Contraseña
app.post('/api/login', async (req: Request, res: Response) => {
  const { email, contrasena } = req.body;
  if (!email || !contrasena) {
    return res.status(400).json({ error: 'Email y contraseña requeridos.' });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!usuario || usuario.contrasena !== contrasena) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifique el correo corporativo y la contraseña.' });
    }

    // Se retorna el rol en la propiedad "role" para que la app web lo asimile correctamente
    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      role: usuario.rol
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Obtener nómina de guardias activos
app.get('/api/guardias', async (req: Request, res: Response) => {
  try {
    const guardias = await prisma.usuario.findMany({ where: { rol: 'GUARDIA' } });
    res.json(guardias);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Obtener bitácora de tareas unificada
app.get('/api/tareas', async (req: Request, res: Response) => {
  try {
    const tareas = await prisma.tarea.findMany({
      include: { guardia: true, supervisor: true },
      orderBy: { id: 'desc' }
    });
    res.json(tareas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Crear orden de trabajo (Supervisor en Web)
app.post('/api/tareas', async (req: Request, res: Response) => {
  const { descripcion, zona, prioridad, guardiaId, supervisorId } = req.body;
  try {
    const turnoActivo = await prisma.turno.findFirst({ where: { abierto: true } });
    if (!turnoActivo) return res.status(400).json({ error: 'No hay un turno abierto en este momento.' });

    const nuevaTarea = await prisma.tarea.create({
      data: {
        descripcion,
        zona,
        prioridad,
        guardiaId: Number(guardiaId),
        supervisorId: Number(supervisorId),
        turnoId: turnoActivo.id,
        estado: 'PENDIENTE'
      }
    });
    res.status(201).json(nuevaTarea);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Transmitir informe y evidencia fotográfica (Guardia desde App Móvil/Simulador)
app.post('/api/evidencias', async (req: Request, res: Response) => {
  const { tareaId, comentario, fotoUrl } = req.body;
  try {
    const tareaActualizada = await prisma.tarea.update({
      where: { id: Number(tareaId) },
      data: {
        evidencia: comentario,
        fotoUrl: fotoUrl || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500',
        estado: 'EN_REVISION'
      }
    });
    res.json(tareaActualizada);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Dictamen de Auditoría (Supervisor aprueba o rechaza en Web)
app.put('/api/tareas/:id/validar', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado, observacion } = req.body;
  try {
    const validacion = await prisma.tarea.update({
      where: { id: Number(id) },
      data: { estado, observacion }
    });
    res.json(validacion);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Clausura de Turno y Compilación Automatizada de Informe de Auditoría PDF
app.post('/api/turnos/cerrar', async (req: Request, res: Response) => {
  try {
    const turnoActivo = await prisma.turno.findFirst({
      where: { abierto: true },
      include: { tareas: { include: { guardia: true, supervisor: true } } }
    });

    if (!turnoActivo) return res.status(400).json({ error: 'No se registran turnos abiertos.' });

    // Modificar el estado del turno actual
    await prisma.turno.update({
      where: { id: turnoActivo.id },
      data: { abierto: false, fin: new Date() }
    });

    // Inicializar el relevo de manera inmediata
    await prisma.turno.create({ data: { abierto: true } });

    // Verificar y construir el directorio físico de cargas perimetrales
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `reporte_turno_${turnoActivo.id}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Diseño y maquetación estructurada del documento PDF corporativo
    doc.fontSize(22).font('Helvetica-Bold').text('S.I. PROTECTION', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Reporte Consolidado de Cierre de Turno', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).font('Helvetica-Bold').text(`Resumen Estadístico - Turno Operativo #${turnoActivo.id}`);
    doc.fontSize(10).font('Helvetica')
       .text(`Apertura del Turno: ${turnoActivo.inicio.toLocaleString()}`)
       .text(`Cierre del Turno: ${new Date().toLocaleString()}`);
    doc.moveDown(2);

    doc.text('------------------------------------------------------------------------------------------------------------------------');
    doc.moveDown();

    if (turnoActivo.tareas.length === 0) {
      doc.fontSize(12).font('Helvetica-Oblique').text('No se registraron novedades ni tareas operativas en este turno.');
    } else {
      turnoActivo.tareas.forEach((t, i) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`Tarea ${i + 1}: Zona [${t.zona}] — Estado: ${t.estado}`);
        doc.fontSize(10).font('Helvetica')
           .text(`• Requerimiento: ${t.descripcion}`)
           .text(`• Operador Responsable: ${t.guardia?.nombre || 'No asignado'}`)
           .text(`• Informe del Guardia: ${t.evidencia || 'Sin informe de terreno'}`)
           .text(`• Dictamen Supervisor: ${t.observacion || 'Sin observaciones adicionales'}`);
        doc.moveDown();
      });
    }

    doc.end();

    writeStream.on('finish', () => {
      res.json({
        message: 'Turno clausurado con éxito. Informe PDF compilado.',
        reportePath: `/uploads/${fileName}`
      });
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 [BACKEND CORE TS] API REST corriendo en el puerto ${PORT}`);
});