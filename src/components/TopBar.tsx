import React from 'react';
import { motion } from 'motion/react';

export type AppView = 'audit' | 'analysis' | 'toolkit';

interface TopBarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  hasAnalysis: boolean;
}

const NAV_ITEMS: Array<{ id: AppView; label: string }> = [
  { id: 'audit', label: 'Audit' },
  { id: 'analysis', label: 'Skor AI' },
  { id: 'toolkit', label: 'Toolkit' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onSelectView,
  onRunAnalysis,
  isAnalyzing,
  hasAnalysis,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050608]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={() => onSelectView('audit')}
          className="font-display text-base font-bold tracking-tight whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span className="text-white">Jejak</span>
          <span className="text-gradient-animated">Guard AI</span>
        </button>

        <nav
          aria-label="Navigasi utama"
          className="flex items-center gap-6 text-xs font-medium sm:text-sm"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`relative py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive ? 'text-sky-300' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="navActiveUnderline"
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-x-0 -bottom-[15px] h-[2px] bg-gradient-to-r from-sky-400 to-indigo-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-all duration-150 hover:from-sky-400 hover:to-indigo-400 hover:-translate-y-0.5 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isAnalyzing
              ? 'Menganalisis...'
              : hasAnalysis
                ? 'Perbarui Skor'
                : 'Analisis AI'}
          </button>
        </div>
      </div>
    </header>
  );
};
