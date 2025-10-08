import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function syncRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  app.get('/changes', async (req: any) => {
    const userId = req.user.sub as string;
    const sinceStr = (req.query?.since as string) ?? '1970-01-01T00:00:00Z';
    const since = new Date(sinceStr);

    const [checkins, journals, conversations, messages] = await Promise.all([
      app.prisma.checkIn.findMany({ where: { userId, updatedAt: { gt: since } } }),
      app.prisma.journal.findMany({ where: { userId, updatedAt: { gt: since } } }),
      app.prisma.conversation.findMany({ where: { userId, updatedAt: { gt: since } } }),
      app.prisma.message.findMany({
        where: { updatedAt: { gt: since }, conversation: { userId } }
      })
    ]);

    return { checkins, journals, conversations, messages };
  });

  app.post('/push', async (req: any) => {
    const userId = req.user.sub as string;
    const body = z.object({
      checkins: z.array(z.any()).optional(),
      journals: z.array(z.any()).optional(),
      conversations: z.array(z.any()).optional(),
      messages: z.array(z.any()).optional(),
      deletes: z.array(z.object({ table: z.string(), id: z.string().uuid() })).optional()
    }).parse(req.body);

    const tx = [];
    for (const r of body.checkins ?? []) {
      tx.push(app.prisma.checkIn.upsert({
        where: { id: r.id },
        create: { ...r, userId, date: new Date(r.date), deletedAt: r.deletedAt ?? null },
        update: { ...r, userId, date: new Date(r.date), deletedAt: r.deletedAt ?? null }
      }));
    }
    for (const r of body.journals ?? []) {
      tx.push(app.prisma.journal.upsert({
        where: { id: r.id },
        create: { ...r, userId, deletedAt: r.deletedAt ?? null },
        update: { ...r, userId, deletedAt: r.deletedAt ?? null }
      }));
    }
    for (const r of body.conversations ?? []) {
      tx.push(app.prisma.conversation.upsert({
        where: { id: r.id },
        create: { ...r, userId, deletedAt: r.deletedAt ?? null },
        update: { ...r, userId, deletedAt: r.deletedAt ?? null }
      }));
    }
    for (const r of body.messages ?? []) {
      tx.push(app.prisma.message.upsert({
        where: { id: r.id },
        create: { ...r, deletedAt: r.deletedAt ?? null },
        update: { ...r, deletedAt: r.deletedAt ?? null }
      }));
    }
    for (const d of body.deletes ?? []) {
      if (d.table === 'checkins') tx.push(app.prisma.checkIn.update({ where: { id: d.id }, data: { deletedAt: new Date() } }));
      if (d.table === 'journals') tx.push(app.prisma.journal.updateMany({ where: { id: d.id }, data: { deletedAt: new Date() } }));
      if (d.table === 'conversations') tx.push(app.prisma.conversation.update({ where: { id: d.id }, data: { deletedAt: new Date() } }));
      if (d.table === 'messages') tx.push(app.prisma.message.update({ where: { id: d.id }, data: { deletedAt: new Date() } }));
    }
    await app.prisma.$transaction(tx);
    return { ok: true };
  });
}
