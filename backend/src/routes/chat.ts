import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function chatRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  // Liste Konversationen des Users (neueste zuerst) – optional limit/offset
  app.get('/api/conversations', async (req: any) => {
    const userId = req.user.sub as string;
    const { limit = 20, offset = 0 } = (req.query ?? {}) as any;

    const [items, total] = await Promise.all([
      app.prisma.conversation.findMany({
        where: { userId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      }),
      app.prisma.conversation.count({ where: { userId, deletedAt: null } })
    ]);

    return { items, total, limit: Number(limit), offset: Number(offset) };
  });

  // Nachrichten einer Konversation – cursor-basiert (createdAt < cursor → ältere laden)
  app.get('/api/conversations/:id/messages', async (req: any, rep) => {
    const userId = req.user.sub as string;
    const params = z.object({ id: z.string().uuid() }).parse(req.params);
    const query = z.object({
      cursor: z.string().datetime().optional(), // ISO
      limit: z.string().optional()
    }).parse(req.query ?? {});

    // Ownership prüfen
    const conv = await app.prisma.conversation.findFirst({
      where: { id: params.id, userId }
    });
    if (!conv) return rep.status(404).send({ error: 'not_found' });

    const limit = Math.min(Number(query.limit ?? 30), 100);
    const where: any = { conversationId: params.id, deletedAt: null };
    if (query.cursor) { where.createdAt = { lt: new Date(query.cursor) }; }

    const msgs = await app.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' }, // neueste zuerst holen
      take: limit
    });

    // Client will meist älteste zuerst anzeigen → reverse
    const items = msgs.reverse();

    const nextCursor = items.length
      ? items[0].createdAt.toISOString() // älteste geladene als neuer Cursor
      : null;

    return { items, nextCursor, hasMore: !!nextCursor && msgs.length === limit };
  });

  // (Optional) einzelne Konversation holen
  app.get('/api/conversations/:id', async (req: any, rep) => {
    const userId = req.user.sub as string;
    const params = z.object({ id: z.string().uuid() }).parse(req.params);
    const conv = await app.prisma.conversation.findFirst({
      where: { id: params.id, userId, deletedAt: null }
    });
    if (!conv) return rep.status(404).send({ error: 'not_found' });
    return conv;
  });
}
