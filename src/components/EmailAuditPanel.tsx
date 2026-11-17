import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
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
  onCheckEmail,
  onToggleBreachConfirm,
  onAddManualBreach,
}) => {
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

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor="audit-email-input" className="sr-only">
          Alamat Email
        </label>
        <input
          id="audit-email-input"
          type="email"
          required
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="nama@gmail.com"
          className="flex-1 rounded-lg border border-white/10 bg-[#07080C]/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-sky-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:from-sky-400 hover:to-blue-500 hover:-translate-y-0.5 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>{isLoading ? 'Memindai...' : 'Pindai'}</span>
        </button>
      </form>

      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="text-sky-300/80">XposedOrNot · Privasi Terjaga</span>
        <div className="flex items-center gap-4">
          <a
            href={`https://haveibeenpwned.com/${email.trim() ? `?account=${encodeURIComponent(email.trim())}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200 transition-colors"
          >
            <span>Cek HIBP</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => setShowManualForm((prev) => !prev)}
            className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            <span>Tambah Manual</span>
          </button>
        </div>
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
            value={manualService}
            onChange={(e) => setManualService(e.target.value)}
            placeholder="Layanan"
            className="rounded-md border border-white/10 bg-[#0E1017] px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-sky-400 focus:outline-none"
          />
          <input
            type="text"
            value={manualYear}
            onChange={(e) => setManualYear(e.target.value)}
            placeholder="Tahun"
            className="rounded-md border border-white/10 bg-[#0E1017] px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-sky-400 focus:outline-none"
          />
          <input
            type="text"
            value={manualDataTypes}
            onChange={(e) => setManualDataTypes(e.target.value)}
            placeholder="Data (Email, Sandi)"
            className="rounded-md border border-white/10 bg-[#0E1017] px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-sky-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-400 cursor-pointer"
          >
            Simpan
          </button>
        </motion.form>
      )}

      {isLoading && (
        <div className="space-y-2 pt-2" aria-busy="true">
          <div className="h-11 w-full animate-pulse rounded-lg bg-sky-500/10" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-indigo-500/10" />
        </div>
      )}

      {error && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <a
            href="https://haveibeenpwned.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-300 underline whitespace-nowrap"
          >
            Buka HIBP
          </a>
        </motion.div>
      )}

      {!isLoading && hasChecked && breaches.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200"
        >
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>Aman — Tidak ada kebocoran tercatat untuk email ini.</span>
        </motion.div>
      )}

      {!isLoading && breaches.length > 0 && (
        <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-[#07080C]/85">
          {breaches.map((item, idx) => {
            const isHighPwdRisk =
              item.passwordRisk.toLowerCase().includes('high') ||
              item.passwordRisk.toLowerCase().includes('plaintext') ||
              item.exposedData.some((d) => d.toLowerCase().includes('password'));

            return (
              <motion.label
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.25) }}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={item.confirmed}
                    onChange={() => onToggleBreachConfirm(item.id)}
                    className="h-4 w-4 shrink-0 rounded border-white/20 bg-transparent text-sky-400"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-sky-200">{item.breach}</div>
                    <div className="truncate text-xs text-zinc-400">
                      <span className="font-mono text-indigo-300 tabular-nums">{item.year}</span>
                      {' · '}
                      {item.exposedData.length > 0 ? item.exposedData.join(', ') : 'Email'}
                    </div>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0 ${
                    isHighPwdRisk ? 'text-rose-400' : 'text-amber-400'
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isHighPwdRisk ? 'Bahaya' : 'Waspada'}</span>
                </span>
              </motion.label>
            );
          })}
        </div>
      )}
    </div>
  );
};
