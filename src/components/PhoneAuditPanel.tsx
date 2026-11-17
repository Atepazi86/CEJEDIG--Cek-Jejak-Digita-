import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, ExternalLink, PhoneCall } from 'lucide-react';
import type { CarrierAnalysis, OsintQueryItem } from '../types/audit';

interface PhoneAuditPanelProps {
  phoneInput: string;
  onPhoneInputChange: (value: string) => void;
  carrierAnalysis: CarrierAnalysis | null;
  queries: OsintQueryItem[];
  onAnalyzePhone: () => void;
  onToggleConfirm: (id: string) => void;
}

export const PhoneAuditPanel: React.FC<PhoneAuditPanelProps> = ({
  phoneInput,
  onPhoneInputChange,
  carrierAnalysis,
  queries,
  onAnalyzePhone,
  onToggleConfirm,
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
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1600);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor="audit-phone-input" className="sr-only">
          Nomor HP atau WhatsApp
        </label>
        <input
          id="audit-phone-input"
          type="tel"
          required
          value={phoneInput}
          onChange={(e) => onPhoneInputChange(e.target.value)}
          placeholder="081234567890"
          className="flex-1 rounded-lg border border-white/10 bg-[#07080C]/80 px-4 py-2.5 font-mono text-sm text-white placeholder:font-sans placeholder:text-zinc-500 transition-colors focus:border-emerald-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!phoneInput.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:from-emerald-400 hover:to-teal-400 hover:-translate-y-0.5 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <PhoneCall className="h-4 w-4" aria-hidden="true" />
          <span>Cek</span>
        </button>
      </form>

      {carrierAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3 text-xs">
            <span className="font-semibold text-emerald-300">{carrierAnalysis.carrier}</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span className="font-mono text-sky-300 tabular-nums">{carrierAnalysis.normalizedIntl}</span>
            <span className="text-zinc-600" aria-hidden="true">·</span>
            <span className="font-mono text-zinc-300 tabular-nums">{carrierAnalysis.whatsappFormat}</span>
          </div>

          <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-[#07080C]/85">
            {queries.map((item, idx) => (
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
                    onChange={() => onToggleConfirm(item.id)}
                    className="h-4 w-4 shrink-0 rounded border-white/20 bg-transparent text-emerald-400"
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{item.category}</div>
                    <div className="text-xs text-teal-300/80">Centang jika nomor muncul di Google</div>
                  </div>
                </label>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.googleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-emerald-200"
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
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
