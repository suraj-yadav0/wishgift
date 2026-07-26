import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL || ''

let prismaInstance: PrismaClient

if (url.startsWith('libsql://') || url.startsWith('https://')) {
  const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
  prismaInstance = new PrismaClient({ adapter })
} else {
  prismaInstance = new PrismaClient({
    log: ['query'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? prismaInstance

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db