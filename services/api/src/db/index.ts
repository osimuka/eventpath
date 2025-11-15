import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function initializePrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    throw new Error('Prisma not initialized');
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
