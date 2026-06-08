import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.tarea.deleteMany({});
  await prisma.usuario.deleteMany({});
  await prisma.turno.deleteMany({});

  // Carga de Personal con Credenciales Formales
  await prisma.usuario.create({
    data: {
      email: 'supervisor@sipprotection.cl',
      contrasena: 'admin123',
      nombre: 'Carlos Mendoza',
      rol: 'SUPERVISOR'
    }
  });

  await prisma.usuario.create({
    data: {
      email: 'j.perez@sipprotection.cl',
      contrasena: 'guardia123',
      nombre: 'Juan Perez',
      rol: 'GUARDIA'
    }
  });

  await prisma.usuario.create({
    data: {
      email: 'c.soto@sipprotection.cl',
      contrasena: 'guardia123',
      nombre: 'Carlos Soto',
      rol: 'GUARDIA'
    }
  });

  await prisma.turno.create({
    data: { abierto: true }
  });

  console.log('✅ Base de datos inicializada con credenciales corporativas reales.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });