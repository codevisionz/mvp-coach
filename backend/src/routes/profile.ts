import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function profileRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  // Profil lesen
  app.get('/api/profile', async (req: any) => {
    const userId = req.user.sub as string;
    const user = await app.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'not_found' };
    return {
      id: user.id,
      displayName: user.displayName,
      astroEnabled: user.astroEnabled,
      birthDate: user.birthDate ? user.birthDate.toISOString().slice(0,10) : null,
      birthTime: user.birthTime ?? null,
      birthPlace: user.birthPlace ?? null
    };
  });

  // Profil speichern (Astro on/off + Geburtsdaten)
  app.put('/api/profile', async (req: any, rep) => {
    const userId = req.user.sub as string;
    const body = z.object({
      displayName: z.string().optional(),
      astroEnabled: z.boolean().optional(),
      birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      birthTime: z.string().nullable().optional(),      // "HH:mm" optional
      birthPlace: z.string().nullable().optional()
    }).parse(req.body ?? {});
    const row = await app.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: body.displayName,
        astroEnabled: body.astroEnabled,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        birthTime: body.birthTime ?? null,
        birthPlace: body.birthPlace ?? null
      }
    });
    return rep.send({ ok: true });
  });
}
