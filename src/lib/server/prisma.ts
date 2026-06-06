import { PrismaClient } from '@prisma/client';
import { POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING } from '$env/static/private';

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.NODE_ENV === 'production' 
    ? POSTGRES_PRISMA_URL 
    : POSTGRES_URL_NON_POOLING;

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		datasources: {
			db: {
				url: databaseUrl
			}
		}
	});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}