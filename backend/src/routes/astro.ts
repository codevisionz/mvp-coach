import { FastifyInstance } from 'fastify';
import { z } from 'zod';

function simpleDailyHint(dateISO: string) {
  // Sehr einfacher, deterministischer "Tages-Impuls" als Platzhalter.
  const day = Number(dateISO.slice(8,10));
  const hints = [
    'Fokus auf Loslassen und Klarheit.',
    'Guter Tag für neue Routinen.',
    'Reflexion statt Aktion – kurz innehalten.',
    'Kommunikation bewusst und klar halten.',
    'Sanfter Neustart: Kleine Schritte zählen.',
    'Grenzen setzen, Energie schützen.',
    'Mut zu ehrlichem Feedback.'
  ];
  return hints[day % hints.length];
}

export async function astroRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.auth);

  // Liefert den Tages-Hint – optional unter Einbezug der Geburtsdaten (MVP ignoriert sie)
  app.post('/astro/transits', async (req: any) => {
    const _ = z.object({
      birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      birthTime: z.string().nullable().optional(),
      birthPlace: z.string().nullable().optional()
    }).parse(req.body ?? {});

    const today = new Date().toISOString().slice(0,10);
    const hint = simpleDailyHint(today);
    return { date: today, astroHint: hint }; // { astroHint: string }
  });
}
