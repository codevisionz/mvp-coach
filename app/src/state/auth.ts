import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';
import { api, bindGetToken } from '../data/api';

const AuthSchema = z.object({
  token: z.string().nullable(),
  email: z.string().email().nullable()
});
export type AuthState = z.infer<typeof AuthSchema>;

const secureStorage: StateStorage = {
  getItem: async (name) => {
    const v = await SecureStore.getItemAsync(name);
    return v ?? null;
  },
  setItem: async (name, value) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name) => {
    await SecureStore.deleteItemAsync(name);
  }
};

type Actions = {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState & Actions>()(
  persist(
    (set, get) => ({
      token: null,
      email: null,

      async login(email, password) {
        const r = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        set({ token: r.token, email: email });
      },

      async signup(email, password) {
        const r = await api('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        set({ token: r.token, email: email });
      },

      async logout() {
        set({ token: null, email: null });
        // optional: weitere lokale Daten löschen
      }
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ token: state.token, email: state.email })
    }
  )
);

// API-Client soll Token aus dem Store holen
bindGetToken(() => useAuthStore.getState().token);
