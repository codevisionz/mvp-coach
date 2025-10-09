// backend/src/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';

// ⬇️ Routen-Imports (passe an, je nachdem welche Dateien du hast)
import { authRoutes } from './routes/auth';
import { dataRoutes } from './routes/data';
import { syncRoutes } from './routes/sync';
import { chatRoutes } from './routes/chat';
import { profileRoutes } from './routes/profile';
import { astroRoutes } from './routes/astro';
import { aiRoutes } from './routes/ai';
// Optional, falls du zusätzlich die Non-Stream-Route nutzt:
// import { aiCoachRoutes } from './routes/aiCoach';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    // 🚫 Redaction: keine Tokens/Session-Daten im Log
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        'req.query.jwt' // falls SSE-Auth via ?jwt=… verwendet wird
      ],
      censor: '[redacted]',
    },
    // 🔒 Keine Query-Strings loggen (verhindert ?jwt=… im Log)
    serializers: {
      req(req: any) {
        const urlPathOnly = (req.url || '').split('?')[0];
        return { id: req.id, method: req.method, url: urlPathOnly, remoteAddress: req.ip };
      },
    },
  },
});

const prisma = new PrismaClient();

// --- Plugins
app.register(cors, { origin: true });
app.register(jwt, { secret: process.env.JWT_SECRET! });

// --- Dekoratoren
app.decorate('prisma', prisma);
app.decorate('auth', async (req: any, rep: any) => {
  try {
    await req.jwtVerify();
  } catch {
    return rep.status(401).send({ error: 'unauthorized' });
  }
});

// --- Healthcheck
app.get('/healthz', async () => ({ ok: true, ts: new Date().toISOString() }));

// --- Routen registrieren
app.register(authRoutes, { prefix: '/auth' });  // /auth/signup, /auth/login
app.register(dataRoutes, { prefix: '/api' });  // /api/checkins (MVP-CRUD)
app.register(syncRoutes, { prefix: '/sync' });  // /sync/changes, /sync/push
app.register(chatRoutes, { prefix: '' });  // /api/conversations…
app.register(profileRoutes, { prefix: '' });  // /api/profile
app.register(astroRoutes, { prefix: '' });  // /astro/transits
// Optional (klassisch, nicht-streamend):
app.register(aiRoutes, { prefix: ''   });  // /ai/coach

// --- Start
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

app.listen({ port, host }).then(() => {
  app.log.info(`Server listening on http://${host}:${port}`);
}).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

// --- Graceful shutdown
app.addHook('onClose', async () => {
  await prisma.$disconnect().catch(() => { });
});

// Optional: OS-Signale abfangen
const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down…`);
  try { await app.close(); } finally { process.exit(0); }
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

// --- Type Augmentation (Fastify <-> Prisma/JWT)
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    auth: any;
  }
}
