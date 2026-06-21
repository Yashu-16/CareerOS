/**
 * Prisma generate for CI (Amplify/CodeBuild). Invokes the Prisma CLI via Node
 * so it works when PATH does not include node_modules/.bin (Amplify preBuild).
 */
import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL =
    'postgresql://build:build@127.0.0.1:5432/careeros?schema=public&connect_timeout=1'
  console.warn('[prisma-generate] DATABASE_URL not set — using build placeholder for generate only.')
}

const prismaCli = join(root, 'node_modules', 'prisma', 'build', 'index.js')
require.resolve('prisma/package.json')

execFileSync(process.execPath, [prismaCli, 'generate'], {
  stdio: 'inherit',
  cwd: root,
  env: process.env,
})
