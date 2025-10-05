const API = (global as any).process?.env?.EXPO_PUBLIC_API_URL || (require('expo-constants').default.expoConfig?.extra?.API_URL);

let token: string | null = null;
export const setToken = (t: string | null) => { token = t; };

export async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...(init ?? {}),
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    const msg = await res.text().catch(()=>String(res.status));
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}
