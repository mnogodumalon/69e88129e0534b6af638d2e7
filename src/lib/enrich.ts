import type { EnrichedElektrogeraete, EnrichedWartungen } from '@/types/enriched';
import type { Elektrogeraete, Kategorien, Standorte, Wartungen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface ElektrogeraeteMaps {
  kategorienMap: Map<string, Kategorien>;
  standorteMap: Map<string, Standorte>;
}

export function enrichElektrogeraete(
  elektrogeraete: Elektrogeraete[],
  maps: ElektrogeraeteMaps
): EnrichedElektrogeraete[] {
  return elektrogeraete.map(r => ({
    ...r,
    kategorieName: resolveDisplay(r.fields.kategorie, maps.kategorienMap, 'kategorie_name'),
    standortName: resolveDisplay(r.fields.standort, maps.standorteMap, 'standort_name'),
  }));
}

interface WartungenMaps {
  elektrogeraeteMap: Map<string, Elektrogeraete>;
}

export function enrichWartungen(
  wartungen: Wartungen[],
  maps: WartungenMaps
): EnrichedWartungen[] {
  return wartungen.map(r => ({
    ...r,
    geraetName: resolveDisplay(r.fields.geraet, maps.elektrogeraeteMap, 'geraet_name'),
  }));
}
