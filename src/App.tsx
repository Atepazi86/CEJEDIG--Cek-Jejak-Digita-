import React, { useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ArrowRight, Mail, Phone, RotateCcw, Shield, User } from 'lucide-react';
import { AmbientBackground } from './components/AmbientBackground';
import { TopBar, type AppView } from './components/TopBar';
import { EmailAuditPanel } from './components/EmailAuditPanel';
import { NameAuditPanel } from './components/NameAuditPanel';
import { PhoneAuditPanel } from './components/PhoneAuditPanel';
import { AiAnalysisSection } from './components/AiAnalysisSection';
import { PrivacyToolkitSection } from './components/PrivacyToolkitSection';
import type {
  BreachCheckResponse,
  BreachIncident,
  CarrierAnalysis,
  DefenseChecklistItem,
  ExposureAnalysisResult,
  NameFindingSeverity,
  NameSearchFinding,
  NameSearchResponse,
  OsintQueryItem,
} from './types/audit';
import {
  analyzeIndonesianPhone,
  buildNameOsintQueries,
  buildPhoneOsintQueries,
  maskEmailForAnalysis,
} from './utils/osint';

type AuditTab = 'email' | 'name' | 'phone';

const BASELINE_CHECKLIST: DefenseChecklistItem[] = [
  {
    id: 'base-passkey',
    task: 'Aktifkan Passkey / Authenticator di Email Utama',
    targetService: 'Akun Google / Email',
    urgency: 'Segera',
    howTo: 'Hindari OTP SMS.',
    completed: false,
  },
  {
    id: 'base-google-connections',
    task: 'Cabut Akses Aplikasi Pihak Ketiga Usang',
    targetService: 'myaccount.google.com/connections',
    urgency: 'Tinggi',
    howTo: 'Hapus izin login lama.',
    completed: false,
  },
  {
    id: 'base-whatsapp-2step',
    task: 'Aktifkan PIN 2-Langkah & Bisukan Penelepon Asing',
    targetService: 'WhatsApp',
    urgency: 'Tinggi',
    howTo: 'Pengaturan Akun & Privasi.',
    completed: false,
  },
  {
    id: 'base-results-about-you',
    task: 'Daftar Pemantauan Results About You',
    targetService: 'Google Search',
    urgency: 'Normal',
    howTo: 'Pantau nomor & alamat di Google.',
    completed: false,
  },
];

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('audit');
  const [activeTab, setActiveTab] = useState<AuditTab>('email');

  const [email, setEmail] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [breaches, setBreaches] = useState<BreachIncident[]>([]);

  const [fullName, setFullName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [nameSearching, setNameSearching] = useState(false);
  const [nameSearched, setNameSearched] = useState(false);
  const [nameSearchError, setNameSearchError] = useState<string | null>(null);
  const [nameFindings, setNameFindings] = useState<NameSearchFinding[]>([]);
  const [nameQueries, setNameQueries] = useState<OsintQueryItem[]>([]);

  const [phoneInput, setPhoneInput] = useState('');
  const [carrierAnalysis, setCarrierAnalysis] = useState<CarrierAnalysis | null>(null);
  const [phoneQueries, setPhoneQueries] = useState<OsintQueryItem[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ExposureAnalysisResult | null>(null);

  const [checklist, setChecklist] = useState<DefenseChecklistItem[]>(BASELINE_CHECKLIST);
  const [selectedDraftIndex, setSelectedDraftIndex] = useState<number | null>(null);

  const confirmedBreaches = useMemo(() => breaches.filter((b) => b.confirmed), [breaches]);
  const confirmedNameFindings = useMemo(
    () => nameFindings.filter((f) => f.confirmed),
    [nameFindings]
  );
  const confirmedNameQueries = useMemo(
    () => nameQueries.filter((q) => q.confirmed),
    [nameQueries]
  );
  const totalConfirmedNameCount = confirmedNameFindings.length + confirmedNameQueries.length;
  const confirmedPhoneQueries = useMemo(
    () => phoneQueries.filter((q) => q.confirmed),
    [phoneQueries]
  );

  const totalConfirmedCount =
    confirmedBreaches.length + totalConfirmedNameCount + confirmedPhoneQueries.length;

  const hasAnyInput = Boolean(
    email.trim() ||
      emailChecked ||
      breaches.length > 0 ||
      fullName.trim() ||
      nameSearched ||
      nameQueries.length > 0 ||
      phoneInput.trim() ||
      carrierAnalysis ||
      analysisResult
  );

  const handleCheckEmail = async (emailToCheck: string) => {
    setEmailLoading(true);
    setEmailError(null);

    try {
      const response = await fetch(
        `/api/breach-check?email=${encodeURIComponent(emailToCheck)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Gagal memeriksa email.');
      }

      const typed = data as BreachCheckResponse;
      setEmailChecked(true);
      setBreaches(
        (typed.breaches ?? []).map((item) => ({
          ...item,
          confirmed: true,
        }))
      );
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : 'Layanan kebocoran tidak dapat dijangkau.'
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handleToggleBreachConfirm = (id: string) => {
    setBreaches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, confirmed: !b.confirmed } : b))
    );
  };

  const handleAddManualBreach = (serviceName: string, year: string, dataTypes: string) => {
    const parsedData = dataTypes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const manualItem: BreachIncident = {
      id: `manual-${Date.now()}`,
      breach: serviceName,
      domain: 'Manual',
      year,
      industry: 'Manual',
      passwordRisk: parsedData.some(
        (d) => d.toLowerCase().includes('password') || d.toLowerCase().includes('sandi')
      )
        ? 'high'
        : 'unknown',
      exposedData: parsedData.length > 0 ? parsedData : ['Email'],
      recordsCount: 0,
      details: '',
      verified: true,
      confirmed: true,
    };

    setEmailChecked(true);
    setBreaches((prev) => [manualItem, ...prev]);
  };

  const handleAutoNameSearch = async () => {
    if (!fullName.trim()) return;
    setNameSearching(true);
    setNameSearchError(null);
    setNameQueries(buildNameOsintQueries(fullName, affiliation));

    try {
      const response = await fetch('/api/name-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          affiliation: affiliation.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Gagal mengakses indeks publik.');
      }

      const typed = data as NameSearchResponse;
      setNameSearched(true);
      setNameFindings((prev) => {
        const manualOnes = prev.filter((p) => p.id.startsWith('manual-name-'));
        const apiOnes = (typed.findings ?? []).map((item) => ({
          ...item,
          confirmed: item.severity === 'bahaya' || item.severity === 'waspada',
        }));
        return [...manualOnes, ...apiOnes];
      });
    } catch (err) {
      setNameSearched(true);
      setNameSearchError(
        err instanceof Error ? err.message : 'Gagal mengakses indeks publik.'
      );
    } finally {
      setNameSearching(false);
    }
  };

  const handleAddManualNameFinding = (
    title: string,
    url: string,
    severity: NameFindingSeverity,
    note: string
  ) => {
    let domain = 'Manual';
    if (url) {
      try {
        domain = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        domain = url;
      }
    }
    const manualItem: NameSearchFinding = {
      id: `manual-name-${Date.now()}`,
      title,
      url,
      domain,
      category: 'Manual',
      severity,
      reason: note || severity,
      exposedElements: ['Nama Lengkap'],
      confirmed: severity !== 'aman',
    };
    setNameSearched(true);
    setNameFindings((prev) => [manualItem, ...prev]);
  };

  const handleToggleNameFindingConfirm = (id: string) => {
    setNameFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, confirmed: !f.confirmed } : f))
    );
  };

  const handleToggleNameQueryConfirm = (id: string) => {
    setNameQueries((prev) =>
      prev.map((q) => (q.id === id ? { ...q, confirmed: !q.confirmed } : q))
    );
  };

  const handleAnalyzePhone = () => {
    const analysis = analyzeIndonesianPhone(phoneInput);
    setCarrierAnalysis(analysis);
    setPhoneQueries(analysis ? buildPhoneOsintQueries(analysis) : []);
  };

  const handleTogglePhoneConfirm = (id: string) => {
    setPhoneQueries((prev) =>
      prev.map((q) => (q.id === id ? { ...q, confirmed: !q.confirmed } : q))
    );
  };

  const handleRunAnalysis = async () => {
    const canAnalyze = emailChecked || nameSearched || totalConfirmedCount > 0;

    if (!canAnalyze) {
      setActiveView('audit');
      return;
    }

    setActiveView('analysis');
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const combinedNameCategories = [
        ...confirmedNameFindings.map((f) => ({
          category: `${f.category} [${f.severity.toUpperCase()}]`,
          title: f.title,
          note: `${f.domain} — ${f.reason}`,
        })),
        ...confirmedNameQueries.map((q) => ({
          category: q.category,
          title: q.title,
          note: q.note,
        })),
      ];

      const response = await fetch('/api/analyze-exposure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSummary: {
            checked: emailChecked,
            domain: email.includes('@') ? maskEmailForAnalysis(email) : 'Tidak diisi',
            confirmedBreaches: confirmedBreaches.map((b) => ({
              name: b.breach,
              year: b.year,
              exposedData: b.exposedData,
              passwordRisk: b.passwordRisk,
            })),
          },
          nameSummary: {
            provided: Boolean(fullName.trim()),
            confirmedCategories: combinedNameCategories,
          },
          phoneSummary: {
            provided: Boolean(carrierAnalysis),
            carrier: carrierAnalysis?.carrier ?? 'Tidak diisi',
            formatValid: carrierAnalysis?.isValidIndonesianMobile ?? false,
            confirmedCategories: confirmedPhoneQueries.map((q) => ({
              category: q.category,
              title: q.title,
              note: q.note,
            })),
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Analisis AI gagal.');
      }

      const parsed = data as ExposureAnalysisResult;
      setAnalysisResult(parsed);

      if (
        Array.isArray(parsed.accountDefenseChecklist) &&
        parsed.accountDefenseChecklist.length > 0
      ) {
        const aiItems = parsed.accountDefenseChecklist.map((item, idx) => ({
          ...item,
          id: item.id || `ai-task-${idx}`,
          completed: false,
        }));
        setChecklist([...aiItems, ...BASELINE_CHECKLIST]);
      }

      if (Array.isArray(parsed.takedownDrafts) && parsed.takedownDrafts.length > 0) {
        setSelectedDraftIndex(0);
      }
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : 'Gagal menghubungi Gemini AI.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetSession = () => {
    setEmail('');
    setEmailChecked(false);
    setEmailError(null);
    setBreaches([]);
    setFullName('');
    setAffiliation('');
    setNameSearching(false);
    setNameSearched(false);
    setNameSearchError(null);
    setNameFindings([]);
    setNameQueries([]);
    setPhoneInput('');
    setCarrierAnalysis(null);
    setPhoneQueries([]);
    setAnalysisResult(null);
    setAnalysisError(null);
    setChecklist(BASELINE_CHECKLIST);
    setSelectedDraftIndex(null);
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleResetChecklist = () => {
    setChecklist((prev) => prev.map((item) => ({ ...item, completed: false })));
  };

  const handleLoadDraftToToolkit = (draftIndex: number) => {
    setSelectedDraftIndex(draftIndex);
    setActiveView('toolkit');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen flex-col text-zinc-100">
        <AmbientBackground />

        <div className="relative z-10 flex min-h-screen flex-col">
          <TopBar
            activeView={activeView}
            onSelectView={setActiveView}
            onRunAnalysis={handleRunAnalysis}
            isAnalyzing={isAnalyzing}
            hasAnalysis={Boolean(analysisResult)}
          />

          <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-10 sm:px-6 sm:py-12">
          <AnimatePresence mode="wait">
            {activeView === 'audit' && (
              <motion.div
                key="view-audit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                {/* Minimalist Colorful Hero */}
                <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-2.5">
                    <h1
                      className="font-display font-bold tracking-tight text-white"
                      style={{
                        fontSize: 'clamp(2rem, 4vw, 3.1rem)',
                        lineHeight: 1.08,
                        textWrap: 'balance',
                      }}
                    >
                      Cek <span className="text-gradient-animated">Jejak Digital Anda.</span>
                    </h1>
                    <p className="max-w-lg text-sm text-zinc-300">
                      Pantau kebocoran <span className="text-sky-300">email</span>, kemunculan{' '}
                      <span className="text-violet-300">nama</span>, dan eksposur{' '}
                      <span className="text-emerald-300">nomor WhatsApp</span> secara privat.
                    </p>
                  </div>

                  {hasAnyInput && (
                    <button
                      type="button"
                      onClick={handleResetSession}
                      className="inline-flex items-center gap-1.5 self-start rounded-lg border border-white/10 bg-[#0B0D13]/80 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/10 whitespace-nowrap cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Reset</span>
                    </button>
                  )}
                </section>

                {/* Clean Focused Audit Card */}
                <section className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#0B0D13]/80 backdrop-blur-md p-1">
                      {(
                        [
                          {
                            id: 'email',
                            label: 'Email',
                            count: confirmedBreaches.length,
                            Icon: Mail,
                            activeColor: 'text-sky-300',
                          },
                          {
                            id: 'name',
                            label: 'Nama',
                            count: totalConfirmedNameCount,
                            Icon: User,
                            activeColor: 'text-violet-300',
                          },
                          {
                            id: 'phone',
                            label: 'No. HP',
                            count: confirmedPhoneQueries.length,
                            Icon: Phone,
                            activeColor: 'text-emerald-300',
                          },
                        ] as const
                      ).map((tab) => {
                        const isSelected = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                              isSelected ? tab.activeColor : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {isSelected && (
                              <motion.span
                                layoutId="auditTabPill"
                                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute inset-0 rounded-md bg-white/10 border border-white/15"
                              />
                            )}
                            <tab.Icon className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
                            <span className="relative z-10">{tab.label}</span>
                            {tab.count > 0 && (
                              <span className="relative z-10 font-mono tabular-nums opacity-85">
                                ({tab.count})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {(emailChecked || nameSearched || totalConfirmedCount > 0) && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        type="button"
                        onClick={handleRunAnalysis}
                        disabled={isAnalyzing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:from-sky-400 hover:to-indigo-400 whitespace-nowrap cursor-pointer"
                      >
                        <span>Analisis {totalConfirmedCount} Temuan</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </motion.button>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0B0D13]/80 backdrop-blur-md p-5 sm:p-6">
                    <AnimatePresence mode="wait">
                      {activeTab === 'email' && (
                        <motion.div
                          key="tab-email"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                        >
                          <EmailAuditPanel
                            email={email}
                            onEmailChange={setEmail}
                            breaches={breaches}
                            hasChecked={emailChecked}
                            isLoading={emailLoading}
                            error={emailError}
                            onCheckEmail={handleCheckEmail}
                            onToggleBreachConfirm={handleToggleBreachConfirm}
                            onAddManualBreach={handleAddManualBreach}
                          />
                        </motion.div>
                      )}

                      {activeTab === 'name' && (
                        <motion.div
                          key="tab-name"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                        >
                          <NameAuditPanel
                            fullName={fullName}
                            affiliation={affiliation}
                            onFullNameChange={setFullName}
                            onAffiliationChange={setAffiliation}
                            isSearching={nameSearching}
                            hasSearched={nameSearched}
                            searchError={nameSearchError}
                            findings={nameFindings}
                            queries={nameQueries}
                            onAutoSearch={handleAutoNameSearch}
                            onToggleFindingConfirm={handleToggleNameFindingConfirm}
                            onAddManualFinding={handleAddManualNameFinding}
                            onToggleQueryConfirm={handleToggleNameQueryConfirm}
                          />
                        </motion.div>
                      )}

                      {activeTab === 'phone' && (
                        <motion.div
                          key="tab-phone"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                        >
                          <PhoneAuditPanel
                            phoneInput={phoneInput}
                            onPhoneInputChange={setPhoneInput}
                            carrierAnalysis={carrierAnalysis}
                            queries={phoneQueries}
                            onAnalyzePhone={handleAnalyzePhone}
                            onToggleConfirm={handleTogglePhoneConfirm}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </section>
              </motion.div>
            )}

            {activeView === 'analysis' && (
              <motion.div
                key="view-analysis"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <AiAnalysisSection
                  confirmedBreachCount={confirmedBreaches.length}
                  confirmedNameCount={totalConfirmedNameCount}
                  confirmedPhoneCount={confirmedPhoneQueries.length}
                  hasAnyChecked={emailChecked || nameSearched || totalConfirmedCount > 0}
                  onAnalyze={handleRunAnalysis}
                  isAnalyzing={isAnalyzing}
                  error={analysisError}
                  result={analysisResult}
                  onLoadDraftToToolkit={handleLoadDraftToToolkit}
                  onGoToAudit={() => setActiveView('audit')}
                />
              </motion.div>
            )}

            {activeView === 'toolkit' && (
              <motion.div
                key="view-toolkit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <PrivacyToolkitSection
                  checklist={checklist}
                  onToggleChecklistItem={handleToggleChecklistItem}
                  onResetChecklist={handleResetChecklist}
                  aiDrafts={analysisResult?.takedownDrafts ?? []}
                  selectedDraftIndex={selectedDraftIndex}
                  onSelectAiDraft={(idx) => setSelectedDraftIndex(idx >= 0 ? idx : null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          </main>

          <footer className="border-t border-white/10 bg-[#050608]/70 backdrop-blur-md">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-zinc-500 sm:px-6">
              <span className="inline-flex items-center gap-1.5 text-zinc-400">
                <Shield className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                <span>Zero-Storage · UU PDP 27/2022</span>
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="https://myactivity.google.com/results-about-you"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-300/80 hover:text-sky-300 transition-colors"
                >
                  Google Results About You
                </a>
                <a
                  href="https://myaccount.google.com/connections"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-300/80 hover:text-violet-300 transition-colors"
                >
                  Akses Google
                </a>
                <a
                  href="https://haveibeenpwned.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300/80 hover:text-emerald-300 transition-colors"
                >
                  HIBP
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </MotionConfig>
  );
}
