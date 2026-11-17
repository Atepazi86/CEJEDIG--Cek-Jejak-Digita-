import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { BreachIncident } from '../types/audit';

interface EmailAuditPanelProps {
  email: string;
  onEmailChange: (value: string) => void;
  breaches: BreachIncident[];
  hasChecked: boolean;
  isLoading: boolean;
  error: string | null;
  sourceLabel: string | null;
  onCheckEmail: (emailToCheck: string) => void;
  onToggleBreachConfirm: (id: string) => void;
  onAddManualBreach: (serviceName: string, year: string, dataTypes: string) => void;
}

export const EmailAuditPanel: React.FC<EmailAuditPanelProps> = ({
  email,
  onEmailChange,
  breaches,
  hasChecked,
  isLoading,
  error,
  sourceLabel,
  onCheckEmail,
  onToggleBreachConfirm,
  onAddManualBreach,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualService, setManualService] = useState('');
  const [manualYear, setManualYear] = useState('');
  const [manualDataTypes, setManualDataTypes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onCheckEmail(email.trim());
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualService.trim()) return;
    onAddManualBreach(
      manualService.trim(),
      manualYear.trim() || '-',
      manualDataTypes.trim() || 'Email, Kata Sandi'
    );
    setManualService('');
    setManualYear('');
    setManualDataTypes('');
    setShowManualForm(false);
  };

  const confirmedCount = breaches.filter((b) => b.confirmed).length;
  const passwordExposedCount = breaches.filter((b) =>
    b.exposedData.some((d) => d.toLowerCase().includes('password'))
  ).length;
  const latestYear = breaches
    .map((b) => Number(b.year))
    .filter((n) => !Number.isNaN(n) && n > 1990)
    .sort((a, b) => b - a)[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Cek Kebocoran Email</h3>
          <p className="text-xs text-zinc-400">
            Pengecekan langsung via API publik XposedOrNot tanpa menyimpan alamat email.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <a
            href={`https://haveibeenpwned.com/${email.trim() ? `?account=${encodeURIComponent(email.trim())}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
          >
            <span>Cek HIBP</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => setShowManualForm((prev) => !prev)}
            className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Catat Manual</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="audit-email-input" className="sr-only">
          Alamat Email
        </label>
        <input
          id="audit-email-input"
          type="email"
          required
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="nama.anda@gmail.com"
          className="flex-1 rounded-lg border border-white/10 bg-[#07080C] px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>{isLoading ? 'Memindai...' : 'Pindai Email'}</span>
        </button>
      </form>

      {showManualForm && (
        <form
          onSubmit={handleManualSubmit}
          className="rounded-lg border border-white/10 bg-[#07080C] p-4 space-y-3"
        >
          <div className="text-xs font-semibold text-zinc-200">Tambah Catatan Kebocoran Manual</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              required
              value={manualService}
              onChange={(e) => setManualService(e.target.value)}
              placeholder="Layanan (misal: Tokopedia)"
              className="rounded-md border border-white/10 bg-[#0E1017] px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={manualYear}
              onChange={(e) => setManualYear(e.target.value)}
              placeholder="Tahun (misal: 2020)"
              className="rounded-md border border-white/10 bg-[#0E1017] px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={manualDataTypes}
              onChange={(e) => setManualDataTypes(e.target.value)}
              placeholder="Data (Email, Password, No HP)"
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

      {isLoading && (
        <div className="space-y-2 rounded-lg border border-white/10 bg-[#07080C] p-4" aria-busy="true">
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-11 w-full animate-pulse rounded bg-white/5" />
          <div className="h-11 w-full animate-pulse rounded bg-white/5" />
        </div>
      )}

      {error && !isLoading && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
            <div className="space-y-2">
              <div className="font-semibold text-amber-100">{error}</div>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="https://haveibeenpwned.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 underline"
                >
                  <span>Have I Been Pwned</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => setShowManualForm(true)}
                  className="text-white underline cursor-pointer"
                >
                  Catat manual
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !hasChecked && breaches.length === 0 && !error && (
        <div className="rounded-lg border border-dashed border-white/10 bg-[#07080C] px-4 py-6 text-center text-xs text-zinc-400">
          Masukkan email utama Anda untuk mendeteksi layanan yang pernah mengalami kebocoran.
        </div>
      )}

      {!isLoading && hasChecked && breaches.length === 0 && !error && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>
            Bersih — Tidak ditemukan kebocoran terindeks di {sourceLabel || 'XposedOrNot'}.
          </span>
        </div>
      )}

      {!isLoading && breaches.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-[#07080C] px-4 py-3">
              <div className="text-xs text-zinc-400">Insiden</div>
              <div className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">
                {breaches.length}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#07080C] px-4 py-3">
              <div className="text-xs text-zinc-400">Eksposur Sandi</div>
              <div className="mt-1 font-mono text-xl font-semibold text-red-400 tabular-nums">
                {passwordExposedCount}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#07080C] px-4 py-3">
              <div className="text-xs text-zinc-400">Terbaru</div>
              <div className="mt-1 font-mono text-xl font-semibold text-white tabular-nums">
                {latestYear || '-'}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#07080C]">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2.5 text-xs text-zinc-400">
              <span>Riwayat Insiden ({sourceLabel || 'Audit'})</span>
              <span className="font-mono tabular-nums">
                {confirmedCount}/{breaches.length} dipilih
              </span>
            </div>

            <div className="divide-y divide-white/10">
              {breaches.map((item) => {
                const isExpanded = expandedId === item.id;
                const riskLower = item.passwordRisk.toLowerCase();
                const isHighPwdRisk =
                  riskLower.includes('plaintext') ||
                  riskLower.includes('easytocrack') ||
                  riskLower.includes('high') ||
                  item.exposedData.some((d) => d.toLowerCase().includes('password'));

                return (
                  <div key={item.id} className="px-4 py-3 transition-colors hover:bg-white/[0.02]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.confirmed}
                          onChange={() => onToggleBreachConfirm(item.id)}
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="text-sm font-semibold text-white">{item.breach}</span>
                            {isHighPwdRisk ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
                                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Sandi Berisiko</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Metadata</span>
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-400">
                            <span className="font-mono tabular-nums text-zinc-300">{item.year}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.domain !== '-' ? item.domain : item.industry}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-zinc-300">
                              {item.exposedData.length > 0
                                ? item.exposedData.join(', ')
                                : 'Email'}
                            </span>
                          </div>
                        </div>
                      </label>

                      {item.details && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="inline-flex items-center gap-1 self-start text-xs text-zinc-400 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Tutup' : 'Detail'}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </button>
                      )}
                    </div>

                    {isExpanded && item.details && (
                      <div className="mt-2.5 ml-7 border-t border-white/10 pt-2 text-xs leading-relaxed text-zinc-400">
                        {item.details}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
