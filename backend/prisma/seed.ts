import { PrismaClient, Rol } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Ejecutando seed...')

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
  console.log('  ok supervisor@sip.cl')
  console.log('Seed completado')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())