import { api } from './api';

export type Conversation = {
  id: string;
  mode: 'coach'|'astroCoach'|string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string|null;
};

export type Message = {
  id: string;
  conversationId: string;
  role: 'user'|'assistant';
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string|null;
};

export async function listConversations(limit=20, offset=0): Promise<{items:Conversation[]; total:number}> {
  const r = await api(`/api/conversations?limit=${limit}&offset=${offset}`);
  return r;
}

export async function listMessages(conversationId: string, cursor?: string, limit=30): Promise<{items:Message[]; nextCursor:string|null; hasMore:boolean}> {
  const qs = new URLSearchParams();
  if (cursor) qs.set('cursor', cursor);
  qs.set('limit', String(limit));
  const r = await api(`/api/conversations/${conversationId}/messages?${qs.toString()}`);
  return r;
}

export async function aiCoach(prompt: string, opts: { conversationId?: string; mode?: 'coach'|'astroCoach'; astroHint?: string } = {}) {
  const r = await api('/ai/coach', {
    method: 'POST',
    body: JSON.stringify({ prompt, ...opts })
  });
  return r as { conversationId: string; reply: string; assistantMessageId: string; userMessageId: string };
}
