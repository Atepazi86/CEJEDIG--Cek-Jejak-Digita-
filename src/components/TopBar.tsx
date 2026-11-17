import React from 'react';

interface TopBarProps {
  onRunAnalysis: () => void;
  hasAnyInput: boolean;
  isAnalyzing: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onRunAnalysis,
  hasAnyInput,
  isAnalyzing,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050608]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          JejakGuard AI
        </a>

        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400"
        >
          <a
            href="#audit-mandiri"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Audit
          </a>
          <a
            href="#analisis-ai"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Analisis AI
          </a>
          <a
            href="#toolkit-privasi"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Toolkit
          </a>
          <a
            href="#panduan-etis"
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Privasi
          </a>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isAnalyzing
              ? 'Menganalisis...'
              : hasAnyInput
                ? 'Analisis AI'
                : 'Mulai Audit'}
          </button>
        </div>
      </div>
    </header>
  );
};
