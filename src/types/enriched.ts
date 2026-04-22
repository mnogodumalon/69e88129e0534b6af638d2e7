import type { Elektrogeraete, Wartungen } from './app';

export type EnrichedElektrogeraete = Elektrogeraete & {
  kategorieName: string;
  standortName: string;
};

export type EnrichedWartungen = Wartungen & {
  geraetName: string;
};
