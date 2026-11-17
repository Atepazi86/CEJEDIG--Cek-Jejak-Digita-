import React, { useState } from 'react';
import { Check, Copy, ExternalLink, PhoneCall } from 'lucide-react';
import type { CarrierAnalysis, OsintQueryItem } from '../types/audit';

interface PhoneAuditPanelProps {
  phoneInput: string;
  onPhoneInputChange: (value: string) => void;
  carrierAnalysis: CarrierAnalysis | null;
  queries: OsintQueryItem[];
  onAnalyzePhone: () => void;
  onToggleConfirm: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
}

export const PhoneAuditPanel: React.FC<PhoneAuditPanelProps> = ({
  phoneInput,
  onPhoneInputChange,
  carrierAnalysis,
  queries,
  onAnalyzePhone,
  onToggleConfirm,
  onNoteChange,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    onAnalyzePhone();
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

  const confirmedCount = queries.filter((q) => q.confirmed).length;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-white">Audit Nomor HP &amp; WhatsApp</h3>
        <p className="text-xs text-zinc-400">
          Deteksi operator lokal dan cek eksposur nomor di iklan baris, tautan wa.me, dan dokumen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="audit-phone-input" className="sr-only">
          Nomor Telepon atau WhatsApp
        </label>
        <input
          id="audit-phone-input"
          type="tel"
          required
          value={phoneInput}
          onChange={(e) => onPhoneInputChange(e.target.value)}
          placeholder="081234567890 atau +6281234567890"
          className="flex-1 rounded-lg border border-white/10 bg-[#07080C] px-4 py-2.5 font-mono text-sm text-white placeholder:font-sans placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!phoneInput.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <PhoneCall className="h-4 w-4" aria-hidden="true" />
          <span>Periksa Nomor</span>
        </button>
      </form>

      {!carrierAnalysis ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-[#07080C] px-4 py-6 text-center text-xs text-zinc-400">
          Masukkan nomor HP untuk mengenali operator dan membuat kueri pencarian variasi format.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-[#07080C] p-4 lg:grid-cols-4">
            <div>
              <div className="text-xs text-zinc-400">Operator</div>
              <div className="mt-0.5 text-xs font-semibold text-white">
                {carrierAnalysis.carrier}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Lokal</div>
              <div className="mt-0.5 font-mono text-xs text-zinc-200 tabular-nums">
                {carrierAnalysis.normalizedLocal}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Internasional</div>
              <div className="mt-0.5 font-mono text-xs text-zinc-200 tabular-nums">
                {carrierAnalysis.normalizedIntl}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">WhatsApp</div>
              <div className="mt-0.5 font-mono text-xs text-zinc-200 tabular-nums">
                {carrierAnalysis.whatsappFormat}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Semua format nomor digabungkan otomatis ke tiap pencarian.</span>
              <span className="font-mono text-white tabular-nums">
                {confirmedCount}/{queries.length} ditemukan
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {queries.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-lg border p-4 transition-colors ${
                    item.confirmed
                      ? 'border-blue-500/60 bg-blue-500/10'
                      : 'border-white/10 bg-[#07080C]'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div>
                      <div className="text-xs text-zinc-400">{item.category}</div>
                      <h4 className="mt-0.5 text-sm font-semibold text-white">{item.title}</h4>
                    </div>

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
                        onChange={() => onToggleConfirm(item.id)}
                        className="h-4 w-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500"
                      />
                      <span>Nomor muncul di hasil ini</span>
                    </label>

                    {item.confirmed && (
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => onNoteChange(item.id, e.target.value)}
                        placeholder="URL / nama situs (opsional)"
                        className="w-full rounded-md border border-white/10 bg-[#0E1017] px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
