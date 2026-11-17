import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface RawXposedBreachDetail {
  breach?: string;
  domain?: string;
  industry?: string;
  password_risk?: string;
  xposed_data?: string;
  xposed_date?: string;
  xposed_records?: number | string;
  details?: string;
  verified?: string | boolean;
}

interface XposedBreachAnalyticsPayload {
  Error?: string;
  ExposedBreaches?: {
    breaches_details?: RawXposedBreachDetail[];
  } | null;
}

function parseExposedData(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseYear(rawDate?: string): string {
  if (!rawDate) return 'Tidak diketahui';
  const match = rawDate.match(/\d{4}/);
  return match ? match[0] : rawDate;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/breach-check', async (req, res) => {
    const rawEmail = typeof req.query.email === 'string' ? req.query.email.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!rawEmail || !emailRegex.test(rawEmail)) {
      res.status(400).json({
        error: 'Masukkan alamat email yang valid untuk memulai pemeriksaan kebocoran.',
      });
      return;
    }

    try {
      const targetUrl = `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(rawEmail)}`;
      const upstream = await fetch(targetUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'JejakGuard-Privacy-Auditor/1.0',
        },
        signal: AbortSignal.timeout(9000),
      });

      if (upstream.status === 404) {
        res.json({
          status: 'clean',
          breachCount: 0,
          breaches: [],
          source: 'XposedOrNot Public Breach API',
        });
        return;
      }

      if (upstream.status === 429) {
        res.status(429).json({
          error:
            'Batas permintaan API XposedOrNot sedang padat. Tunggu beberapa saat atau verifikasi langsung melalui tautan Have I Been Pwned.',
          code: 'RATE_LIMITED',
        });
        return;
      }

      if (!upstream.ok) {
        res.status(502).json({
          error: `Layanan pengecekan kebocoran merespons dengan status ${upstream.status}. Silakan coba lagi atau gunakan tautan verifikasi resmi.`,
          code: 'UPSTREAM_ERROR',
        });
        return;
      }

      const payload = (await upstream.json()) as XposedBreachAnalyticsPayload;

      if (payload?.Error && payload.Error.toLowerCase().includes('not found')) {
        res.json({
          status: 'clean',
          breachCount: 0,
          breaches: [],
          source: 'XposedOrNot Public Breach API',
        });
        return;
      }

      const rawDetails = payload?.ExposedBreaches?.breaches_details ?? [];
      if (!Array.isArray(rawDetails) || rawDetails.length === 0) {
        res.json({
          status: 'clean',
          breachCount: 0,
          breaches: [],
          source: 'XposedOrNot Public Breach API',
        });
        return;
      }

      const breaches = rawDetails.map((item, idx) => ({
        id: `${item.breach ?? 'breach'}-${idx}`,
        breach: item.breach || 'Layanan Tidak Dikenal',
        domain: item.domain || '-',
        year: parseYear(item.xposed_date),
        industry: item.industry || 'Umum',
        passwordRisk: item.password_risk || 'unknown',
        exposedData: parseExposedData(item.xposed_data),
        recordsCount: Number(item.xposed_records) || 0,
        details: item.details || '',
        verified: item.verified === true || String(item.verified).toLowerCase() === 'yes',
      }));

      res.json({
        status: 'exposed',
        breachCount: breaches.length,
        breaches,
        source: 'XposedOrNot Public Breach API',
      });
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'TimeoutError'
          ? 'Permintaan ke API kebocoran publik melebihi batas waktu. Gunakan verifikasi langsung Have I Been Pwned atau coba kembali.'
          : 'Tidak dapat terhubung ke layanan API kebocoran publik saat ini.';
      res.status(502).json({
        error: message,
        code: 'UPSTREAM_UNREACHABLE',
      });
    }
  });

  function parseGeminiError(error: unknown): { status: number; message: string } {
    const raw = error instanceof Error ? error.message : String(error ?? '');
    const lower = raw.toLowerCase();

    if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
      return {
        status: 429,
        message:
          'Kuota API Gemini sedang habis (429 RESOURCE_EXHAUSTED). Anda dapat meningkatkan kuota dengan memilih API key berbayar di panel Settings > Secrets.',
      };
    }
    if (lower.includes('403') || lower.includes('permission_denied') || lower.includes('api_key_invalid')) {
      return {
        status: 403,
        message:
          'API key Gemini tidak valid atau belum memiliki izin. Periksa konfigurasi key di panel Settings > Secrets.',
      };
    }
    if (lower.includes('404') || lower.includes('not_found')) {
      return {
        status: 404,
        message: 'Model Gemini yang diminta tidak ditemukan atau belum tersedia.',
      };
    }
    return {
      status: 500,
      message: raw || 'Terjadi kesalahan saat memproses permintaan ke Gemini AI.',
    };
  }

  async function fetchPublicIndexFindings(fullName: string, affiliation: string) {
    const query = affiliation ? `${fullName} ${affiliation}` : fullName;
    const findings: Array<{
      id: string;
      title: string;
      url: string;
      domain: string;
      category: string;
      severity: 'aman' | 'waspada' | 'bahaya';
      reason: string;
      exposedElements: string[];
    }> = [];

    const tasks = await Promise.allSettled([
      fetch(
        `https://api.github.com/search/users?q=${encodeURIComponent(fullName)}&per_page=3`,
        {
          headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'JejakGuard-AI' },
          signal: AbortSignal.timeout(5000),
        }
      ).then((r) => (r.ok ? r.json() : null)),

      fetch(
        `https://api.openalex.org/authors?search=${encodeURIComponent(query)}&per-page=3`,
        {
          headers: { 'User-Agent': 'JejakGuard-AI' },
          signal: AbortSignal.timeout(5000),
        }
      ).then((r) => (r.ok ? r.json() : null)),

      fetch(
        `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`"${fullName}"`)}&format=json&srlimit=2`,
        {
          headers: { 'User-Agent': 'JejakGuard-AI' },
          signal: AbortSignal.timeout(5000),
        }
      ).then((r) => (r.ok ? r.json() : null)),
    ]);

    // 1. GitHub Users
    const ghResult = tasks[0];
    if (ghResult.status === 'fulfilled' && Array.isArray(ghResult.value?.items)) {
      for (const user of ghResult.value.items.slice(0, 2)) {
        if (user?.html_url && user?.login) {
          findings.push({
            id: `gh-${user.id ?? user.login}`,
            title: `Profil GitHub: ${user.login}`,
            url: String(user.html_url),
            domain: 'github.com',
            category: 'Profil Developer',
            severity: 'waspada',
            reason:
              'Akun GitHub publik terdeteksi. Pastikan email pribadi pada commit git dan bio profil tidak terekspos sembarangan.',
            exposedElements: ['Username GitHub', 'Repositori Publik'],
          });
        }
      }
    }

    // 2. OpenAlex Academic Authors
    const oaResult = tasks[1];
    if (oaResult.status === 'fulfilled' && Array.isArray(oaResult.value?.results)) {
      for (const author of oaResult.value.results.slice(0, 2)) {
        if (author?.id && author?.display_name) {
          const instName = author?.last_known_institutions?.[0]?.display_name;
          findings.push({
            id: `oa-${String(author.id).split('/').pop()}`,
            title: `Publikasi Akademik: ${author.display_name}${instName ? ` (${instName})` : ''}`,
            url: String(author.id),
            domain: 'openalex.org',
            category: 'Publikasi Ilmiah',
            severity: 'aman',
            reason:
              'Tercatat sebagai penulis karya ilmiah atau sitasi akademik publik tanpa data kontak pribadi.',
            exposedElements: ['Nama Penulis', instName ? 'Afiliasi Kampus' : 'Karya Ilmiah'],
          });
        }
      }
    }

    // 3. Wikipedia Indonesia
    const wikiResult = tasks[2];
    if (wikiResult.status === 'fulfilled' && Array.isArray(wikiResult.value?.query?.search)) {
      for (const page of wikiResult.value.query.search.slice(0, 2)) {
        if (page?.title) {
          findings.push({
            id: `wiki-${page.pageid ?? page.title}`,
            title: `Artikel Wikipedia: ${page.title}`,
            url: `https://id.wikipedia.org/wiki/${encodeURIComponent(String(page.title).replace(/ /g, '_'))}`,
            domain: 'id.wikipedia.org',
            category: 'Ensiklopedia Publik',
            severity: 'aman',
            reason: 'Kemunculan ensiklopedis publik yang bersifat informasional dan aman.',
            exposedElements: ['Nama Publik'],
          });
        }
      }
    }

    return findings;
  }

  app.post('/api/name-search', async (req, res) => {
    const rawName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
    const rawContext = typeof req.body?.affiliation === 'string' ? req.body.affiliation.trim() : '';

    if (!rawName || rawName.length < 2) {
      res.status(400).json({
        error: 'Masukkan nama lengkap minimal 2 karakter untuk memulai pencarian.',
      });
      return;
    }

    try {
      const findings = await fetchPublicIndexFindings(rawName, rawContext);
      const status = findings.length > 0 ? 'found' : 'clean';
      const summary =
        findings.length > 0
          ? `Ditemukan ${findings.length} catatan di indeks publik gratis (GitHub, OpenAlex, Wikipedia) untuk "${rawName}". Lanjutkan verifikasi dokumen PDF/direktori via tombol Google Dork di bawah.`
          : `Tidak ditemukan catatan di indeks publik gratis (GitHub, OpenAlex, Wikipedia) untuk "${rawName}". Gunakan tombol Google Dork di bawah untuk memeriksa dokumen PDF/direktori di Google.`;

      res.json({
        status,
        summary,
        findings,
      });
    } catch {
      res.status(502).json({
        error: 'Gagal mengakses indeks publik gratis. Gunakan tombol Google Dork manual di bawah.',
      });
    }
  });

  app.post('/api/analyze-exposure', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error:
          'GEMINI_API_KEY belum tersedia di konfigurasi server. Pastikan secret API key telah diatur.',
      });
      return;
    }

    const body = req.body ?? {};
    const emailSummary = body.emailSummary ?? {};
    const nameSummary = body.nameSummary ?? {};
    const phoneSummary = body.phoneSummary ?? {};
    const additionalNotes = typeof body.additionalNotes === 'string' ? body.additionalNotes.trim() : '';

    const confirmedBreaches = Array.isArray(emailSummary.confirmedBreaches)
      ? emailSummary.confirmedBreaches
      : [];
    const confirmedNameFindings = Array.isArray(nameSummary.confirmedCategories)
      ? nameSummary.confirmedCategories
      : [];
    const confirmedPhoneFindings = Array.isArray(phoneSummary.confirmedCategories)
      ? phoneSummary.confirmedCategories
      : [];

    if (
      !emailSummary.checked &&
      confirmedBreaches.length === 0 &&
      confirmedNameFindings.length === 0 &&
      confirmedPhoneFindings.length === 0 &&
      !additionalNotes
    ) {
      res.status(400).json({
        error:
          'Lakukan setidaknya satu pemeriksaan atau centang minimal satu temuan eksposur sebelum menjalankan analisis risiko AI.',
      });
      return;
    }

    const promptContent = `
Lakukan audit risiko privasi dan eksposur digital pribadi berdasarkan hasil temuan mandiri pengguna berikut (data sensitif asli telah disamarkan demi privasi):

1. JALUR EMAIL:
- Status cek API breach: ${emailSummary.checked ? 'Sudah dicek' : 'Belum dicek'}
- Domain email: ${emailSummary.domain || 'Tidak disertakan'}
- Insiden kebocoran terkonfirmasi (${confirmedBreaches.length} layanan):
${
  confirmedBreaches.length > 0
    ? confirmedBreaches
        .map(
          (b: { name?: string; year?: string; exposedData?: string[]; passwordRisk?: string }) =>
            `  * ${b.name} (Tahun: ${b.year || '-'}, Risiko sandi: ${b.passwordRisk || '-'}, Data terekspos: ${(b.exposedData || []).join(', ') || 'Email'})`
        )
        .join('\n')
    : '  * Tidak ada insiden kebocoran yang ditandai.'
}

2. JALUR NAMA LENGKAP (OSINT SELF-CHECK):
- Diisi pengguna: ${nameSummary.provided ? 'Ya' : 'Tidak'}
- Kategori kemunculan publik yang dikonfirmasi pengguna (${confirmedNameFindings.length} kategori):
${
  confirmedNameFindings.length > 0
    ? confirmedNameFindings
        .map(
          (f: { category?: string; title?: string; note?: string }) =>
            `  * ${f.category} (${f.title})${f.note ? ` — Catatan/URL temuan: ${f.note}` : ''}`
        )
        .join('\n')
    : '  * Belum ada kemunculan nama di publik yang dikonfirmasi.'
}

3. JALUR NOMOR TELEPON / WHATSAPP:
- Diisi pengguna: ${phoneSummary.provided ? 'Ya' : 'Tidak'}
- Operator terdeteksi: ${phoneSummary.carrier || 'Tidak diketahui'}
- Kategori kemunculan nomor di publik yang dikonfirmasi pengguna (${confirmedPhoneFindings.length} kategori):
${
  confirmedPhoneFindings.length > 0
    ? confirmedPhoneFindings
        .map(
          (f: { category?: string; title?: string; note?: string }) =>
            `  * ${f.category} (${f.title})${f.note ? ` — Catatan/URL temuan: ${f.note}` : ''}`
        )
        .join('\n')
    : '  * Belum ada kemunculan nomor telepon di publik yang dikonfirmasi.'
}

4. CATATAN TAMBAHAN PENGGUNA:
${additionalNotes || 'Tidak ada catatan tambahan.'}

TUGAS ANDA:
1. Hitung Skor Eksposur Digital (0–100) secara realistis dan proporsional terhadap kombinasi temuan di atas. Jika hanya sedikit atau bersih, beri skor rendah (10–30). Jika ada kombinasi kebocoran password + nomor HP/dokumen publik, naikkan skor dan jelaskan efek korelasinya.
2. Petakan skenario risiko penyalahgunaan nyata (phishing tertarget, credential stuffing, social engineering WhatsApp, SIM-swap, doxxing dokumen publik).
3. Susun Rencana Aksi Pembersihan prioritas dengan tautan resmi nyata (Google Results about you: https://myactivity.google.com/results-about-you, Google Account Third-party connections: https://myaccount.google.com/connections, Google Security Checkup: https://myaccount.google.com/security-checkup, Have I Been Pwned: https://haveibeenpwned.com/).
4. Buat Checklist Pertahanan Akun spesifik untuk layanan yang bocor atau vektor yang terekspos.
5. Buat 2 draf surat Right to Erasure / Permohonan Penghapusan Data Pribadi siap kirim dalam Bahasa Indonesia (mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi / UU PDP) sesuai konteks temuan pengguna (misalnya untuk admin website/kampus pemajang PDF atau admin direktori/iklan baris pemajang nomor HP).
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: promptContent,
        config: {
          systemInstruction:
            'Anda adalah Konsultan Keamanan Siber & Privasi Digital senior di Indonesia (JejakGuard AI). Berikan analisis yang akurat, terukur, bebas dari sensasionalisme, etis, dan berbasis praktik keamanan siber modern serta UU Pelindungan Data Pribadi (UU No. 27 Tahun 2022). Seluruh output wajib menggunakan Bahasa Indonesia yang jelas, profesional, dan langsung dapat ditindaklanjuti.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              exposureScore: {
                type: Type.INTEGER,
                description: 'Skor eksposur digital antara 0 hingga 100.',
              },
              riskLevel: {
                type: Type.STRING,
                description: 'Harus salah satu dari: Rendah, Sedang, Tinggi, Kritis.',
              },
              scoreBreakdown: {
                type: Type.OBJECT,
                properties: {
                  emailImpact: {
                    type: Type.INTEGER,
                    description: 'Kontribusi poin risiko dari jalur email (0-40).',
                  },
                  publicIdentityImpact: {
                    type: Type.INTEGER,
                    description: 'Kontribusi poin risiko dari eksposur nama & dokumen publik (0-30).',
                  },
                  phoneExposureImpact: {
                    type: Type.INTEGER,
                    description: 'Kontribusi poin risiko dari eksposur nomor telepon/WhatsApp (0-30).',
                  },
                  correlationMultiplier: {
                    type: Type.STRING,
                    description: 'Penjelasan singkat 1 kalimat tentang bagaimana kombinasi data saling memperkuat risiko.',
                  },
                },
                required: [
                  'emailImpact',
                  'publicIdentityImpact',
                  'phoneExposureImpact',
                  'correlationMultiplier',
                ],
              },
              executiveSummary: {
                type: Type.STRING,
                description: 'Ringkasan konsultasi 2-3 kalimat mengenai kondisi eksposur pengguna.',
              },
              riskScenarios: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    severity: {
                      type: Type.STRING,
                      description: 'Rendah, Sedang, Tinggi, atau Kritis',
                    },
                    attackVector: { type: Type.STRING },
                    combinedDataUsed: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    explanation: { type: Type.STRING },
                  },
                  required: ['title', 'severity', 'attackVector', 'combinedDataUsed', 'explanation'],
                },
              },
              priorityActions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    priority: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    officialLinkLabel: { type: Type.STRING },
                    officialLinkUrl: { type: Type.STRING },
                  },
                  required: ['priority', 'title', 'category', 'description'],
                },
              },
              accountDefenseChecklist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    task: { type: Type.STRING },
                    targetService: { type: Type.STRING },
                    urgency: {
                      type: Type.STRING,
                      description: 'Segera, Tinggi, atau Normal',
                    },
                    howTo: { type: Type.STRING },
                  },
                  required: ['id', 'task', 'targetService', 'urgency', 'howTo'],
                },
              },
              takedownDrafts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    recipientType: { type: Type.STRING },
                    legalBasis: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    body: { type: Type.STRING },
                  },
                  required: ['id', 'title', 'recipientType', 'legalBasis', 'subject', 'body'],
                },
              },
            },
            required: [
              'exposureScore',
              'riskLevel',
              'scoreBreakdown',
              'executiveSummary',
              'riskScenarios',
              'priorityActions',
              'accountDefenseChecklist',
              'takedownDrafts',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'Gemini AI tidak mengembalikan hasil analisis. Silakan coba kembali.',
        });
        return;
      }

      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (error) {
      const parsedErr = parseGeminiError(error);
      res.status(parsedErr.status).json({
        error: parsedErr.message,
      });
    }
  });

  app.post('/api/generate-takedown', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'GEMINI_API_KEY belum tersedia di konfigurasi server.',
      });
      return;
    }

    const {
      targetSite = '',
      targetUrl = '',
      exposedDataTypes = [],
      requesterAlias = '[Nama Lengkap Anda]',
      contextDetails = '',
      language = 'id',
    } = req.body ?? {};

    if (!String(targetSite).trim() && !String(targetUrl).trim()) {
      res.status(400).json({
        error: 'Masukkan nama situs/organisasi atau URL halaman tempat data Anda muncul.',
      });
      return;
    }

    const langInstruction =
      language === 'en'
        ? 'Susun surat resmi dalam Bahasa Inggris (English) yang mengacu pada hak penghapusan data (GDPR Art. 17 Right to Erasure / universal data privacy standards).'
        : 'Susun surat resmi dalam Bahasa Indonesia yang formal, tegas, namun santun, dengan dasar hukum UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) Pasal 8 & Pasal 43 tentang hak mengakhiri pemrosesan dan menghapus data pribadi.';

    const prompt = `
Buat draf email permohonan penghapusan data pribadi (Takedown / Right to Erasure Request) dengan detail berikut:
- Nama situs / instansi / pengelola: ${targetSite || 'Pengelola Situs'}
- URL atau lokasi dokumen spesifik: ${targetUrl || '[Masukkan URL halaman/dokumen]'}
- Jenis data pribadi yang terekspos: ${Array.isArray(exposedDataTypes) && exposedDataTypes.length > 0 ? exposedDataTypes.join(', ') : 'Data identitas pribadi'}
- Nama pemohon (placeholder/inisial): ${requesterAlias || '[Nama Lengkap Anda]'}
- Konteks tambahan: ${contextDetails || 'Data muncul secara terbuka di hasil pencarian publik tanpa persetujuan pemohon saat ini.'}

${langInstruction}
Sertakan placeholder yang rapi seperti [Nomor Identitas / Bukti Kepemilikan] jika diperlukan, tanpa mengarang fakta palsu.
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah penasihat hukum privasi data dan keamanan digital. Buat draf surat permohonan penghapusan data pribadi yang terstruktur, profesional, siap dikirim ke Data Protection Officer (DPO) atau administrator situs web.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              recipientSuggestion: {
                type: Type.STRING,
                description: 'Saran alamat tujuan seperti privacy@domain, admin@domain, atau DPO instansi.',
              },
              legalBasis: { type: Type.STRING },
              letterBody: { type: Type.STRING },
              sendingTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['subject', 'recipientSuggestion', 'legalBasis', 'letterBody', 'sendingTips'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Gagal menghasilkan draf surat penghapusan.' });
        return;
      }

      res.json(JSON.parse(rawText));
    } catch (error) {
      const parsedErr = parseGeminiError(error);
      res.status(parsedErr.status).json({ error: parsedErr.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      const indexHtml = path.join(distPath, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JejakGuard AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
