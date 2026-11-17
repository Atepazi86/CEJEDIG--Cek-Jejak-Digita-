import React from 'react';
import { motion } from 'motion/react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { ExposureAnalysisResult } from '../types/audit';

interface AiAnalysisSectionProps {
  confirmedBreachCount: number;
  confirmedNameCount: number;
  confirmedPhoneCount: number;
  hasAnyChecked: boolean;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  error: string | null;
  result: ExposureAnalysisResult | null;
  onLoadDraftToToolkit: (draftIndex: number) => void;
  onGoToAudit: () => void;
}

function getRiskVisuals(level: string) {
  switch (level) {
    case 'Kritis':
    case 'Tinggi':
      return {
        textClass: 'text-rose-400',
        barClass: 'bg-gradient-to-r from-rose-500 to-red-500',
        surfaceClass: 'border-rose-500/25 bg-rose-500/[0.06]',
        Icon: level === 'Kritis' ? AlertOctagon : ShieldAlert,
      };
    case 'Sedang':
      return {
        textClass: 'text-amber-300',
        barClass: 'bg-gradient-to-r from-amber-400 to-orange-500',
        surfaceClass: 'border-amber-500/25 bg-amber-500/[0.06]',
        Icon: AlertTriangle,
      };
    default:
      return {
        textClass: 'text-emerald-400',
        barClass: 'bg-gradient-to-r from-emerald-400 to-teal-500',
        surfaceClass: 'border-emerald-500/25 bg-emerald-500/[0.06]',
        Icon: ShieldCheck,
      };
  }
}

export const AiAnalysisSection: React.FC<AiAnalysisSectionProps> = ({
  confirmedBreachCount,
  confirmedNameCount,
  confirmedPhoneCount,
  hasAnyChecked,
  onAnalyze,
  isAnalyzing,
  error,
  result,
  onLoadDraftToToolkit,
  onGoToAudit,
}) => {
  const riskVisuals = result ? getRiskVisuals(result.riskLevel) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#0B0D13]/80 backdrop-blur-md p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">
            Skor Eksposur <span className="text-gradient-animated">AI</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
            <span className="text-sky-300">Email: {confirmedBreachCount}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-violet-300">Nama: {confirmedNameCount}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-emerald-300">No. HP: {confirmedPhoneCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!hasAnyChecked && (
            <button
              type="button"
              onClick={onGoToAudit}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5 cursor-pointer"
            >
              Pilih Data Audit
            </button>
          )}
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing || !hasAnyChecked}
            className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-xs font-semibold text-white transition-all duration-150 hover:from-sky-400 hover:to-indigo-400 hover:-translate-y-0.5 disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            {isAnalyzing ? 'Menganalisis...' : 'Hitung Skor AI'}
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200"
        >
          <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
          <span>{error}</span>
        </motion.div>
      )}

      {isAnalyzing && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-[#0B0D13]/80 p-6" aria-busy="true">
          <div className="h-12 w-32 animate-pulse rounded bg-sky-500/15" />
          <div className="h-20 w-full animate-pulse rounded bg-indigo-500/10" />
        </div>
      )}

      {!isAnalyzing && !result && !error && (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#0B0D13]/60 px-6 py-10 text-center text-xs text-zinc-400">
          Jalankan audit <span className="text-sky-300">Email</span>,{' '}
          <span className="text-violet-300">Nama</span>, atau{' '}
          <span className="text-emerald-300">No. HP</span>, lalu tekan{' '}
          <strong className="text-white">Hitung Skor AI</strong>.
        </div>
      )}

      {!isAnalyzing && result && riskVisuals && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5"
        >
          <div className={`rounded-xl border backdrop-blur-md p-6 ${riskVisuals.surfaceClass}`}>
            <div className="grid gap-6 md:grid-cols-12 md:items-center">
              <div className="md:col-span-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-5xl font-bold text-white tabular-nums">
                    {result.exposureScore}
                  </span>
                  <span className="font-mono text-sm text-zinc-400">/ 100</span>
                </div>
                <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${riskVisuals.textClass}`}>
                  <riskVisuals.Icon className="h-4 w-4" aria-hidden="true" />
                  <span>Risiko {result.riskLevel}</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: Math.min(1, Math.max(0, result.exposureScore / 100)) }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: 'left' }}
                    className={`h-full w-full ${riskVisuals.barClass}`}
                  />
                </div>
              </div>

              <div className="space-y-3 md:col-span-8 md:border-l md:border-white/10 md:pl-6">
                <p className="text-sm leading-relaxed text-zinc-100">{result.executiveSummary}</p>
                <div className="flex flex-wrap gap-4 text-xs font-mono tabular-nums">
                  <span className="text-sky-300">Email +{result.scoreBreakdown.emailImpact}</span>
                  <span className="text-violet-300">
                    Publik +{result.scoreBreakdown.publicIdentityImpact}
                  </span>
                  <span className="text-emerald-300">
                    No. HP +{result.scoreBreakdown.phoneExposureImpact}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {result.riskScenarios.slice(0, 4).map((scenario, idx) => {
              const sev = getRiskVisuals(scenario.severity);
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: idx * 0.05 }}
                  className="rounded-xl border border-white/10 bg-[#0B0D13]/80 backdrop-blur-md p-5 space-y-2 transition-colors hover:border-white/20"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sky-300/90">{scenario.attackVector}</span>
                    <span className={`font-semibold ${sev.textClass}`}>{scenario.severity}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{scenario.title}</h3>
                  <p className="text-xs leading-relaxed text-zinc-400">{scenario.explanation}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0B0D13]/80 backdrop-blur-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Langkah Pembersihan</h3>
              {result.takedownDrafts.length > 0 && (
                <button
                  type="button"
                  onClick={() => onLoadDraftToToolkit(0)}
                  className="text-xs font-medium text-sky-400 hover:text-sky-300 cursor-pointer"
                >
                  Buka Surat Takedown →
                </button>
              )}
            </div>

            <div className="divide-y divide-white/10">
              {result.priorityActions
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map((action, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">
                        <span className="mr-2 font-mono text-xs text-sky-400 tabular-nums">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        {action.title}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-400">{action.description}</p>
                    </div>

                    {action.officialLinkUrl && (
                      <a
                        href={action.officialLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 self-start rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-sky-200 hover:bg-white/10 whitespace-nowrap shrink-0"
                      >
                        <span>{action.officialLinkLabel || 'Buka'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
