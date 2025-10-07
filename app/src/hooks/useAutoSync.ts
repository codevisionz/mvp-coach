import { useEffect } from 'react';
import { AppState } from 'react-native';
import { runSync } from '../data/sync';

export function useAutoSync(intervalMs = 60_000) {
  useEffect(() => {
    let mounted = true;

    // 1) Sofort einmalig versuchen
    runSync().catch(() => {});

    // 2) Fokus-Events
    const sub = AppState.addEventListener('change', (s) => {
      if (!mounted) return;
      if (s === 'active') runSync().catch(() => {});
    });

    // 3) Intervall
    const timer = setInterval(() => {
      if (!mounted) return;
      runSync().catch(() => {});
    }, intervalMs);

    return () => {
      mounted = false;
      sub.remove();
      clearInterval(timer);
    };
  }, [intervalMs]);
}
