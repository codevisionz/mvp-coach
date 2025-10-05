import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function dataRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  app.get('/checkins', async (req: any) => {
    const userId = req.user.sub as string;
    return app.prisma.checkIn.findMany({
      where: { userId, deletedAt: null },
      orderBy: { date: 'desc' }
    });
  });

  app.post('/checkins', async (req: any, rep) => {
    const userId = req.user.sub as string;
    const body = z.object({
      date: z.string(),                // ISO-Date
      mood: z.number().int().min(1).max(5),
      note: z.string().optional()
    }).parse(req.body);

    const row = await app.prisma.checkIn.create({
      data: { userId, date: new Date(body.date), mood: body.mood, note: body.note }
    });
    return rep.send(row);
  });

  app.put('/checkins/:id', async (req: any) => {
    const userId = req.user.sub as string;
    const params = z.object({ id: z.string().uuid() }).parse(req.params);
    const body = z.object({
      date: z.string().optional(),
      mood: z.number().int().min(1).max(5).optional(),
      note: z.string().optional(),
      deleted: z.boolean().optional()
    }).parse(req.body);

    const row = await app.prisma.checkIn.update({
      where: { id: params.id },
      data: {
        ...(body.date ? { date: new Date(body.date) } : {}),
        ...(body.mood ? { mood: body.mood } : {}),
        ...(body.note !== undefined ? { note: body.note } : {}),
        ...(body.deleted ? { deletedAt: new Date() } : {})
      }
    });
    return row;
  });
}
