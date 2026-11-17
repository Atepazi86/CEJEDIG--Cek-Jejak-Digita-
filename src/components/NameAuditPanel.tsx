import React, { useState } from 'react';
import { motion } from 'motion/react';
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
}

type FilterSeverity = 'all' | NameFindingSeverity;

function getSeverityMeta(severity: NameFindingSeverity) {
  if (severity === 'bahaya') {
    return { label: 'Bahaya', textClass: 'text-rose-400', Icon: ShieldAlert };
  }
  if (severity === 'waspada') {
    return { label: 'Perlu Dicek', textClass: 'text-amber-400', Icon: AlertTriangle };
  }
  return { label: 'Aman', textClass: 'text-emerald-400', Icon: ShieldCheck };
}

export const NameAuditPanel: React.FC<NameAuditPanelProps> = ({
  fullName,
  affiliation,
  onFullNameChange,
  onAffiliationChange,
  isSearching,
  hasSearched,
  searchError,
  findings,
  queries,
  onAutoSearch,
  onToggleFindingConfirm,
  onAddManualFinding,
  onToggleQueryConfirm,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterSeverity>('all');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualSeverity, setManualSeverity] = useState<NameFindingSeverity>('bahaya');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setFilter('all');
    onAutoSearch();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    onAddManualFinding(manualTitle.trim(), manualUrl.trim(), manualSeverity, '');
    setManualTitle('');
    setManualUrl('');
    setShowManualForm(false);
  };

  const handleCopy = async (id: string, query: string) => {
    try {
      await navigator.clipboard.writeText(query);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1600);
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
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="grid gap-2.5 sm:grid-cols-12">
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
            placeholder="Nama lengkap"
            className="w-full rounded-lg border border-white/10 bg-[#07080C]/80 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-violet-400 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-4">
          <label htmlFor="audit-affiliation-input" className="sr-only">
            Kota atau Kampus
          </label>
          <input
            id="audit-affiliation-input"
            type="text"
            value={affiliation}
            onChange={(e) => onAffiliationChange(e.target.value)}
            placeholder="Kota / kampus (opsional)"
            className="w-full rounded-lg border border-white/10 bg-[#07080C]/80 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-violet-400 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={isSearching || !fullName.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:from-violet-400 hover:to-indigo-400 hover:-translate-y-0.5 disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <FileSearch className="h-4 w-4" aria-hidden="true" />
            <span>{isSearching ? 'Mencari...' : 'Cari'}</span>
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="text-violet-300/80">Indeks Publik Gratis + Google Dork</span>
        <button
          type="button"
          onClick={() => setShowManualForm((prev) => !prev)}
          className="inline-flex items-center gap-1 text-violet-300 hover:text-violet-200 transition-colors cursor-pointer"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          <span>Tambah Temuan</span>
        </button>
      </div>

      {showManualForm && (
        <motion.form
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          onSubmit={handleManualSubmit}
          className="grid gap-2.5 rounded-lg border border-white/10 bg-[#07080C]/90 p-3.5 sm:grid-cols-4"
        >
          <input
            type="text"
            required
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="Judul temuan"
            className="rounded-md border border-white/10 bg-[#0E1017] px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-violet-400 focus:outline-none"
          />
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="URL (opsional)"
            className="rounded-md border border-white/10 bg-[#0E1017] px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-violet-400 focus:outline-none"
          />
          <select
            value={manualSeverity}
            onChange={(e) => setManualSeverity(e.target.value as NameFindingSeverity)}
            aria-label="Kriteria risiko"
            className="rounded-md border border-white/10 bg-[#0E1017] px-3 py-1.5 text-xs text-white focus:border-violet-400 focus:outline-none"
          >
            <option value="bahaya">Bahaya</option>
            <option value="waspada">Perlu Dicek</option>
            <option value="aman">Aman</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-400 cursor-pointer"
          >
            Simpan
          </button>
        </motion.form>
      )}

      {isSearching && (
        <div className="space-y-2" aria-busy="true">
          <div className="h-11 w-full animate-pulse rounded-lg bg-violet-500/10" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-indigo-500/10" />
        </div>
      )}

      {searchError && !isSearching && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200"
        >
          {searchError}
        </motion.div>
      )}

      {!isSearching && hasSearched && findings.length === 0 && !searchError && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200"
        >
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>Bersih di indeks publik gratis. Cek dokumen PDF via Google di bawah.</span>
        </motion.div>
      )}

      {!isSearching && findings.length > 0 && (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#07080C]/80 p-1">
            {(
              [
                { id: 'all', label: `Semua (${findings.length})` },
                { id: 'bahaya', label: `Bahaya (${countBahaya})` },
                { id: 'waspada', label: `Dicek (${countWaspada})` },
                { id: 'aman', label: `Aman (${countAman})` },
              ] as Array<{ id: FilterSeverity; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  filter === tab.id ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-[#07080C]/85">
            {filteredFindings.map((item, idx) => {
              const meta = getSeverityMeta(item.severity);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.25) }}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                >
                  <label className="flex items-center gap-3 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.confirmed}
                      onChange={() => onToggleFindingConfirm(item.id)}
                      className="h-4 w-4 shrink-0 rounded border-white/20 bg-transparent text-violet-400"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-violet-200">{item.title}</div>
                      <div className="truncate text-xs text-zinc-400">
                        <span className="text-sky-300/90">{item.domain}</span> · {item.category}
                      </div>
                    </div>
                  </label>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${meta.textClass}`}>
                      <meta.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{meta.label}</span>
                    </span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-200 hover:bg-white/10"
                      >
                        Buka
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {queries.length > 0 && (
        <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-[#07080C]/85">
          {queries.map((item, idx) => {
            const isHighRisk = item.id === 'name-docs' || item.id === 'name-sensitive';
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.2) }}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.confirmed}
                    onChange={() => onToggleQueryConfirm(item.id)}
                    className="h-4 w-4 shrink-0 rounded border-white/20 bg-transparent text-violet-400"
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{item.category}</div>
                    <div className={`text-xs ${isHighRisk ? 'text-rose-400' : 'text-amber-300'}`}>
                      {isHighRisk ? 'Kriteria Bahaya jika muncul' : 'Perlu Dicek'}
                    </div>
                  </div>
                </label>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.googleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-sky-200"
                  >
                    <span>Google</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.query)}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/10 cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
