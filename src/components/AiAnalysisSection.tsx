import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { ExposureAnalysisResult } from '../types/audit';

interface AiAnalysisSectionProps {
  confirmedBreachCount: number;
  confirmedNameCount: number;
  confirmedPhoneCount: number;
  emailChecked: boolean;
  additionalNotes: string;
  onAdditionalNotesChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  error: string | null;
  result: ExposureAnalysisResult | null;
  onLoadDraftToToolkit: (draftIndex: number) => void;
}

function getRiskVisuals(level: string) {
  switch (level) {
    case 'Kritis':
      return {
        textClass: 'text-red-400',
        barClass: 'bg-red-500',
        surfaceClass: 'border-red-500/30 bg-red-500/[0.06]',
        Icon: AlertOctagon,
      };
    case 'Tinggi':
      return {
        textClass: 'text-red-400',
        barClass: 'bg-red-500',
        surfaceClass: 'border-red-500/25 bg-red-500/[0.05]',
        Icon: ShieldAlert,
      };
    case 'Sedang':
      return {
        textClass: 'text-amber-400',
        barClass: 'bg-amber-500',
        surfaceClass: 'border-amber-500/25 bg-amber-500/[0.05]',
        Icon: AlertTriangle,
      };
    default:
      return {
        textClass: 'text-emerald-400',
        barClass: 'bg-emerald-500',
        surfaceClass: 'border-emerald-500/25 bg-emerald-500/[0.05]',
        Icon: ShieldCheck,
      };
  }
}

export const AiAnalysisSection: React.FC<AiAnalysisSectionProps> = ({
  confirmedBreachCount,
  confirmedNameCount,
  confirmedPhoneCount,
  emailChecked,
  additionalNotes,
  onAdditionalNotesChange,
  onAnalyze,
  isAnalyzing,
  error,
  result,
  onLoadDraftToToolkit,
}) => {
  const totalConfirmed = confirmedBreachCount + confirmedNameCount + confirmedPhoneCount;
  const canAnalyze = emailChecked || totalConfirmed > 0 || additionalNotes.trim().length > 0;
  const riskVisuals = result ? getRiskVisuals(result.riskLevel) : null;

  return (
    <section id="analisis-ai" className="scroll-mt-20 space-y-5">
      <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              Analisis Risiko AI
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Hitung skor kerentanan 0–100 dan dapatkan rencana pembersihan personal.
            </p>
          </div>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing || !canAnalyze}
            className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isAnalyzing ? 'Menganalisis...' : 'Analisis Risiko dengan AI'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
          <div>
            <div className="text-xs text-zinc-400">Email</div>
            <div className="mt-0.5 font-mono text-sm font-semibold text-white tabular-nums">
              {confirmedBreachCount} insiden
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Nama / Dokumen</div>
            <div className="mt-0.5 font-mono text-sm font-semibold text-white tabular-nums">
              {confirmedNameCount} temuan
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Nomor HP / WA</div>
            <div className="mt-0.5 font-mono text-sm font-semibold text-white tabular-nums">
              {confirmedPhoneCount} temuan
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="ai-additional-notes" className="sr-only">
            Catatan Tambahan
          </label>
          <input
            id="ai-additional-notes"
            type="text"
            value={additionalNotes}
            onChange={(e) => onAdditionalNotesChange(e.target.value)}
            placeholder="Catatan tambahan (opsional): misal nomor WA dipakai untuk e-banking..."
            className="w-full rounded-lg border border-white/10 bg-[#07080C] px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200"
        >
          <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {isAnalyzing && (
        <div className="space-y-4 rounded-xl border border-white/10 bg-[#0B0D13] p-6" aria-busy="true">
          <div className="h-5 w-44 animate-pulse rounded bg-white/10" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="h-24 animate-pulse rounded-lg bg-white/5" />
            <div className="h-24 animate-pulse rounded-lg bg-white/5 sm:col-span-2" />
          </div>
        </div>
      )}

      {!isAnalyzing && result && riskVisuals && (
        <div className="space-y-5">
          {/* Skor Eksposur Digital */}
          <div className={`rounded-xl border p-6 ${riskVisuals.surfaceClass}`}>
            <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-4">
                <div className="text-xs text-zinc-400">Skor Eksposur Digital</div>
                <div className="mt-1.5 flex items-baseline gap-2.5">
                  <span className="font-mono text-5xl font-bold tracking-tight text-white tabular-nums">
                    {result.exposureScore}
                  </span>
                  <span className="font-mono text-base text-zinc-500 tabular-nums">/ 100</span>
                </div>
                <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${riskVisuals.textClass}`}>
                  <riskVisuals.Icon className="h-4 w-4" aria-hidden="true" />
                  <span>Risiko {result.riskLevel}</span>
                </div>

                <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full transition-all duration-300 ${riskVisuals.barClass}`}
                    style={{ width: `${Math.min(100, Math.max(0, result.exposureScore))}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-white/10 pt-4 lg:col-span-8 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
                <p className="text-sm leading-relaxed text-zinc-200">{result.executiveSummary}</p>

                <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
                  <div>
                    <div className="text-xs text-zinc-400">Email</div>
                    <div className="mt-0.5 font-mono text-sm font-semibold text-white tabular-nums">
                      +{result.scoreBreakdown.emailImpact}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Publik</div>
                    <div className="mt-0.5 font-mono text-sm font-semibold text-white tabular-nums">
                      +{result.scoreBreakdown.publicIdentityImpact}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Nomor HP</div>
                    <div className="mt-0.5 font-mono text-sm font-semibold text-white tabular-nums">
                      +{result.scoreBreakdown.phoneExposureImpact}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-400">
                  {result.scoreBreakdown.correlationMultiplier}
                </p>
              </div>
            </div>
          </div>

          {/* Peta Risiko Peretasan */}
          <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-6">
            <h3 className="text-base font-semibold text-white">Peta Risiko Peretasan</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {result.riskScenarios.map((scenario, idx) => {
                const sevVisuals = getRiskVisuals(scenario.severity);
                return (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-lg border border-white/10 bg-[#07080C] p-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-zinc-400">{scenario.attackVector}</span>
                        <span className={`inline-flex items-center gap-1 font-semibold ${sevVisuals.textClass}`}>
                          <sevVisuals.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{scenario.severity}</span>
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">{scenario.title}</h4>
                      <p className="text-xs leading-relaxed text-zinc-400">
                        {scenario.explanation}
                      </p>
                    </div>

                    {scenario.combinedDataUsed.length > 0 && (
                      <div className="mt-3 border-t border-white/10 pt-2.5 text-[11px] text-zinc-400">
                        {scenario.combinedDataUsed.join(' · ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rencana Aksi Pembersihan */}
          <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold text-white">Rencana Aksi Pembersihan</h3>
              {result.takedownDrafts.length > 0 && (
                <button
                  type="button"
                  onClick={() => onLoadDraftToToolkit(0)}
                  className="inline-flex items-center gap-1.5 self-start rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 whitespace-nowrap cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                  <span>Buka Draf Takedown</span>
                </button>
              )}
            </div>

            <div className="mt-4 divide-y divide-white/10">
              {result.priorityActions
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map((action, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="font-mono font-semibold text-blue-400 tabular-nums">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{action.category}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">{action.title}</h4>
                      <p className="max-w-3xl text-xs text-zinc-400">{action.description}</p>
                    </div>

                    {action.officialLinkUrl && (
                      <a
                        href={action.officialLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 self-start rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 whitespace-nowrap shrink-0"
                      >
                        <span>{action.officialLinkLabel || 'Buka'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
