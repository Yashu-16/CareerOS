import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const email = 'demo@careeros.in'
const plainPassword = 'Demo@1234'

async function main() {
  const password = await bcrypt.hash(plainPassword, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
      emailVerified: true,
      name: 'Demo User',
      deletedAt: null,
    },
    create: {
      email,
      password,
      name: 'Demo User',
      emailVerified: true,
      role: 'STUDENT',
      city: 'Bengaluru',
      targetRole: 'Software Engineer',
      experienceLevel: 'FRESHER',
      skills: ['JavaScript', 'React', 'Node.js'],
    },
  })

  console.log('\n✅ Demo user ready:')
  console.log('   Email:    ' + email)
  console.log('   Password: ' + plainPassword)
  console.log('   User ID:  ' + user.id)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
