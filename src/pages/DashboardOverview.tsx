import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichElektrogeraete, enrichWartungen } from '@/lib/enrich';
import type { EnrichedElektrogeraete, EnrichedWartungen } from '@/types/enriched';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconDeviceLaptop,
  IconAlertTriangle, IconCircleCheck, IconArchive,
  IconPackage, IconPlugOff, IconSearch, IconX,
  IconCalendarDue, IconCurrencyEuro, IconMapPin, IconTag,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/StatCard';
import { ElektrogeraeteDialog } from '@/components/dialogs/ElektrogeraeteDialog';
import { WartungenDialog } from '@/components/dialogs/WartungenDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';

const APPGROUP_ID = '69e88129e0534b6af638d2e7';
const REPAIR_ENDPOINT = '/claude/build/repair';

type StatusKey = 'aktiv' | 'defekt' | 'in_reparatur' | 'ausgemustert' | 'lagernd';

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  aktiv: { label: 'Aktiv', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <IconCircleCheck size={13} className="text-emerald-600 shrink-0" /> },
  defekt: { label: 'Defekt', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: <IconPlugOff size={13} className="text-red-600 shrink-0" /> },
  in_reparatur: { label: 'In Reparatur', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: <IconTool size={13} className="text-orange-600 shrink-0" /> },
  ausgemustert: { label: 'Ausgemustert', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: <IconArchive size={13} className="text-gray-400 shrink-0" /> },
  lagernd: { label: 'Lagernd', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <IconPackage size={13} className="text-blue-600 shrink-0" /> },
};

function StatusBadge({ statusKey }: { statusKey: string | undefined }) {
  const cfg = STATUS_CONFIG[statusKey as StatusKey] ?? { label: statusKey ?? '—', color: 'text-muted-foreground', bg: 'bg-muted border-border', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function GarantieWarning({ ablauf }: { ablauf: string | undefined }) {
  if (!ablauf) return null;
  const today = new Date();
  const d = new Date(ablauf);
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / 86400000);
  if (diffDays > 30) return null;
  if (diffDays < 0) return <span className="text-xs text-red-500 font-medium">Garantie abgelaufen</span>;
  return <span className="text-xs text-orange-500 font-medium">Garantie läuft ab in {diffDays} Tagen</span>;
}

export default function DashboardOverview() {
  const {
    kategorien, standorte, elektrogeraete, wartungen,
    kategorienMap, standorteMap, elektrogeraeteMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedElektrogeraete = enrichElektrogeraete(elektrogeraete, { kategorienMap, standorteMap });
  const enrichedWartungen = enrichWartungen(wartungen, { elektrogeraeteMap });

  // State — all hooks before early returns
  const [selectedGeraet, setSelectedGeraet] = useState<EnrichedElektrogeraete | null>(null);
  const [geraetDialogOpen, setGeraetDialogOpen] = useState(false);
  const [editGeraet, setEditGeraet] = useState<EnrichedElektrogeraete | null>(null);
  const [deleteGeraetTarget, setDeleteGeraetTarget] = useState<EnrichedElektrogeraete | null>(null);
  const [wartungDialogOpen, setWartungDialogOpen] = useState(false);
  const [editWartung, setEditWartung] = useState<EnrichedWartungen | null>(null);
  const [deleteWartungTarget, setDeleteWartungTarget] = useState<EnrichedWartungen | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('alle');

  const filteredGeraete = useMemo(() => {
    return enrichedElektrogeraete.filter(g => {
      const matchStatus = filterStatus === 'alle' || g.fields.status?.key === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        (g.fields.geraet_name ?? '').toLowerCase().includes(q) ||
        (g.fields.hersteller ?? '').toLowerCase().includes(q) ||
        (g.fields.modell ?? '').toLowerCase().includes(q) ||
        g.kategorieName.toLowerCase().includes(q) ||
        g.standortName.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [enrichedElektrogeraete, filterStatus, searchQuery]);

  const geraetWartungen = useMemo(() => {
    if (!selectedGeraet) return [];
    const geraetUrl = createRecordUrl(APP_IDS.ELEKTROGERAETE, selectedGeraet.record_id);
    return enrichedWartungen
      .filter(w => w.fields.geraet === geraetUrl)
      .sort((a, b) => (b.fields.wartungsdatum ?? '').localeCompare(a.fields.wartungsdatum ?? ''));
  }, [selectedGeraet, enrichedWartungen]);

  // KPI Stats
  const statsTotal = elektrogeraete.length;
  const statsAktiv = elektrogeraete.filter(g => g.fields.status?.key === 'aktiv').length;
  const statsDefekt = elektrogeraete.filter(g => g.fields.status?.key === 'defekt' || g.fields.status?.key === 'in_reparatur').length;
  const statsWartungen = wartungen.length;

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleCreateGeraet = async (fields: EnrichedElektrogeraete['fields']) => {
    await LivingAppsService.createElektrogeraeteEntry(fields as never);
    fetchAll();
  };

  const handleEditGeraet = async (fields: EnrichedElektrogeraete['fields']) => {
    if (!editGeraet) return;
    await LivingAppsService.updateElektrogeraeteEntry(editGeraet.record_id, fields as never);
    fetchAll();
  };

  const handleDeleteGeraet = async () => {
    if (!deleteGeraetTarget) return;
    await LivingAppsService.deleteElektrogeraeteEntry(deleteGeraetTarget.record_id);
    if (selectedGeraet?.record_id === deleteGeraetTarget.record_id) setSelectedGeraet(null);
    setDeleteGeraetTarget(null);
    fetchAll();
  };

  const handleCreateWartung = async (fields: EnrichedWartungen['fields']) => {
    await LivingAppsService.createWartungenEntry(fields as never);
    fetchAll();
  };

  const handleEditWartung = async (fields: EnrichedWartungen['fields']) => {
    if (!editWartung) return;
    await LivingAppsService.updateWartungenEntry(editWartung.record_id, fields as never);
    fetchAll();
  };

  const handleDeleteWartung = async () => {
    if (!deleteWartungTarget) return;
    await LivingAppsService.deleteWartungenEntry(deleteWartungTarget.record_id);
    setDeleteWartungTarget(null);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Geräte gesamt"
          value={String(statsTotal)}
          description="Erfasst"
          icon={<IconDeviceLaptop size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Aktiv"
          value={String(statsAktiv)}
          description="In Betrieb"
          icon={<IconCircleCheck size={18} className="text-emerald-500" />}
        />
        <StatCard
          title="Defekt / Reparatur"
          value={String(statsDefekt)}
          description="Handlungsbedarf"
          icon={<IconAlertTriangle size={18} className="text-orange-500" />}
        />
        <StatCard
          title="Wartungen"
          value={String(statsWartungen)}
          description="Einträge gesamt"
          icon={<IconTool size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Main workspace: Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[600px]">
        {/* LEFT: Geräteliste */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Toolbar */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-0">
              <IconSearch size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
              <Input
                placeholder="Suchen..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <IconX size={13} />
                </button>
              )}
            </div>
            <Button
              size="sm"
              className="h-8 shrink-0"
              onClick={() => { setEditGeraet(null); setGeraetDialogOpen(true); }}
            >
              <IconPlus size={14} className="mr-1 shrink-0" />
              <span className="hidden sm:inline">Gerät</span>
            </Button>
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-1">
            {['alle', 'aktiv', 'defekt', 'in_reparatur', 'lagernd', 'ausgemustert'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                  filterStatus === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {s === 'alle' ? 'Alle' : STATUS_CONFIG[s as StatusKey]?.label ?? s}
              </button>
            ))}
          </div>

          {/* Device list */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[600px] pr-0.5">
            {filteredGeraete.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <IconDeviceLaptop size={40} className="text-muted-foreground/40" stroke={1.5} />
                <p className="text-sm text-muted-foreground">
                  {searchQuery || filterStatus !== 'alle' ? 'Keine Geräte gefunden' : 'Noch keine Geräte erfasst'}
                </p>
                {!searchQuery && filterStatus === 'alle' && (
                  <Button size="sm" variant="outline" onClick={() => { setEditGeraet(null); setGeraetDialogOpen(true); }}>
                    <IconPlus size={14} className="mr-1" />Erstes Gerät hinzufügen
                  </Button>
                )}
              </div>
            )}
            {filteredGeraete.map(g => {
              const isSelected = selectedGeraet?.record_id === g.record_id;
              return (
                <div
                  key={g.record_id}
                  onClick={() => setSelectedGeraet(isSelected ? null : g)}
                  className={`rounded-xl border p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm truncate">{g.fields.geraet_name ?? '(Kein Name)'}</span>
                        <StatusBadge statusKey={g.fields.status?.key} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {[g.fields.hersteller, g.fields.modell].filter(Boolean).join(' · ')}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {g.kategorieName && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <IconTag size={11} className="shrink-0" />{g.kategorieName}
                          </span>
                        )}
                        {g.standortName && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <IconMapPin size={11} className="shrink-0" />{g.standortName}
                          </span>
                        )}
                      </div>
                      <GarantieWarning ablauf={g.fields.garantie_ablauf} />
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setEditGeraet(g); setGeraetDialogOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Bearbeiten"
                      >
                        <IconPencil size={14} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteGeraetTarget(g); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Löschen"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Detail Panel */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
          {!selectedGeraet ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
              <IconDeviceLaptop size={48} className="text-muted-foreground/30" stroke={1.5} />
              <p className="text-muted-foreground text-sm max-w-xs">
                Wähle ein Gerät aus der Liste, um Details und Wartungshistorie anzuzeigen.
              </p>
            </div>
          ) : (
            <>
              {/* Device Header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold truncate">{selectedGeraet.fields.geraet_name ?? '(Kein Name)'}</h2>
                      <StatusBadge statusKey={selectedGeraet.fields.status?.key} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {[selectedGeraet.fields.hersteller, selectedGeraet.fields.modell].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => { setEditGeraet(selectedGeraet); setGeraetDialogOpen(true); }}>
                      <IconPencil size={14} className="mr-1 shrink-0" />Bearbeiten
                    </Button>
                  </div>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {selectedGeraet.kategorieName && (
                    <div className="bg-background rounded-lg p-2.5 border border-border/60">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">Kategorie</div>
                      <div className="text-sm font-medium truncate">{selectedGeraet.kategorieName}</div>
                    </div>
                  )}
                  {selectedGeraet.standortName && (
                    <div className="bg-background rounded-lg p-2.5 border border-border/60">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">Standort</div>
                      <div className="text-sm font-medium truncate">{selectedGeraet.standortName}</div>
                    </div>
                  )}
                  {selectedGeraet.fields.inventarnummer && (
                    <div className="bg-background rounded-lg p-2.5 border border-border/60">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">Inventar-Nr.</div>
                      <div className="text-sm font-medium truncate">{selectedGeraet.fields.inventarnummer}</div>
                    </div>
                  )}
                  {selectedGeraet.fields.seriennummer && (
                    <div className="bg-background rounded-lg p-2.5 border border-border/60">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">Serien-Nr.</div>
                      <div className="text-sm font-medium truncate">{selectedGeraet.fields.seriennummer}</div>
                    </div>
                  )}
                  {selectedGeraet.fields.kaufdatum && (
                    <div className="bg-background rounded-lg p-2.5 border border-border/60">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5 flex items-center gap-1">
                        <IconCalendarDue size={10} />Kauf
                      </div>
                      <div className="text-sm font-medium">{formatDate(selectedGeraet.fields.kaufdatum)}</div>
                    </div>
                  )}
                  {selectedGeraet.fields.kaufpreis != null && (
                    <div className="bg-background rounded-lg p-2.5 border border-border/60">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5 flex items-center gap-1">
                        <IconCurrencyEuro size={10} />Kaufpreis
                      </div>
                      <div className="text-sm font-medium">{formatCurrency(selectedGeraet.fields.kaufpreis)}</div>
                    </div>
                  )}
                  {selectedGeraet.fields.garantie_ablauf && (
                    <div className="bg-background rounded-lg p-2.5 border border-border/60">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">Garantie bis</div>
                      <div className="text-sm font-medium">{formatDate(selectedGeraet.fields.garantie_ablauf)}</div>
                      <GarantieWarning ablauf={selectedGeraet.fields.garantie_ablauf} />
                    </div>
                  )}
                </div>
                {selectedGeraet.fields.notizen && (
                  <div className="mt-3 p-2.5 bg-muted/40 rounded-lg text-sm text-muted-foreground">
                    {selectedGeraet.fields.notizen}
                  </div>
                )}
              </div>

              {/* Wartungshistorie */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <IconTool size={15} className="text-muted-foreground shrink-0" />
                    Wartungshistorie
                    {geraetWartungen.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-normal">
                        {geraetWartungen.length}
                      </span>
                    )}
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => { setEditWartung(null); setWartungDialogOpen(true); }}
                  >
                    <IconPlus size={12} className="mr-1 shrink-0" />Wartung
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {geraetWartungen.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                      <IconTool size={32} className="text-muted-foreground/30" stroke={1.5} />
                      <p className="text-sm text-muted-foreground">Noch keine Wartung erfasst</p>
                      <Button size="sm" variant="outline" onClick={() => { setEditWartung(null); setWartungDialogOpen(true); }}>
                        <IconPlus size={12} className="mr-1" />Wartung hinzufügen
                      </Button>
                    </div>
                  )}
                  {geraetWartungen.map(w => (
                    <div key={w.record_id} className="rounded-xl border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{w.fields.wartungsart?.label ?? 'Wartung'}</span>
                            {w.fields.ergebnis && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${
                                w.fields.ergebnis.key === 'erfolgreich'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : w.fields.ergebnis.key === 'handlungsbedarf'
                                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                                  : w.fields.ergebnis.key === 'nicht_erfolgreich'
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : 'bg-muted border-border text-muted-foreground'
                              }`}>
                                {w.fields.ergebnis.label}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                            {w.fields.wartungsdatum && (
                              <span className="flex items-center gap-0.5">
                                <IconCalendarDue size={11} className="shrink-0" />
                                {formatDate(w.fields.wartungsdatum)}
                              </span>
                            )}
                            {(w.fields.techniker_vorname || w.fields.techniker_nachname) && (
                              <span>{[w.fields.techniker_vorname, w.fields.techniker_nachname].filter(Boolean).join(' ')}</span>
                            )}
                            {w.fields.kosten != null && (
                              <span className="flex items-center gap-0.5">
                                <IconCurrencyEuro size={11} className="shrink-0" />
                                {formatCurrency(w.fields.kosten)}
                              </span>
                            )}
                          </div>
                          {w.fields.beschreibung && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{w.fields.beschreibung}</p>
                          )}
                          {w.fields.naechste_wartung && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <IconCalendarDue size={11} className="shrink-0" />
                              Nächste Wartung: {formatDate(w.fields.naechste_wartung)}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => { setEditWartung(w); setWartungDialogOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Bearbeiten"
                          >
                            <IconPencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteWartungTarget(w)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Löschen"
                          >
                            <IconTrash size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ElektrogeraeteDialog
        open={geraetDialogOpen}
        onClose={() => { setGeraetDialogOpen(false); setEditGeraet(null); }}
        onSubmit={editGeraet ? handleEditGeraet : handleCreateGeraet}
        defaultValues={editGeraet?.fields}
        kategorienList={kategorien}
        standorteList={standorte}
        enablePhotoScan={AI_PHOTO_SCAN['Elektrogeraete']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Elektrogeraete']}
      />

      <WartungenDialog
        open={wartungDialogOpen}
        onClose={() => { setWartungDialogOpen(false); setEditWartung(null); }}
        onSubmit={editWartung ? handleEditWartung : handleCreateWartung}
        defaultValues={editWartung
          ? editWartung.fields
          : selectedGeraet
          ? { geraet: createRecordUrl(APP_IDS.ELEKTROGERAETE, selectedGeraet.record_id) }
          : undefined}
        elektrogeraeteList={elektrogeraete}
        enablePhotoScan={AI_PHOTO_SCAN['Wartungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Wartungen']}
      />

      <ConfirmDialog
        open={!!deleteGeraetTarget}
        title="Gerät löschen"
        description={`„${deleteGeraetTarget?.fields.geraet_name ?? 'Gerät'}" wirklich löschen?`}
        onConfirm={handleDeleteGeraet}
        onClose={() => setDeleteGeraetTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteWartungTarget}
        title="Wartung löschen"
        description="Diesen Wartungseintrag wirklich löschen?"
        onConfirm={handleDeleteWartung}
        onClose={() => setDeleteWartungTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-2/3" />
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="lg:col-span-3 h-[500px] rounded-2xl" />
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
