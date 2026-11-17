import React, { useMemo, useState } from 'react';
import { Mail, Phone, RotateCcw, Shield, User } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { EmailAuditPanel } from './components/EmailAuditPanel';
import { NameAuditPanel } from './components/NameAuditPanel';
import { PhoneAuditPanel } from './components/PhoneAuditPanel';
import { AiAnalysisSection } from './components/AiAnalysisSection';
import { PrivacyToolkitSection } from './components/PrivacyToolkitSection';
import { EthicsAndPrivacySection } from './components/EthicsAndPrivacySection';
import type {
  BreachCheckResponse,
  BreachIncident,
  CarrierAnalysis,
  DefenseChecklistItem,
  ExposureAnalysisResult,
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
    task: 'Aktifkan Passkey atau Authenticator pada Email Utama',
    targetService: 'Akun Google / Email',
    urgency: 'Segera',
    howTo: 'Gunakan Passkey atau aplikasi authenticator daripada SMS OTP.',
    completed: false,
  },
  {
    id: 'base-google-connections',
    task: 'Cabut Akses Aplikasi Pihak Ketiga yang Usang',
    targetService: 'myaccount.google.com/connections',
    urgency: 'Tinggi',
    howTo: 'Hapus izin situs lama yang terhubung lewat Login with Google.',
    completed: false,
  },
  {
    id: 'base-whatsapp-2step',
    task: 'Aktifkan PIN 2-Langkah & Bisukan Penelepon Tak Dikenal',
    targetService: 'WhatsApp',
    urgency: 'Tinggi',
    howTo: 'Atur di Pengaturan > Akun > Verifikasi Dua Langkah & Privasi Panggilan.',
    completed: false,
  },
  {
    id: 'base-results-about-you',
    task: 'Aktifkan Pemantauan "Results about you"',
    targetService: 'Google Search',
    urgency: 'Normal',
    howTo: 'Pantau dan ajukan penghapusan nomor/alamat dari hasil Google.',
    completed: false,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AuditTab>('email');

  const [email, setEmail] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSource, setEmailSource] = useState<string | null>(null);
  const [breaches, setBreaches] = useState<BreachIncident[]>([]);

  const [fullName, setFullName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [nameSearching, setNameSearching] = useState(false);
  const [nameSearched, setNameSearched] = useState(false);
  const [nameSearchError, setNameSearchError] = useState<string | null>(null);
  const [nameSearchSummary, setNameSearchSummary] = useState<string | null>(null);
  const [nameFindings, setNameFindings] = useState<NameSearchFinding[]>([]);
  const [nameQueries, setNameQueries] = useState<OsintQueryItem[]>([]);

  const [phoneInput, setPhoneInput] = useState('');
  const [carrierAnalysis, setCarrierAnalysis] = useState<CarrierAnalysis | null>(null);
  const [phoneQueries, setPhoneQueries] = useState<OsintQueryItem[]>([]);

  const [additionalNotes, setAdditionalNotes] = useState('');
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
        throw new Error(data?.error || 'Gagal memeriksa riwayat kebocoran email.');
      }

      const typed = data as BreachCheckResponse;
      setEmailChecked(true);
      setEmailSource(typed.source);
      setBreaches(
        (typed.breaches ?? []).map((item) => ({
          ...item,
          confirmed: true,
        }))
      );
    } catch (err) {
      setEmailError(
        err instanceof Error
          ? err.message
          : 'Tidak dapat menghubungi layanan pemeriksaan kebocoran saat ini.'
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
      domain: 'Input Manual',
      year,
      industry: 'Manual',
      passwordRisk: parsedData.some(
        (d) => d.toLowerCase().includes('password') || d.toLowerCase().includes('sandi')
      )
        ? 'high'
        : 'unknown',
      exposedData: parsedData.length > 0 ? parsedData : ['Email'],
      recordsCount: 0,
      details: 'Ditambahkan manual oleh pengguna.',
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
        throw new Error(data?.error || 'Gagal mengakses indeks publik gratis.');
      }

      const typed = data as NameSearchResponse;
      setNameSearched(true);
      setNameSearchSummary(typed.summary);
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
        err instanceof Error ? err.message : 'Gagal mengakses indeks publik gratis.'
      );
    } finally {
      setNameSearching(false);
    }
  };

  const handleAddManualNameFinding = (
    title: string,
    url: string,
    severity: 'aman' | 'waspada' | 'bahaya',
    note: string
  ) => {
    let domain = 'Temuan Manual';
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
      category: 'Input Manual Pengguna',
      severity,
      reason:
        note ||
        (severity === 'bahaya'
          ? 'Ditandai berbahaya oleh pengguna (data sensitif/dokumen terbuka).'
          : severity === 'waspada'
            ? 'Ditandai perlu dicek oleh pengguna.'
            : 'Ditandai aman oleh pengguna.'),
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

  const handleNameNoteChange = (id: string, note: string) => {
    setNameQueries((prev) => prev.map((q) => (q.id === id ? { ...q, note } : q)));
  };

  const handleAnalyzePhone = () => {
    const analysis = analyzeIndonesianPhone(phoneInput);
    setCarrierAnalysis(analysis);
    if (analysis) {
      setPhoneQueries(buildPhoneOsintQueries(analysis));
    } else {
      setPhoneQueries([]);
    }
  };

  const handleTogglePhoneConfirm = (id: string) => {
    setPhoneQueries((prev) =>
      prev.map((q) => (q.id === id ? { ...q, confirmed: !q.confirmed } : q))
    );
  };

  const handlePhoneNoteChange = (id: string, note: string) => {
    setPhoneQueries((prev) => prev.map((q) => (q.id === id ? { ...q, note } : q)));
  };

  const handleRunAnalysis = async () => {
    const canAnalyze =
      emailChecked ||
      nameSearched ||
      confirmedBreaches.length > 0 ||
      totalConfirmedNameCount > 0 ||
      confirmedPhoneQueries.length > 0 ||
      additionalNotes.trim().length > 0;

    if (!canAnalyze) {
      document.getElementById('audit-mandiri')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    document.getElementById('analisis-ai')?.scrollIntoView({ behavior: 'smooth' });
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const combinedNameCategories = [
        ...confirmedNameFindings.map((f) => ({
          category: `${f.category} [${f.severity.toUpperCase()}]`,
          title: f.title,
          note: `${f.domain} — ${f.reason} (${f.exposedElements.join(', ')})`,
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
          additionalNotes: additionalNotes.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Analisis risiko AI gagal diproses.');
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
        err instanceof Error ? err.message : 'Gagal menghubungi mesin analisis Gemini AI.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetSession = () => {
    setEmail('');
    setEmailChecked(false);
    setEmailError(null);
    setEmailSource(null);
    setBreaches([]);
    setFullName('');
    setAffiliation('');
    setNameSearching(false);
    setNameSearched(false);
    setNameSearchError(null);
    setNameSearchSummary(null);
    setNameFindings([]);
    setNameQueries([]);
    setPhoneInput('');
    setCarrierAnalysis(null);
    setPhoneQueries([]);
    setAdditionalNotes('');
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
    document.getElementById('toolkit-privasi')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="top" className="min-h-screen bg-[#050608] text-zinc-100 bg-tech-grid">
      <TopBar
        onRunAnalysis={handleRunAnalysis}
        hasAnyInput={hasAnyInput}
        isAnalyzing={isAnalyzing}
      />

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <h1
              className="font-display font-bold tracking-tight text-white"
              style={{
                fontSize: 'clamp(2rem, 3.6vw, 3rem)',
                lineHeight: 1.1,
                textWrap: 'balance',
              }}
            >
              Audit Jejak Digital Anda.
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
              Pindai kebocoran email, deteksi eksposur nama otomatis, dan bersihkan jejak data dengan AI.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
              <Shield className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
              <span>Zero-Storage Session</span>
            </div>

            {hasAnyInput && (
              <button
                type="button"
                onClick={handleResetSession}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B0D13] px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/10 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Sesi</span>
              </button>
            )}
          </div>
        </section>

        <section id="audit-mandiri" className="scroll-mt-20 space-y-4">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-[#0B0D13] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-white text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Email</span>
              {confirmedBreaches.length > 0 && (
                <span className="font-mono tabular-nums opacity-75">
                  ({confirmedBreaches.length})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('name')}
              className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'name'
                  ? 'bg-white text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Nama Lengkap</span>
              {totalConfirmedNameCount > 0 && (
                <span className="font-mono tabular-nums opacity-75">
                  ({totalConfirmedNameCount})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('phone')}
              className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'phone'
                  ? 'bg-white text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              <span>No. HP / WA</span>
              {confirmedPhoneQueries.length > 0 && (
                <span className="font-mono tabular-nums opacity-75">
                  ({confirmedPhoneQueries.length})
                </span>
              )}
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0B0D13] p-6">
            {activeTab === 'email' && (
              <EmailAuditPanel
                email={email}
                onEmailChange={setEmail}
                breaches={breaches}
                hasChecked={emailChecked}
                isLoading={emailLoading}
                error={emailError}
                sourceLabel={emailSource}
                onCheckEmail={handleCheckEmail}
                onToggleBreachConfirm={handleToggleBreachConfirm}
                onAddManualBreach={handleAddManualBreach}
              />
            )}

            {activeTab === 'name' && (
              <NameAuditPanel
                fullName={fullName}
                affiliation={affiliation}
                onFullNameChange={setFullName}
                onAffiliationChange={setAffiliation}
                isSearching={nameSearching}
                hasSearched={nameSearched}
                searchError={nameSearchError}
                searchSummary={nameSearchSummary}
                findings={nameFindings}
                queries={nameQueries}
                onAutoSearch={handleAutoNameSearch}
                onToggleFindingConfirm={handleToggleNameFindingConfirm}
                onAddManualFinding={handleAddManualNameFinding}
                onToggleQueryConfirm={handleToggleNameQueryConfirm}
                onQueryNoteChange={handleNameNoteChange}
              />
            )}

            {activeTab === 'phone' && (
              <PhoneAuditPanel
                phoneInput={phoneInput}
                onPhoneInputChange={setPhoneInput}
                carrierAnalysis={carrierAnalysis}
                queries={phoneQueries}
                onAnalyzePhone={handleAnalyzePhone}
                onToggleConfirm={handleTogglePhoneConfirm}
                onNoteChange={handlePhoneNoteChange}
              />
            )}
          </div>
        </section>

        <AiAnalysisSection
          confirmedBreachCount={confirmedBreaches.length}
          confirmedNameCount={totalConfirmedNameCount}
          confirmedPhoneCount={confirmedPhoneQueries.length}
          emailChecked={emailChecked || nameSearched}
          additionalNotes={additionalNotes}
          onAdditionalNotesChange={setAdditionalNotes}
          onAnalyze={handleRunAnalysis}
          isAnalyzing={isAnalyzing}
          error={analysisError}
          result={analysisResult}
          onLoadDraftToToolkit={handleLoadDraftToToolkit}
        />

        <PrivacyToolkitSection
          checklist={checklist}
          onToggleChecklistItem={handleToggleChecklistItem}
          onResetChecklist={handleResetChecklist}
          aiDrafts={analysisResult?.takedownDrafts ?? []}
          selectedDraftIndex={selectedDraftIndex}
          onSelectAiDraft={(idx) => setSelectedDraftIndex(idx >= 0 ? idx : null)}
        />

        <EthicsAndPrivacySection />
      </main>

      <footer className="border-t border-white/10 bg-[#050608]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>JejakGuard AI</span>
          <span>Zero-Storage · UU PDP No. 27/2022</span>
        </div>
      </footer>
    </div>
  );
}
