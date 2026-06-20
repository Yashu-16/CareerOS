/**
 * Prisma generate for CI (Amplify/CodeBuild). DATABASE_URL must exist in schema
 * even though generate does not connect — use a harmless placeholder if unset.
 */
import { execSync } from 'child_process'

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL =
    'postgresql://build:build@127.0.0.1:5432/careeros?schema=public&connect_timeout=1'
  console.warn('[prisma-generate] DATABASE_URL not set — using build placeholder for generate only.')
}

execSync('prisma generate', { stdio: 'inherit' })
