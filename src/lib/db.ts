import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * Guard de ambiente (sandbox/dev): o shell pode injetar um DATABASE_URL antigo
 * em formato SQLite ("file:..."), que não é aceito pelo client PostgreSQL.
 * Nesse caso, usamos o valor correto definido no .env (Postgres local/Neon).
 * Em produção (Vercel) a variável já é PostgreSQL e nada muda.
 */
function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL
  if (url && !url.startsWith('file:')) return url
  try {
    const envFile = readFileSync(path.join(process.cwd(), '.env'), 'utf-8')
    const match = envFile.match(/^DATABASE_URL="?([^"\r\n]+)"?/m)
    if (match?.[1]) {
      if (url?.startsWith('file:')) {
        console.warn('[db] DATABASE_URL do ambiente aponta para SQLite — usando o valor do .env (PostgreSQL).')
      }
      return match[1]
    }
  } catch {
    // .env ausente: segue com o que houver
  }
  return url
}

process.env.DATABASE_URL = resolveDatabaseUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
