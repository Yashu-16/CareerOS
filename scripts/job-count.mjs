import { PrismaClient } from '@prisma/client'
import { freshJobWhere } from '../src/lib/job-freshness.ts'

const prisma = new PrismaClient()

const active = await prisma.job.count({ where: { isActive: true } })
const visible = await prisma.job.count({ where: freshJobWhere() })
const bySource = await prisma.job.groupBy({
  by: ['source'],
  where: freshJobWhere(),
  _count: true,
})

console.log({ active, visible, bySource: Object.fromEntries(bySource.map((g) => [g.source, g._count])) })
await prisma.$disconnect()
