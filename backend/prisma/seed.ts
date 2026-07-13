import { PrismaClient, Rol } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('⏳ Ejecutando seed...')

  // Solo se crea el supervisor — los guardias los crea el supervisor desde el sistema
  const hash = await bcrypt.hash('admin123', 10)
  await prisma.usuario.upsert({
    where:  { email: 'supervisor@sip.cl' },
    update: { password: hash },
    create: {
      email:    'supervisor@sip.cl',
      password: hash,
      nombre:   'Supervisor Principal',
      rol:      Rol.SUPERVISOR,
    },
  })
  console.log('  ✓ supervisor@sip.cl')

  // Turno inicial
  const turnoAbierto = await prisma.turno.findFirst({ where: { abierto: true } })
  if (!turnoAbierto) {
    await prisma.turno.create({ data: { abierto: true } })
    console.log('  ✓ Turno inicial creado')
  }

  console.log('✅ Seed completado')
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())