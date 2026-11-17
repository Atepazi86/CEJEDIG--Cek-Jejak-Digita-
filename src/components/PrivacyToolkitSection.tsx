import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Download, FileText, Mail, RotateCcw } from 'lucide-react';
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
  const [exposedData, setExposedData] = useState('Nomor HP / WhatsApp');
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [customResult, setCustomResult] = useState<CustomTakedownResult | null>(null);
  const [copiedLetter, setCopiedLetter] = useState(false);

  const completedCount = checklist.filter((item) => item.completed).length;
  const progressRatio = checklist.length > 0 ? completedCount / checklist.length : 0;

  const activeDraft =
    selectedDraftIndex !== null && aiDrafts[selectedDraftIndex]
      ? {
          subject: aiDrafts[selectedDraftIndex].subject,
          recipientSuggestion: aiDrafts[selectedDraftIndex].recipientType,
          legalBasis: aiDrafts[selectedDraftIndex].legalBasis,
          letterBody: aiDrafts[selectedDraftIndex].body,
        }
      : customResult;

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
          exposedDataTypes: [exposedData],
          language,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Gagal membuat surat.');
      }

      setCustomResult(data as CustomTakedownResult);
      onSelectAiDraft(-1);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Gagal membuat surat.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLetter = async () => {
    if (!activeDraft) return;
    try {
      await navigator.clipboard.writeText(`Subjek: ${activeDraft.subject}\n\n${activeDraft.letterBody}`);
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 1600);
    } catch {
      // Clipboard ignored
    }
  };

  const handleDownloadTxt = () => {
    if (!activeDraft) return;
    const content = `Subjek: ${activeDraft.subject}\n\n${activeDraft.letterBody}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'surat-takedown.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Surat Takedown */}
      <div className="rounded-xl border border-white/10 bg-[#0B0D13]/80 backdrop-blur-md p-6 lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">
            Surat <span className="text-sky-300">Penghapusan Data</span>
          </h3>
          <div className="flex rounded-md border border-white/10 bg-[#07080C] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLanguage('id')}
              className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                language === 'id' ? 'bg-sky-500 text-white font-semibold' : 'text-zinc-400'
              }`}
            >
              UU PDP
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                language === 'en' ? 'bg-sky-500 text-white font-semibold' : 'text-zinc-400'
              }`}
            >
              GDPR
            </button>
          </div>
        </div>

        {aiDrafts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {aiDrafts.map((draft, idx) => (
              <button
                key={draft.id}
                type="button"
                onClick={() => onSelectAiDraft(idx)}
                className={`rounded-md border px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                  selectedDraftIndex === idx
                    ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                    : 'border-white/10 bg-[#07080C] text-zinc-300 hover:text-white'
                }`}
              >
                {draft.title}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleGenerateCustomDraft} className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <input
              type="text"
              value={targetSite}
              onChange={(e) => setTargetSite(e.target.value)}
              placeholder="Nama situs / instansi"
              className="rounded-lg border border-white/10 bg-[#07080C]/80 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-sky-400 focus:outline-none"
            />
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="URL halaman / PDF"
              className="rounded-lg border border-white/10 bg-[#07080C]/80 px-3 py-2 font-mono text-xs text-white placeholder:font-sans placeholder:text-zinc-500 focus:border-sky-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <select
              value={exposedData}
              onChange={(e) => setExposedData(e.target.value)}
              aria-label="Jenis data"
              className="flex-1 rounded-lg border border-white/10 bg-[#07080C]/80 px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
            >
              <option value="Nomor HP / WhatsApp">Nomor HP / WhatsApp</option>
              <option value="Email Pribadi">Email Pribadi</option>
              <option value="Dokumen PDF / Nama & NIM">Dokumen PDF / Nama &amp; NIM</option>
              <option value="Alamat / Identitas KTP">Alamat / Identitas KTP</option>
            </select>

            <button
              type="submit"
              disabled={isGenerating || (!targetSite.trim() && !targetUrl.trim())}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-all duration-150 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isGenerating ? 'Menyusun...' : 'Buat Surat'}</span>
            </button>
          </div>
        </form>

        {genError && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
            {genError}
          </div>
        )}

        {activeDraft && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2.5 border-t border-white/10 pt-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-sky-300/90">
                {activeDraft.recipientSuggestion}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLetter}
                  className="inline-flex items-center gap-1 rounded border border-white/10 px-2.5 py-1 text-xs text-zinc-200 hover:bg-white/10 cursor-pointer"
                >
                  {copiedLetter ? (
                    <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3 w-3" aria-hidden="true" />
                  )}
                  <span>{copiedLetter ? 'Tersalin' : 'Salin'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center gap-1 rounded border border-white/10 px-2.5 py-1 text-xs text-zinc-200 hover:bg-white/10 cursor-pointer"
                >
                  <Download className="h-3 w-3" aria-hidden="true" />
                  <span>.txt</span>
                </button>
                <a
                  href={`mailto:?subject=${encodeURIComponent(activeDraft.subject)}&body=${encodeURIComponent(activeDraft.letterBody)}`}
                  className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-semibold text-zinc-950 hover:bg-sky-200"
                >
                  <Mail className="h-3 w-3" aria-hidden="true" />
                  <span>Kirim</span>
                </a>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#07080C] p-4 space-y-2">
              <div className="text-xs font-semibold text-sky-200">{activeDraft.subject}</div>
              <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-300">
                {activeDraft.letterBody}
              </pre>
            </div>
          </motion.div>
        )}
      </div>

      {/* Checklist */}
      <div className="rounded-xl border border-white/10 bg-[#0B0D13]/80 backdrop-blur-md p-6 lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">
              Checklist <span className="text-emerald-400">Keamanan</span>
            </h3>
            <div className="mt-0.5 font-mono text-xs text-emerald-300 tabular-nums">
              {completedCount}/{checklist.length} selesai
            </div>
          </div>
          <button
            type="button"
            onClick={onResetChecklist}
            className="text-zinc-400 hover:text-white cursor-pointer"
            aria-label="Reset checklist"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            animate={{ scaleX: progressRatio }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'left' }}
            className="h-full w-full bg-gradient-to-r from-emerald-400 to-teal-400"
          />
        </div>

        <div className="divide-y divide-white/10">
          {checklist.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 py-3 first:pt-1 last:pb-0 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={Boolean(item.completed)}
                onChange={() => onToggleChecklistItem(item.id)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-emerald-400"
              />
              <div className="space-y-0.5">
                <div
                  className={`text-xs font-medium transition-colors ${
                    item.completed ? 'text-zinc-500 line-through' : 'text-zinc-100'
                  }`}
                >
                  {item.task}
                </div>
                <div className="text-[11px] text-teal-300/75">{item.targetService}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
