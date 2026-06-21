/**
 * Quick TCP check for DATABASE_URL host before running prisma db push.
 * Usage: node scripts/check-database.mjs
 */
import { readFileSync } from 'fs'
import net from 'net'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env.local')

function loadDatabaseUrl() {
  const text = readFileSync(envPath, 'utf8')
  const match = text.match(/^DATABASE_URL="([^"]+)"/m)
  if (!match) {
    console.error('No DATABASE_URL found in .env.local')
    process.exit(1)
  }
  return match[1]
}

function parseHostPort(urlString) {
  const normalized = urlString.replace(/^postgresql:\/\//, 'http://')
  const url = new URL(normalized)
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    database: url.pathname.replace(/^\//, '') || 'postgres',
  }
}

function testTcp(host, port, timeoutMs = 12_000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: timeoutMs })
    const done = (ok) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(ok)
    }
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
  })
}

const databaseUrl = loadDatabaseUrl()
const { host, port, database } = parseHostPort(databaseUrl)

console.log(`Checking ${host}:${port} (database: ${database}) ...`)

const reachable = await testTcp(host, port)

if (reachable) {
  console.log('OK — port is reachable. Run: npm run prisma:push')
  process.exit(0)
}

console.error(`
FAIL — cannot reach ${host}:${port} (Prisma P1001).

Your RDS instance is not reachable from this PC. Fix in AWS Console (root/admin account):

1. RDS → database-1 → Modify → Connectivity → Public access → Yes → Apply immediately
2. RDS → database-1 → Connectivity & security → VPC security group → Inbound rules:
   Type PostgreSQL, Port 5432, Source = My IP (your IP: check https://api.ipify.org)
3. Wait until database-1 status is "Available" and "Publicly accessible" shows Yes

Then verify:
  npm run db:check
  npm run prisma:push

Note: IAM user "yash" cannot modify RDS/EC2 via CLI — these changes must be done in the console.
`)
process.exit(1)
