import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function getDatabaseUrl() {
  // Vercel runs the Next.js build before runtime environment variables are
  // available to some route-module evaluation paths. Never fail the build
  // just because DATABASE_URL is absent; Prisma will use the real URL at
  // runtime once the Vercel environment variable is configured.
  const raw = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder';

  // Supabase's shared transaction pooler (port 6543) is the right
  // connection for Vercel/serverless. Prisma must disable prepared
  // statements when using transaction pooling, and a single client-side
  // connection prevents each serverless instance from opening a large pool.
  if (raw.includes('.pooler.supabase.com:6543')) {
    const separator = raw.includes('?') ? '&' : '?';
    const params: string[] = [];
    if (!/[?&]pgbouncer=/.test(raw)) params.push('pgbouncer=true');
    if (!/[?&]connection_limit=/.test(raw)) params.push('connection_limit=1');
    if (!/[?&]connect_timeout=/.test(raw)) params.push('connect_timeout=15');
    return params.length ? `${raw}${separator}${params.join('&')}` : raw;
  }

  return raw;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: getDatabaseUrl() },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
