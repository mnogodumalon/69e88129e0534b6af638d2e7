// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Kategorien {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    kategorie_name?: string;
    kategorie_beschreibung?: string;
  };
}

export interface Standorte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    standort_name?: string;
    gebaeude?: string;
    etage?: string;
    raum?: string;
    standort_beschreibung?: string;
  };
}

export interface Elektrogeraete {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    geraet_name?: string;
    hersteller?: string;
    modell?: string;
    seriennummer?: string;
    inventarnummer?: string;
    kategorie?: string; // applookup -> URL zu 'Kategorien' Record
    standort?: string; // applookup -> URL zu 'Standorte' Record
    kaufdatum?: string; // Format: YYYY-MM-DD oder ISO String
    kaufpreis?: number;
    garantie_ablauf?: string; // Format: YYYY-MM-DD oder ISO String
    status?: LookupValue;
    foto?: string;
    notizen?: string;
  };
}

export interface Wartungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    geraet?: string; // applookup -> URL zu 'Elektrogeraete' Record
    wartungsart?: LookupValue;
    wartungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    techniker_vorname?: string;
    techniker_nachname?: string;
    beschreibung?: string;
    ergebnis?: LookupValue;
    naechste_wartung?: string; // Format: YYYY-MM-DD oder ISO String
    kosten?: number;
    wartung_notizen?: string;
  };
}

export const APP_IDS = {
  KATEGORIEN: '69e8810fdd12d6d0097878ed',
  STANDORTE: '69e8811331e937575115dfb9',
  ELEKTROGERAETE: '69e88114578bd52f940aaaac',
  WARTUNGEN: '69e88115cc9d2c5a229b5b9a',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'elektrogeraete': {
    status: [{ key: "aktiv", label: "Aktiv" }, { key: "defekt", label: "Defekt" }, { key: "in_reparatur", label: "In Reparatur" }, { key: "ausgemustert", label: "Ausgemustert" }, { key: "lagernd", label: "Lagernd" }],
  },
  'wartungen': {
    wartungsart: [{ key: "inspektion", label: "Inspektion" }, { key: "reparatur", label: "Reparatur" }, { key: "kalibrierung", label: "Kalibrierung" }, { key: "reinigung", label: "Reinigung" }, { key: "software_update", label: "Software-Update" }, { key: "sonstiges", label: "Sonstiges" }],
    ergebnis: [{ key: "erfolgreich", label: "Erfolgreich" }, { key: "teilweise_erfolgreich", label: "Teilweise erfolgreich" }, { key: "nicht_erfolgreich", label: "Nicht erfolgreich" }, { key: "handlungsbedarf", label: "Weiterer Handlungsbedarf" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'kategorien': {
    'kategorie_name': 'string/text',
    'kategorie_beschreibung': 'string/textarea',
  },
  'standorte': {
    'standort_name': 'string/text',
    'gebaeude': 'string/text',
    'etage': 'string/text',
    'raum': 'string/text',
    'standort_beschreibung': 'string/textarea',
  },
  'elektrogeraete': {
    'geraet_name': 'string/text',
    'hersteller': 'string/text',
    'modell': 'string/text',
    'seriennummer': 'string/text',
    'inventarnummer': 'string/text',
    'kategorie': 'applookup/select',
    'standort': 'applookup/select',
    'kaufdatum': 'date/date',
    'kaufpreis': 'number',
    'garantie_ablauf': 'date/date',
    'status': 'lookup/select',
    'foto': 'file',
    'notizen': 'string/textarea',
  },
  'wartungen': {
    'geraet': 'applookup/select',
    'wartungsart': 'lookup/select',
    'wartungsdatum': 'date/date',
    'techniker_vorname': 'string/text',
    'techniker_nachname': 'string/text',
    'beschreibung': 'string/textarea',
    'ergebnis': 'lookup/select',
    'naechste_wartung': 'date/date',
    'kosten': 'number',
    'wartung_notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateKategorien = StripLookup<Kategorien['fields']>;
export type CreateStandorte = StripLookup<Standorte['fields']>;
export type CreateElektrogeraete = StripLookup<Elektrogeraete['fields']>;
export type CreateWartungen = StripLookup<Wartungen['fields']>;