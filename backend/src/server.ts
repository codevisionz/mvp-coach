import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';
import { dataRoutes } from './routes/data';
import { syncRoutes } from './routes/sync';
import { aiRoutes } from './routes/ai';
import { chatRoutes } from './routes/chat';
import { profileRoutes } from './routes/profile';
import { astroRoutes } from './routes/astro';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

app.register(cors, { origin: true });
app.register(jwt, { secret: process.env.JWT_SECRET! });
app.register(aiRoutes, { prefix: '' }); // /ai/coach
app.register(chatRoutes, { prefix: '' });
app.register(profileRoutes, { prefix: '' });
app.register(astroRoutes, { prefix: '' });

app.decorate('prisma', prisma);
app.decorate('auth', async (req: any, rep: any) => {
  try { await req.jwtVerify(); } catch { return rep.status(401).send({ error: 'unauthorized' }); }
});

app.register(authRoutes, { prefix: '/auth' });
app.register(dataRoutes, { prefix: '/api' });
app.register(syncRoutes, { prefix: '/sync' });

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: '0.0.0.0' });

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    auth: any;
  }
}
