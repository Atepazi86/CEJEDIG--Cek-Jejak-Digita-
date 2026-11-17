import React from 'react';
import { ExternalLink, Lock, Scale, Shield } from 'lucide-react';

export const EthicsAndPrivacySection: React.FC = () => {
  return (
    <section id="panduan-etis" className="scroll-mt-20">
      <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-6 space-y-5">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
            <div>
              <h3 className="text-xs font-semibold text-white">Zero-Storage</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Data diproses sementara di sesi aktif dan tidak disimpan di database.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
            <div>
              <h3 className="text-xs font-semibold text-white">OSINT Legal</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Hanya menggunakan API publik XposedOrNot &amp; pencarian indeks terbuka mandiri.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Scale className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
            <div>
              <h3 className="text-xs font-semibold text-white">UU PDP &amp; GDPR</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Surat takedown mengacu hak penghapusan data UU No. 27 Tahun 2022.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 border-t border-white/10 pt-4 text-xs">
          <span className="text-zinc-500">Kanal Resmi:</span>
          <a
            href="https://myactivity.google.com/results-about-you"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
          >
            <span>Google Results About You</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          <a
            href="https://myaccount.google.com/connections"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
          >
            <span>Akses Aplikasi Google</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          <a
            href="https://myaccount.google.com/security-checkup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
          >
            <span>Security Checkup</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          <a
            href="https://haveibeenpwned.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
          >
            <span>Have I Been Pwned</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};
