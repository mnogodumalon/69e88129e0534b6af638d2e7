import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Kategorien, Standorte, Elektrogeraete, Wartungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [kategorien, setKategorien] = useState<Kategorien[]>([]);
  const [standorte, setStandorte] = useState<Standorte[]>([]);
  const [elektrogeraete, setElektrogeraete] = useState<Elektrogeraete[]>([]);
  const [wartungen, setWartungen] = useState<Wartungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [kategorienData, standorteData, elektrogeraeteData, wartungenData] = await Promise.all([
        LivingAppsService.getKategorien(),
        LivingAppsService.getStandorte(),
        LivingAppsService.getElektrogeraete(),
        LivingAppsService.getWartungen(),
      ]);
      setKategorien(kategorienData);
      setStandorte(standorteData);
      setElektrogeraete(elektrogeraeteData);
      setWartungen(wartungenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [kategorienData, standorteData, elektrogeraeteData, wartungenData] = await Promise.all([
          LivingAppsService.getKategorien(),
          LivingAppsService.getStandorte(),
          LivingAppsService.getElektrogeraete(),
          LivingAppsService.getWartungen(),
        ]);
        setKategorien(kategorienData);
        setStandorte(standorteData);
        setElektrogeraete(elektrogeraeteData);
        setWartungen(wartungenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const kategorienMap = useMemo(() => {
    const m = new Map<string, Kategorien>();
    kategorien.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kategorien]);

  const standorteMap = useMemo(() => {
    const m = new Map<string, Standorte>();
    standorte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [standorte]);

  const elektrogeraeteMap = useMemo(() => {
    const m = new Map<string, Elektrogeraete>();
    elektrogeraete.forEach(r => m.set(r.record_id, r));
    return m;
  }, [elektrogeraete]);

  return { kategorien, setKategorien, standorte, setStandorte, elektrogeraete, setElektrogeraete, wartungen, setWartungen, loading, error, fetchAll, kategorienMap, standorteMap, elektrogeraeteMap };
}