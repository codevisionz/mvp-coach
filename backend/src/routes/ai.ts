import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import OpenAI from 'openai';

const BodySchema = z.object({
  prompt: z.string().min(1),
  conversationId: z.string().uuid().optional(),
  mode: z.enum(['coach','astroCoach']).optional().default('coach'),
  astroHint: z.string().optional() // optionaler Tagesimpuls
});

export async function aiRoutes(app: FastifyInstance) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  app.addHook('preHandler', app.auth);

  app.post('/ai/coach', async (req: any, rep) => {
    const { prompt, conversationId, mode, astroHint } = BodySchema.parse(req.body);
    const userId = req.user.sub as string;

    // 1) Conversation sicherstellen
    let convId = conversationId ?? undefined;
    if (!convId) {
      const conv = await app.prisma.conversation.create({
        data: { userId, mode }
      });
      convId = conv.id;
    }

    // 2) User-Message speichern
    const userMsg = await app.prisma.message.create({
      data: { conversationId: convId!, role: 'user', content: prompt }
    });

    // 3) Prompt bauen
    const system = [
      'Du bist ein empathischer, lösungsorientierter Coach.',
      'Gib kurze, klare, umsetzbare Vorschläge (max. 3 Schritte).',
      'Nutze Techniken aus Achtsamkeit, CBT und Stoizismus.',
      mode === 'astroCoach'
        ? 'Wenn ein Astro-Impuls vorliegt, verwebe ihn sanft als Reflexionshilfe (niemals deterministisch).'
        : ''
    ].filter(Boolean).join(' ');

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: system },
    ];
    if (astroHint) messages.push({ role: 'system', content: `Astro-Impuls: ${astroHint}` });
    messages.push({ role: 'user', content: prompt });

    // 4) OpenAI call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? '…';

    // 5) Assistant-Message speichern
    const aiMsg = await app.prisma.message.create({
      data: { conversationId: convId!, role: 'assistant', content: reply }
    });

    // 6) Conversation aktualisieren
    await app.prisma.conversation.update({
      where: { id: convId! },
      data: { updatedAt: new Date() }
    });

    return rep.send({
      conversationId: convId,
      reply,
      userMessageId: userMsg.id,
      assistantMessageId: aiMsg.id
    });
  });
}
