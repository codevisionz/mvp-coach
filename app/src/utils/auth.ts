import { api, setToken } from '../data/api';

export async function signupOrLogin(email: string, password: string) {
  try {
    const r = await api('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) });
    setToken(r.token);
    return r;
  } catch {
    const r = await api('/auth/signup', { method:'POST', body: JSON.stringify({ email, password }) });
    setToken(r.token);
    return r;
  }
}
