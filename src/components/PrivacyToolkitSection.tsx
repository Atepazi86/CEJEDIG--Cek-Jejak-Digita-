import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileText,
  Mail,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import type {
  CustomTakedownResult,
  DefenseChecklistItem,
  TakedownDraftTemplate,
} from '../types/audit';

interface PrivacyToolkitSectionProps {
  checklist: DefenseChecklistItem[];
  onToggleChecklistItem: (id: string) => void;
  onResetChecklist: () => void;
  aiDrafts: TakedownDraftTemplate[];
  selectedDraftIndex: number | null;
  onSelectAiDraft: (index: number) => void;
}

const DATA_TYPE_OPTIONS = [
  'Nomor HP / WhatsApp',
  'Email Pribadi',
  'Dokumen PDF / Nama',
  'Alamat Rumah',
  'Identitas KTP / NIM',
];

export const PrivacyToolkitSection: React.FC<PrivacyToolkitSectionProps> = ({
  checklist,
  onToggleChecklistItem,
  onResetChecklist,
  aiDrafts,
  selectedDraftIndex,
  onSelectAiDraft,
}) => {
  const [targetSite, setTargetSite] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [requesterAlias, setRequesterAlias] = useState('');
  const [contextDetails, setContextDetails] = useState('');
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([
    'Nomor HP / WhatsApp',
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [customResult, setCustomResult] = useState<CustomTakedownResult | null>(null);
  const [copiedLetter, setCopiedLetter] = useState(false);

  const completedCount = checklist.filter((item) => item.completed).length;

  const activeDraft =
    selectedDraftIndex !== null && aiDrafts[selectedDraftIndex]
      ? {
          subject: aiDrafts[selectedDraftIndex].subject,
          recipientSuggestion: aiDrafts[selectedDraftIndex].recipientType,
          legalBasis: aiDrafts[selectedDraftIndex].legalBasis,
          letterBody: aiDrafts[selectedDraftIndex].body,
          sendingTips: [
            'Lampirkan tangkapan layar atau URL persis halaman tempat data Anda muncul.',
          ],
        }
      : customResult;

  const toggleDataType = (label: string) => {
    setSelectedDataTypes((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const handleGenerateCustomDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSite.trim() && !targetUrl.trim()) return;

    setIsGenerating(true);
    setGenError(null);

    try {
      const response = await fetch('/api/generate-takedown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSite: targetSite.trim(),
          targetUrl: targetUrl.trim(),
          exposedDataTypes: selectedDataTypes,
          requesterAlias: requesterAlias.trim() || '[Nama Lengkap Anda]',
          contextDetails: contextDetails.trim(),
          language,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Gagal menyusun draf surat takedown.');
      }

      setCustomResult(data as CustomTakedownResult);
      onSelectAiDraft(-1);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyusun surat.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLetter = async () => {
    if (!activeDraft) return;
    const fullText = `Subjek: ${activeDraft.subject}\n\n${activeDraft.letterBody}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleDownloadTxt = () => {
    if (!activeDraft) return;
    const content = `Subjek: ${activeDraft.subject}\nTujuan: ${activeDraft.recipientSuggestion}\nDasar Hukum: ${activeDraft.legalBasis}\n\n${activeDraft.letterBody}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'permohonan-penghapusan-data.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="toolkit-privasi" className="scroll-mt-20 space-y-5">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-white">Toolkit Privasi</h2>
        <p className="mt-0.5 text-xs text-zinc-400">
          Buat surat penghapusan data (UU PDP / GDPR) dan amankan akun inti Anda.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Generator Surat Takedown */}
        <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-6 lg:col-span-7 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-white">Generator Surat Takedown</h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Draf email permohonan penghapusan data pribadi ke admin situs.
            </p>
          </div>

          {aiDrafts.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
              {aiDrafts.map((draft, idx) => (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() => onSelectAiDraft(idx)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedDraftIndex === idx
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-white/10 bg-[#07080C] text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {draft.title}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleGenerateCustomDraft} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="takedown-site" className="mb-1 block text-xs text-zinc-400">
                  Situs / Instansi
                </label>
                <input
                  id="takedown-site"
                  type="text"
                  value={targetSite}
                  onChange={(e) => setTargetSite(e.target.value)}
                  placeholder="Direktori Kampus / Portal Iklan"
                  className="w-full rounded-lg border border-white/10 bg-[#07080C] px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="takedown-url" className="mb-1 block text-xs text-zinc-400">
                  URL Halaman (Opsional)
                </label>
                <input
                  id="takedown-url"
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://contoh.ac.id/daftar.pdf"
                  className="w-full rounded-lg border border-white/10 bg-[#07080C] px-3 py-2 font-mono text-xs text-white placeholder:font-sans placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {DATA_TYPE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDataTypes.includes(option)}
                    onChange={() => toggleDataType(option)}
                    className="h-3.5 w-3.5 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={requesterAlias}
                onChange={(e) => setRequesterAlias(e.target.value)}
                placeholder="Nama / inisial pemohon (opsional)"
                aria-label="Nama pemohon"
                className="w-full rounded-lg border border-white/10 bg-[#07080C] px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />

              <div className="flex rounded-lg border border-white/10 bg-[#07080C] p-1">
                <button
                  type="button"
                  onClick={() => setLanguage('id')}
                  className={`flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    language === 'id' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ID (UU PDP)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    language === 'en' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  EN (GDPR)
                </button>
              </div>
            </div>

            <input
              type="text"
              value={contextDetails}
              onChange={(e) => setContextDetails(e.target.value)}
              placeholder="Konteks singkat (opsional)"
              aria-label="Konteks tambahan"
              className="w-full rounded-lg border border-white/10 bg-[#07080C] px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={isGenerating || (!targetSite.trim() && !targetUrl.trim())}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isGenerating ? 'Menyusun...' : 'Buat Surat Takedown'}</span>
            </button>
          </form>

          {genError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
              {genError}
            </div>
          )}

          {activeDraft && (
            <div className="space-y-3 border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                <span>
                  {activeDraft.recipientSuggestion} · {activeDraft.legalBasis}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLetter}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-white/10 cursor-pointer"
                  >
                    {copiedLetter ? (
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
                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-white/10 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>.txt</span>
                  </button>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(activeDraft.subject)}&body=${encodeURIComponent(activeDraft.letterBody)}`}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-200"
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Email</span>
                  </a>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#07080C] p-4 space-y-2">
                <div className="text-xs font-semibold text-white">
                  Subjek: {activeDraft.subject}
                </div>
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-300">
                  {activeDraft.letterBody}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Checklist Pertahanan Akun */}
        <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-6 lg:col-span-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Checklist Pertahanan</h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                Prioritas pengamanan akun Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={onResetChecklist}
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Progres</span>
              <span className="font-mono font-semibold text-white tabular-nums">
                {completedCount}/{checklist.length}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width:
                    checklist.length > 0
                      ? `${Math.round((completedCount / checklist.length) * 100)}%`
                      : '0%',
                }}
              />
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {checklist.map((item) => {
              const urgencyColor =
                item.urgency === 'Segera'
                  ? 'text-red-400'
                  : item.urgency === 'Tinggi'
                    ? 'text-amber-400'
                    : 'text-zinc-400';

              return (
                <label
                  key={item.id}
                  className="flex items-start gap-3 py-3 first:pt-1 last:pb-0 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(item.completed)}
                    onChange={() => onToggleChecklistItem(item.id)}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500"
                  />
                  <div className="space-y-1">
                    <div
                      className={`text-xs font-medium ${
                        item.completed ? 'text-zinc-500 line-through' : 'text-zinc-100'
                      }`}
                    >
                      {item.task}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                      <span className={`font-semibold ${urgencyColor}`}>{item.urgency}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.targetService}</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {completedCount === checklist.length && checklist.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <span>Semua checklist pertahanan selesai.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
