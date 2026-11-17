import type { CarrierAnalysis, OsintQueryItem } from '../types/audit';

export function buildGoogleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function buildNameOsintQueries(
  fullName: string,
  affiliationOrCity?: string
): OsintQueryItem[] {
  const cleanName = fullName.trim().replace(/"/g, '');
  if (!cleanName) return [];

  const cleanContext = affiliationOrCity?.trim().replace(/"/g, '') ?? '';
  const contextClause = cleanContext ? ` "${cleanContext}"` : '';

  const defs = [
    {
      id: 'name-docs',
      category: 'Dokumen Publik',
      title: 'Dokumen PDF, Word & Spreadsheet Terindeks',
      description:
        'Mendeteksi kemunculan nama pada daftar panitia, SK kampus, daftar hadir, laporan kegiatan, atau tabel CSV/Excel yang terbuka di mesin pencari.',
      query: `"${cleanName}"${contextClause} (filetype:pdf OR filetype:docx OR filetype:xlsx OR filetype:csv)`,
    },
    {
      id: 'name-directory',
      category: 'Direktori Terbuka',
      title: 'Direktori Peserta, Alumni & Indeks Web',
      description:
        'Memeriksa halaman direktori organisasi, pengumuman kelulusan, daftar peserta seminar, atau indeks direktori yang terpublikasi.',
      query: `"${cleanName}"${contextClause} (inurl:peserta OR inurl:panitia OR inurl:alumni OR inurl:directory OR intitle:"index of")`,
    },
    {
      id: 'name-social',
      category: 'Profil & Repositori',
      title: 'Profil Publik, Forum & Repositori Kode',
      description:
        'Menelusuri kemunculan nama di profil media sosial terbuka, dokumen Scribd, atau repositori publik seperti GitHub.',
      query: `"${cleanName}"${contextClause} (site:linkedin.com OR site:facebook.com OR site:x.com OR site:scribd.com OR site:github.com)`,
    },
    {
      id: 'name-sensitive',
      category: 'Konteks Data Sensitif',
      title: 'Kemunculan Bersama Atribut Identitas',
      description:
        'Mengaudit apakah nama lengkap Anda muncul berdampingan dengan kata kunci sensitif seperti NIM, NIP, alamat, atau kontak pribadi.',
      query: `"${cleanName}"${contextClause} ("NIM" OR "NIP" OR "NIK" OR "alamat" OR "whatsapp" OR "telepon")`,
    },
  ];

  return defs.map((item) => ({
    ...item,
    pathway: 'name' as const,
    googleUrl: buildGoogleSearchUrl(item.query),
    confirmed: false,
    note: '',
  }));
}

interface PrefixRule {
  prefixes: string[];
  carrier: string;
}

const INDONESIAN_CARRIERS: PrefixRule[] = [
  {
    carrier: 'Telkomsel (Simpati / KartuAS / Halo / by.U)',
    prefixes: ['0811', '0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853'],
  },
  {
    carrier: 'Indosat Ooredoo Hutchison (IM3 / Mentari)',
    prefixes: ['0814', '0815', '0816', '0855', '0856', '0857', '0858'],
  },
  {
    carrier: 'XL Axiata',
    prefixes: ['0817', '0818', '0819', '0859', '0877', '0878'],
  },
  {
    carrier: 'Axis (XL Axiata)',
    prefixes: ['0831', '0832', '0833', '0838'],
  },
  {
    carrier: 'Tri (3 Indonesia / IOH)',
    prefixes: ['0895', '0896', '0897', '0898', '0899'],
  },
  {
    carrier: 'Smartfren',
    prefixes: ['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'],
  },
];

export function analyzeIndonesianPhone(rawInput: string): CarrierAnalysis | null {
  const digitsOnly = rawInput.replace(/\D/g, '');
  if (digitsOnly.length < 8) return null;

  let local = digitsOnly;
  if (local.startsWith('62')) {
    local = '0' + local.slice(2);
  } else if (!local.startsWith('0') && local.startsWith('8')) {
    local = '0' + local;
  }

  const intlDigits = local.startsWith('0') ? '62' + local.slice(1) : digitsOnly;
  const intlFormatted = `+${intlDigits}`;

  const dashFormatted =
    local.length >= 10
      ? `${local.slice(0, 4)}-${local.slice(4, 8)}-${local.slice(8)}`
      : local;

  const prefix4 = local.slice(0, 4);
  const matched = INDONESIAN_CARRIERS.find((rule) => rule.prefixes.includes(prefix4));
  const isValidIndo = /^08\d{8,11}$/.test(local);

  const riskNotes: string[] = [];
  if (isValidIndo) {
    riskNotes.push(
      'Nomor seluler Indonesia aktif sering digunakan sebagai faktor pemulihan OTP SMS dan akun WhatsApp.'
    );
    if (matched) {
      riskNotes.push(
        `Prefix ${prefix4} teridentifikasi sebagai ${matched.carrier}. Pastikan proteksi penggantian SIM/eSIM di gerai resmi aktif.`
      );
    } else {
      riskNotes.push(
        `Prefix ${prefix4} tidak cocok dengan daftar prefix seluler standar utama atau merupakan nomor khusus/VOIP.`
      );
    }
    riskNotes.push(
      'Situs iklan baris dan dokumen PDF sering menyimpan nomor dalam format 08xx, +628xx, maupun 08xx-xxxx-xxxx.'
    );
  } else {
    riskNotes.push(
      'Format nomor di luar pola standar seluler Indonesia (08xx 10–13 digit). Kueri tetap dibuat menggunakan variasi digit yang dimasukkan.'
    );
  }

  return {
    normalizedLocal: local,
    normalizedIntl: intlFormatted,
    normalizedDash: dashFormatted,
    whatsappFormat: `wa.me/${intlDigits}`,
    carrier: matched?.carrier ?? (isValidIndo ? 'Operator Seluler Lainnya' : 'Format Non-Standar / Internasional'),
    isValidIndonesianMobile: isValidIndo,
    riskNotes,
  };
}

export function buildPhoneOsintQueries(analysis: CarrierAnalysis): OsintQueryItem[] {
  const { normalizedLocal, normalizedDash, normalizedIntl } = analysis;
  const intlNoPlus = normalizedIntl.replace('+', '');
  const variants = `("${normalizedLocal}" OR "${normalizedDash}" OR "${intlNoPlus}" OR "${normalizedIntl}")`;

  const defs = [
    {
      id: 'phone-classifieds',
      category: 'Iklan & Marketplace',
      title: 'Iklan Baris, Listing Usaha & Marketplace',
      description:
        'Mengecek apakah nomor telepon Anda masih terpajang pada iklan jual-beli lama, direktori UMKM, atau halaman kontak terbuka.',
      query: `${variants} ("hubungi" OR "jual" OR "sewa" OR site:olx.co.id OR site:tokopedia.com OR site:shopee.co.id)`,
    },
    {
      id: 'phone-whatsapp',
      category: 'Tautan WhatsApp Publik',
      title: 'Tautan Klik-untuk-Chat WhatsApp (wa.me)',
      description:
        'Mencari tautan langsung wa.me atau api.whatsapp.com yang terindeks Google dari bio media sosial, formulir, atau blog.',
      query: `("wa.me/${intlNoPlus}" OR "api.whatsapp.com/send?phone=${intlNoPlus}" OR "wa.me/${normalizedLocal}")`,
    },
    {
      id: 'phone-docs',
      category: 'Dokumen & Tabel Publik',
      title: 'Dokumen PDF, Excel & Daftar Kontak Terbuka',
      description:
        'Mengaudit kemunculan nomor HP dalam lampiran dokumen publik, daftar anggota, atau file spreadsheet yang terindeks.',
      query: `${variants} (filetype:pdf OR filetype:xlsx OR filetype:csv OR filetype:docx OR site:scribd.com)`,
    },
    {
      id: 'phone-social',
      category: 'Media Sosial & Forum',
      title: 'Postingan Forum, Telegram & Media Sosial',
      description:
        'Mendeteksi nomor yang pernah ditulis di komentar publik, unggahan media sosial terbuka, atau arsip grup publik.',
      query: `${variants} (site:facebook.com OR site:x.com OR site:instagram.com OR site:t.me OR site:kaskus.co.id)`,
    },
  ];

  return defs.map((item) => ({
    ...item,
    pathway: 'phone' as const,
    googleUrl: buildGoogleSearchUrl(item.query),
    confirmed: false,
    note: '',
  }));
}

export function maskEmailForAnalysis(email: string): string {
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 1) return trimmed ? `***@${trimmed.slice(atIndex + 1)}` : 'unknown';
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}
