import { api } from './api';

export type Profile = {
  id: string;
  displayName?: string | null;
  astroEnabled: boolean;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
};

export async function getProfile(): Promise<Profile> {
  return api('/api/profile');
}

export async function updateProfile(patch: Partial<Profile>) {
  return api('/api/profile', { method: 'PUT', body: JSON.stringify(patch) });
}

export async function getAstroHint(input: { birthDate?: string|null; birthTime?: string|null; birthPlace?: string|null }) {
  return api('/astro/transits', { method: 'POST', body: JSON.stringify(input) }) as Promise<{ date: string; astroHint: string }>;
}
