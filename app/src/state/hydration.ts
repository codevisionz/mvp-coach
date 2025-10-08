import { useEffect, useState } from 'react';
import { useAuthStore } from './auth';

export function useAuthHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration?.(() => setReady(true));
    // falls bereits geladen
    if ((useAuthStore as any).persist.hasHydrated()) setReady(true);
    return () => { unsub?.(); };
  }, []);
  return ready;
}
