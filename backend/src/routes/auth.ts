import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';

export async function authRoutes(app: FastifyInstance) {
  app.post('/signup', async (req, rep) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(8) }).parse(req.body);
    const passwordHash = await argon2.hash(body.password);
    const user = await app.prisma.user.create({ data: { email: body.email, passwordHash } });
    const token = app.jwt.sign({ sub: user.id });
    return rep.send({ token, user: { id: user.id, email: user.email } });
  });

  app.post('/login', async (req, rep) => {
    const body = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const user = await app.prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await argon2.verify(user.passwordHash, body.password))) {
      return rep.status(401).send({ error: 'invalid_credentials' });
    }
    const token = app.jwt.sign({ sub: user.id });
    return rep.send({ token, user: { id: user.id, email: user.email } });
  });
}
