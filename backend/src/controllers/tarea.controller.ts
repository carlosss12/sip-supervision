import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const getTareas = async (req: Request, res: Response) => {
  try {
    const tareas = await prisma.tarea.findMany({
      include: { guardia: true, supervisor: true },
      orderBy: { id: 'desc' }
    });
    res.json(tareas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const crearTarea = async (req: Request, res: Response) => {
  const { descripcion, zona, prioridad, guardiaId, supervisorId } = req.body;
  try {
    const turnoActivo = await prisma.turno.findFirst({ where: { abierto: true } });
    if (!turnoActivo) return res.status(400).json({ error: 'No hay un turno operativo abierto.' });

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
};

export const subirEvidencia = async (req: Request, res: Response) => {
  const { tareaId, comentario, fotoBase64 } = req.body;
  try {
    let fotoUrlLocal = null;

    if (fotoBase64) {
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const nombreArchivo = `evidencia_${tareaId}_${Date.now()}.jpg`;
      const rutaArchivo = path.join(uploadsDir, nombreArchivo);
      
      const datosLimpios = fotoBase64.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(rutaArchivo, datosLimpios, 'base64');
      
      fotoUrlLocal = `http://localhost:4000/uploads/${nombreArchivo}`;
    }

    const tareaActualizada = await prisma.tarea.update({
      where: { id: Number(tareaId) },
      data: {
        evidencia: comentario,
        fotoUrl: fotoUrlLocal,
        estado: 'EN_REVISION'
      }
    });
    res.json(tareaActualizada);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const validarTarea = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado, observacion } = req.body;
  try {
    const estadoFinal = estado === 'RECHAZADA' ? 'PENDIENTE' : 'APROBADA';

    const validacion = await prisma.tarea.update({
      where: { id: Number(id) },
      data: { 
        estado: estadoFinal, 
        observacion: observacion || (estado === 'APROBADA' ? 'Validada Conforme.' : 'Rechazada.')
      }
    });
    res.json(validacion);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const cerrarTurno = async (req: Request, res: Response) => {
  try {
    const turnoActivo = await prisma.turno.findFirst({
      where: { abierto: true },
      include: { tareas: { include: { guardia: true } } }
    });

    if (!turnoActivo) return res.status(400).json({ error: 'No se registran turnos abiertos.' });

    await prisma.turno.update({
      where: { id: turnoActivo.id },
      data: { abierto: false, fin: new Date() }
    });

    await prisma.turno.create({ data: { abierto: true } });

    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `reporte_turno_${turnoActivo.id}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(22).font('Helvetica-Bold').fillColor('#000000').text('S.I. PROTECTION', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#555555').text('Minuta de Auditoria de Seguridad de Turno', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text(`Turno Operativo #${turnoActivo.id}`);
    doc.fontSize(10).font('Helvetica').fillColor('#333333').text(`Apertura: ${turnoActivo.inicio.toLocaleString()}`).text(`Cierre: ${new Date().toLocaleString()}`);
    doc.moveDown(1);
    doc.fillColor('#cccccc').text('------------------------------------------------------------------------------------------------------------------------');
    doc.moveDown();

    if (turnoActivo.tareas.length === 0) {
      doc.fontSize(11).font('Helvetica-Oblique').fillColor('#71717a').text('Sin novedades registradas.');
    } else {
      turnoActivo.tareas.forEach((t, i) => {
        if (t.estado === 'APROBADA') {
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#15803d').text(`[CONF] Tarea ${i + 1}: Perimetro [${t.zona}]`);
          doc.fontSize(10).font('Helvetica').fillColor('#333333')
             .text(`• Operador Responsable: ${t.guardia?.nombre}`)
             .text(`• Estado Final: VALIDADA CONFORME POR CENTRAL`);
        } else {
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#b91c1c').text(`[ALERTA] Tarea ${i + 1}: Perimetro [${t.zona}] - REQUIERE REVISIÓN`);
          doc.fontSize(10).font('Helvetica').fillColor('#333333')
             .text(`• Operador Responsable: ${t.guardia?.nombre}`)
             .text(`• Instruccion Base: ${t.descripcion}`)
             .text(`• Ultimo Reporte Emitido: ${t.evidencia || 'No enviado'}`)
             .text(`• Motivo de Alerta / Rechazo: ${t.observacion || 'Rechazado'}`);
        }
        doc.moveDown();
      });
    }

    doc.end();
    writeStream.on('finish', () => {
      res.json({ message: 'Turno clausurado. PDF generado.', reportePath: `/uploads/${fileName}` });
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};