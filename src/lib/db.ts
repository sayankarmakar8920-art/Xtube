import { PrismaClient } from '@prisma/client'

// Ensure DATABASE_URL is set correctly for Supabase PostgreSQL fallback
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres.vdbrdgheycebtgxavpst:sayankarmakar159%40gmail.com@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = "postgresql://postgres.vdbrdgheycebtgxavpst:sayankarmakar159%40gmail.com@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db