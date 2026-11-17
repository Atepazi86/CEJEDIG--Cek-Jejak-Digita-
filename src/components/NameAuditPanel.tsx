import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  FileSearch,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type {
  NameFindingSeverity,
  NameSearchFinding,
  OsintQueryItem,
} from '../types/audit';

interface NameAuditPanelProps {
  fullName: string;
  affiliation: string;
  onFullNameChange: (value: string) => void;
  onAffiliationChange: (value: string) => void;
  isSearching: boolean;
  hasSearched: boolean;
  searchError: string | null;
  searchSummary: string | null;
  findings: NameSearchFinding[];
  queries: OsintQueryItem[];
  onAutoSearch: () => void;
  onToggleFindingConfirm: (id: string) => void;
  onAddManualFinding: (
    title: string,
    url: string,
    severity: NameFindingSeverity,
    note: string
  ) => void;
  onToggleQueryConfirm: (id: string) => void;
  onQueryNoteChange: (id: string, note: string) => void;
}

type FilterSeverity = 'all' | NameFindingSeverity;

function getSeverityStyle(severity: NameFindingSeverity) {
  switch (severity) {
    case 'bahaya':
      return {
        label: 'Berbahaya',
        textClass: 'text-red-400',
        Icon: ShieldAlert,
      };
    case 'waspada':
      return {
        label: 'Perlu Dicek',
        textClass: 'text-amber-400',
        Icon: AlertTriangle,
      };
    default:
      return {
        label: 'Aman',
        textClass: 'text-emerald-400',
        Icon: ShieldCheck,
      };
  }
}

export const NameAuditPanel: React.FC<NameAuditPanelProps> = ({
  fullName,
  affiliation,
  onFullNameChange,
  onAffiliationChange,
  isSearching,
  hasSearched,
  searchError,
  searchSummary,
  findings,
  queries,
  onAutoSearch,
  onToggleFindingConfirm,
  onAddManualFinding,
  onToggleQueryConfirm,
  onQueryNoteChange,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterSeverity>('all');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualSeverity, setManualSeverity] = useState<NameFindingSeverity>('bahaya');
  const [manualNote, setManualNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setFilter('all');
    onAutoSearch();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    onAddManualFinding(
      manualTitle.trim(),
      manualUrl.trim(),
      manualSeverity,
      manualNote.trim()
    );
    setManualTitle('');
    setManualUrl('');
    setManualNote('');
    setShowManualForm(false);
  };

  const handleCopy = async (id: string, query: string) => {
    try {
      await navigator.clipboard.writeText(query);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  const countAman = findings.filter((f) => f.severity === 'aman').length;
  const countWaspada = findings.filter((f) => f.severity === 'waspada').length;
  const countBahaya = findings.filter((f) => f.severity === 'bahaya').length;

  const filteredFindings =
    filter === 'all' ? findings : findings.filter((f) => f.severity === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Audit Nama &amp; Dokumen Publik</h3>
          <p className="text-xs text-zinc-400">
            Cek indeks gratis (GitHub, OpenAlex, Wikipedia) + kueri Google Dork manual tanpa kuota API.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowManualForm((prev) => !prev)}
          className="inline-flex items-center gap-1 self-start text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Catat Temuan Manual</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-12">
        <div className="sm:col-span-5">
          <label htmlFor="audit-fullname-input" className="sr-only">
            Nama Lengkap
          </label>
          <input
            id="audit-fullname-input"
            type="text"
            required
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="Nama lengkap Anda"
            className="w-full rounded-lg border border-white/10 bg-[#07080C] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-4">
          <label htmlFor="audit-affiliation-input" className="sr-only">
            Kampus, Kota, atau Instansi
          </label>
          <input
            id="audit-affiliation-input"
            type="text"
            value={affiliation}
            onChange={(e) => onAffiliationChange(e.target.value)}
            placeholder="Kampus / kota (opsional)"
            className="w-full rounded-lg border border-white/10 bg-[#07080C] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={isSearching || !fullName.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <FileSearch className="h-4 w-4" aria-hidden="true" />
            <span>{isSearching ? 'Mencari...' : 'Cari & Buat Dork'}</span>
          </button>
        </div>
      </form>

      {showManualForm && (
        <form
          onSubmit={handleManualSubmit}
          className="rounded-lg border border-white/10 bg-[#07080C] p-4 space-y-3"
        >
          <div className="text-xs font-semibold text-zinc-200">
            Catat Temuan Manual &amp; Tentukan Kriterianya
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              required
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Judul temuan (misal: Daftar Peserta Wisuda PDF)"
              className="rounded-md border border-white/10 bg-[#0E1017] px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="URL situs / file (opsional)"
              className="rounded-md border border-white/10 bg-[#0E1017] px-3 py-2 font-mono text-xs text-white placeholder:font-sans placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={manualSeverity}
              onChange={(e) => setManualSeverity(e.target.value as NameFindingSeverity)}
              aria-label="Kriteria risiko temuan"
              className="rounded-md border border-white/10 bg-[#0E1017] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="bahaya">Berbahaya — Ada NIK/NIM/HP/Dokumen sensitif</option>
              <option value="waspada">Perlu Dicek — Direktori terbuka / daftar acara</option>
              <option value="aman">Aman — Profil profesional / berita wajar</option>
            </select>
            <input
              type="text"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              placeholder="Alasan / data yang terlihat (opsional)"
              className="rounded-md border border-white/10 bg-[#0E1017] px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 cursor-pointer"
            >
              Tambahkan
            </button>
          </div>
        </form>
      )}

      {isSearching && (
        <div className="space-y-2 rounded-lg border border-white/10 bg-[#07080C] p-4" aria-busy="true">
          <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
          <div className="h-14 w-full animate-pulse rounded bg-white/5" />
        </div>
      )}

      {searchError && !isSearching && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <span>{searchError}</span>
        </div>
      )}

      {!isSearching && !hasSearched && findings.length === 0 && queries.length === 0 && !searchError && (
        <div className="rounded-lg border border-dashed border-white/10 bg-[#07080C] px-4 py-6 text-center text-xs text-zinc-400">
          Masukkan nama untuk memeriksa indeks publik gratis secara otomatis dan membuat kueri Google
          Dork manual.
        </div>
      )}

      {!isSearching && hasSearched && findings.length === 0 && !searchError && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>
            {searchSummary ||
              'Tidak ada catatan pada indeks GitHub, OpenAlex, atau Wikipedia. Periksa dokumen PDF/direktori via tombol Google di bawah.'}
          </span>
        </div>
      )}

      {!isSearching && findings.length > 0 && (
        <div className="space-y-4">
          {searchSummary && (
            <p className="text-xs leading-relaxed text-zinc-300">{searchSummary}</p>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-[#07080C] px-4 py-3">
              <div className="text-xs text-zinc-400">Berbahaya</div>
              <div className="mt-1 font-mono text-xl font-semibold text-red-400 tabular-nums">
                {countBahaya}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#07080C] px-4 py-3">
              <div className="text-xs text-zinc-400">Perlu Dicek</div>
              <div className="mt-1 font-mono text-xl font-semibold text-amber-400 tabular-nums">
                {countWaspada}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#07080C] px-4 py-3">
              <div className="text-xs text-zinc-400">Aman</div>
              <div className="mt-1 font-mono text-xl font-semibold text-emerald-400 tabular-nums">
                {countAman}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#07080C] p-1">
              {(
                [
                  { id: 'all', label: `Semua (${findings.length})` },
                  { id: 'bahaya', label: `Berbahaya (${countBahaya})` },
                  { id: 'waspada', label: `Perlu Dicek (${countWaspada})` },
                  { id: 'aman', label: `Aman (${countAman})` },
                ] as Array<{ id: FilterSeverity; label: string }>
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    filter === tab.id
                      ? 'bg-white text-zinc-950'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="font-mono text-xs text-zinc-400 tabular-nums">
              {findings.filter((f) => f.confirmed).length} dipilih
            </span>
          </div>

          <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-[#07080C]">
            {filteredFindings.length === 0 ? (
              <div className="px-4 py-5 text-center text-xs text-zinc-500">
                Tidak ada temuan pada kriteria ini.
              </div>
            ) : (
              filteredFindings.map((item) => {
                const style = getSeverityStyle(item.severity);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-start sm:justify-between"
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.confirmed}
                        onChange={() => onToggleFindingConfirm(item.id)}
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-sm font-semibold text-white">{item.title}</span>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${style.textClass}`}
                          >
                            <style.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{style.label}</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-400">
                          <span className="font-mono text-zinc-300">{item.domain}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.category}</span>
                          {item.exposedElements.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-zinc-300">
                                {item.exposedElements.join(', ')}
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-xs leading-relaxed text-zinc-400">{item.reason}</p>
                      </div>
                    </label>

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 self-start rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 whitespace-nowrap shrink-0"
                      >
                        <span>Buka Sumber</span>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Kueri Google Dork Manual (Selalu Tersedia Tanpa Kuota API) */}
      {queries.length > 0 && (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span>Audit Manual Google Dork (Tanpa Kuota API)</span>
            <span className="font-mono text-white tabular-nums">
              {queries.filter((q) => q.confirmed).length}/{queries.length} ditemukan
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {queries.map((item) => {
              const isHighRisk = item.id === 'name-docs' || item.id === 'name-sensitive';
              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-lg border p-4 transition-colors ${
                    item.confirmed
                      ? 'border-blue-500/60 bg-blue-500/10'
                      : 'border-white/10 bg-[#07080C]'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-400">{item.category}</span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          isHighRisk ? 'text-red-400' : 'text-amber-400'
                        }`}
                      >
                        {isHighRisk ? (
                          <>
                            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Potensi Berbahaya</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Perlu Dicek</span>
                          </>
                        )}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>

                    <div className="rounded-md border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-zinc-300 break-all">
                      {item.query}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={item.googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 whitespace-nowrap"
                      >
                        <span>Buka Google</span>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.query)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/10 whitespace-nowrap cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.confirmed}
                        onChange={() => onToggleQueryConfirm(item.id)}
                        className="h-4 w-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500"
                      />
                      <span>Muncul di hasil pencarian (atau biarkan kosong jika aman)</span>
                    </label>

                    {item.confirmed && (
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => onQueryNoteChange(item.id, e.target.value)}
                        placeholder="URL / nama situs (opsional)"
                        className="w-full rounded-md border border-white/10 bg-[#0E1017] px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
