import { SEED_KUNCI_UJIAN_1, SEED_SSW_TIPE_2 } from './seed-data.js?v=ssw3';
import { all, get, put, putMany, del, snapshot, replaceAll, initialise } from './db.js?v=ssw3';
import { serializeDatabase, validateBackup, hydrateBackup, makeZip, readZip } from './archive.js?v=ssw3';
import { DEFAULT_PACKAGES, $, $$, uid, esc, fmtDate, fmtDuration, fmtDurationHMS, packageName, rawStats, downloadBlob, blobToDataURL, dataURLToBlob, shuffle, validateQuestion } from './utils.js?v=ssw3';

const BUILTIN_PACKAGES_META = [
  {
    id: 'ssw-pm-kunci-ujian-1',
    name: 'Soal Ujian 1 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 1.pdf',
    description: 'Paket 40 soal SSW 特定技能1号・飲食料品製造業 dengan furigana dan ilustrasi asli.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-kunci-ujian-2',
    name: 'Soal Ujian 2 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 2.pdf',
    description: 'Paket 40 soal Soal Ujian 2 — CBTP Gino1.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-kunci-ujian-3',
    name: 'Soal Ujian 3 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 3.pdf',
    description: 'Paket 40 soal Soal Ujian 3 — CBTP Gino1.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-kunci-ujian-4',
    name: 'Soal Ujian 4 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 4.pdf',
    description: 'Paket 40 soal Soal Ujian 4 — CBTP Gino1.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-kunci-ujian-5',
    name: 'Soal Ujian 5 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 5.pdf',
    description: 'Paket 40 soal Soal Ujian 5 — CBTP Gino1.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-kunci-ujian-6',
    name: 'Soal Ujian 6 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 6.pdf',
    description: 'Paket 40 soal Soal Ujian 6 — CBTP Gino1.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-kunci-ujian-7',
    name: 'Soal Ujian 7 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 7.pdf',
    description: 'Paket 40 soal Soal Ujian 7 — CBTP Gino1.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-kunci-ujian-8',
    name: 'Soal Ujian 8 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 8.pdf',
    description: 'Paket 40 soal Soal Ujian 8 — CBTP Gino1.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-kunci-ujian-9',
    name: 'Soal Ujian 9 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 9.pdf',
    description: 'Paket 40 soal Soal Ujian 9 — CBTP Gino1.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-kunci-ujian-10',
    name: 'Soal Ujian 10 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 10.pdf',
    description: 'Paket 40 soal Soal Ujian 10 — CBTP Gino1.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-kunci-ujian-11',
    name: 'Soal Ujian 11 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 11.pdf',
    description: 'Paket 40 soal Soal Ujian 11 — CBTP Gino1.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-kunci-ujian-12',
    name: 'Soal Ujian 12 — CBTP Gino1',
    sourcePdf: 'Kunci Soal Ujian 12.pdf',
    description: 'Paket 40 soal Soal Ujian 12 — CBTP Gino1.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-kunci-ujian-13',
    name: 'Soal Ujian 13 — Rakuraku Tokutei (2024年10月)',
    sourcePdf: 'Kunci Soal Ujian 13.pdf',
    description: 'Paket 40 soal Soal Ujian 13 — Rakuraku Tokutei (2024年10月).',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-tipe2-nguyen1',
    name: 'Latsol Tipe 2 SSW PM — Đề 7 Thực Phẩm GINO1',
    sourcePdf: 'SSW NGUYEN 1.pdf',
    description: 'Paket latihan 40 soal SSW PM Tipe 2 (Đề 7 Thực Phẩm GINO1).',
    pointsPerQuestion: 3.75
  },
  {
    id: 'bonus-soal-1',
    name: 'Bonus Soal 1',
    sourcePdf: 'Bonus Soal 1.pdf',
    description: 'Paket latihan Bonus Soal 1 SSW PM.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'bonus-soal-2',
    name: 'Bonus Soal 2',
    sourcePdf: 'Bonus Soal 2.pdf',
    description: 'Paket latihan Bonus Soal 2 SSW PM.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'bonus-soal-4',
    name: 'Bonus Soal 4',
    sourcePdf: 'Bonus Soal 4.pdf',
    description: 'Paket latihan Bonus Soal 4 SSW PM.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'bonus-soal-5',
    name: 'Bonus Soal 5',
    sourcePdf: 'Bonus Soal 5.pdf',
    description: 'Paket latihan Bonus Soal 5 SSW PM.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'bonus-soal-6',
    name: 'Bonus Soal 6',
    sourcePdf: 'Bonus Soal 6.pdf',
    description: 'Paket latihan Bonus Soal 6 SSW PM.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'bonus-soal-7',
    name: 'Bonus Soal 7',
    sourcePdf: 'Bonus Soal 7.pdf',
    description: 'Paket latihan Bonus Soal 7 SSW PM.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'bonus-soal-8',
    name: 'Bonus Soal 8',
    sourcePdf: 'Bonus Soal 8.pdf',
    description: 'Paket latihan Bonus Soal 8 SSW PM.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'bonus-soal-9',
    name: 'Bonus Soal 9',
    sourcePdf: 'Bonus Soal 9.pdf',
    description: 'Paket latihan Bonus Soal 9 SSW PM.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'bonus-soal-10',
    name: 'Bonus Soal 10',
    sourcePdf: 'Bonus Soal 10.pdf',
    description: 'Paket latihan Bonus Soal 10 SSW PM.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-lab-bakteri',
    name: '細菌・微生物・食中毒 (Bacteria Lab)',
    sourcePdf: 'SSW_Bacteria_Lab.html',
    description: '32 soal spesialisasi sifat bakteri, karakteristik toksin vs spora, dan pencegahan keracunan makanan.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-lab-suhu',
    name: '保存温度・温度管理 (Temperature Lab)',
    sourcePdf: 'SSW_Temperature_Lab_Fixed_v2.html',
    description: '28 soal standar suhu penyimpanan bahan baku (室温, 15℃, 10℃, 8℃, 5℃, -15℃, -18℃).',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-lab-haccp',
    name: 'HACCP・衛生管理 (HACCP Principles)',
    sourcePdf: 'HACCP_SSW_quiz.html',
    description: '12 soal 7 prinsip HACCP, batas kritis (CL), monitoring, tindakan perbaikan, dan studi kasus.',
    pointsPerQuestion: 3.75
  },
  {
    id: 'ssw-pm-lab-alergen',
    name: 'アレルゲン・特定原材料 (Allergen Lab)',
    sourcePdf: 'latihan_alergen_jepang_v2.html',
    description: '20 soal 8 bahan wajib, 20 bahan anjuran, pencegahan kontaminasi silang, dan regulasi pelabelan.',
    pointsPerQuestion: 3.75
  }
];
if (Array.isArray(DEFAULT_PACKAGES)) {
  DEFAULT_PACKAGES.splice(0, DEFAULT_PACKAGES.length, ...BUILTIN_PACKAGES_META);
}

const view = $('#view');
const modalRoot = $('#modal-root');
const toastRoot = $('#toast-root');
const objectURLs = new Map();

const I18N = {
  id: {
    locale: 'id-ID',
    navHome: 'Beranda',
    navSetup: 'Mock Test',
    navBank: 'Bank Soal',
    navHistory: 'Riwayat',
    navStudy: 'Study List',
    studyPageDesc: 'Kumpulan soal yang ditandai selama ujian untuk dipelajari kembali.',
    studyAddTooltip: 'Tambahkan ke Study List',
    studyRemoveTooltip: 'Hapus dari Study List',
    studyAddedToast: 'Soal berhasil ditambahkan ke Study List.',
    studyRemovedToast: 'Soal dihapus dari Study List.',
    studyToggleAction: 'Toggle Study List',
    addSelStudy: 'Tambah ke Study List',
    studyEmptyTitle: 'Study List Masih Kosong',
    studyEmptyDesc: 'Tandai soal yang sulit saat ujian CBT dengan menekan tombol + di sebelah tombol F.',
    studyFilterAll: 'Semua Paket',
    studySearchPlaceholder: 'Cari soal (Jepang / Indonesia)…',
    studySortRecent: 'Terbaru Ditambahkan',
    studySortOldest: 'Terlama Ditambahkan',
    studySortNumber: 'Nomor Soal',
    studyDetail: 'Detail Soal',
    studyRemoveBtn: 'Hapus dari List',
    navBackup: 'Backup',
    pageExam: 'Layar Ujian SSW PM',
    pageResult: 'Hasil Ujian',
    pageReview: 'Review Jawaban',
    topAddQuestion: 'Tambah Soal',
    topStartExam: 'Mulai Ujian',
    storageOnline: 'Penyimpanan lokal',
    storageOffline: 'Offline lokal',
    sidebarTagline: 'Simulator Ujian SSW Pengolahan Makanan (食品製造)',
    // Home
    homeKicker: 'SSW PM MOCK TEST BY FAIZ · 特定技能1号・飲食料品製造業',
    homeTitle: 'Simulator Ujian SSW Pengolahan Makanan (食品製造)',
    homeDesc: 'Latihan mock test CBT untuk ujian keterampilan SSW 特定技能1号・飲食料品製造業 dengan dukungan furigana (ふりがな表示), pengaturan ukuran teks, layar penuh, dan penilaian otomatis.',
    homeStartBtn: 'Mulai Mock Test (40 Soal)',
    resumeTitle: 'Ada sesi Mock Test yang belum selesai',
    resumeRemaining: 'sisa waktu',
    resumeFlex: 'mode latihan fleksibel',
    resumeBtn: 'Lanjutkan Ujian',
    statTotalBank: 'Total Bank Soal',
    statReadyNote: 'soal aktif siap diujikan',
    statKunci1: 'Soal Ujian 1',
    statKunci1Note: 'CBTP Gino1 · 40 soal + furigana & ilustrasi',
    statPackages: 'Paket Soal SSW PM',
    statPackagesNote: 'Tersimpan di IndexedDB lokal',
    statHistory: 'Riwayat Ujian',
    statHistoryNote: 'Hasil & review jawaban tersimpan',
    pkgPanelTitle: 'Paket Bank Soal SSW PM (飲食料品製造業)',
    pkgPanelSub: 'Pilih paket soal untuk langsung memulai simulasi atau melihat daftar soal',
    pkgLabel: 'PAKET SOAL',
    pkgSource: 'Sumber',
    pkgWithImg: 'soal bergambar',
    pkgUnit: 'soal',
    pkgStartBtn: 'Mulai Ujian →',
    manageBankBtn: 'Kelola Bank Soal',
    configExamBtn: 'Konfigurasi Mock Test',
    modesPanelTitle: 'Mode Latihan & Simulasi',
    modesPanelSub: 'Sesuaikan mode pengerjaan dengan target belajar SSW PM Anda',
    qaFullTitle: 'Mock Test Penuh — Soal Ujian 1',
    qaFullSub: '40 soal CBTP Gino1 · Durasi 70 menit · Bobot 3,75 poin/soal',
    qaPracTitle: 'Mode Latihan Fleksibel',
    qaPracSub: 'Tanpa batas waktu · Bebas berpindah soal & atur ふりがな表示',
    qaCustTitle: 'Simulasi Kustom',
    qaCustSub: 'Pilih jumlah soal, durasi, paket soal, acak nomor & acak posisi opsi',
    qaBankTitle: 'Kelola & Tambah Soal SSW PM',
    qaBankSub: 'Edit teks Jepang, furigana ruby, ilustrasi, dan opsi A/B/C',
    qaBackupTitle: 'Backup & Restore Database',
    qaBackupSub: 'Ekspor/impor paket soal beserta gambar secara lokal (.zip / .json)',
    scoringNoticeTitle: 'Informasi Penilaian SSW PM',
    scoringNoticeBody: 'Setiap soal pada paket Soal Ujian 1 bernilai 3,75 poin (maksimum 150 poin untuk 40 soal). Hasil menampilkan jumlah benar dari 40 soal dan persentase mentah sebagai indikator utama evaluasi mandiri.',
    recentHistTitle: 'Riwayat Mock Test Terakhir',
    recentHistSub: 'Tersimpan secara lokal pada browser perangkat ini',
    viewAllHist: 'Lihat semua riwayat →',
    thDate: 'Tanggal',
    thPkgSim: 'Nama Paket / Simulasi',
    thMode: 'Mode',
    thCorrect: 'Benar',
    thPointScore: 'Skor Poin',
    thPercent: 'Persentase',
    thEmpty: 'Kosong',
    thTime: 'Waktu',
    thAction: 'Aksi',
    modePractice: 'Latihan',
    modeExam: 'Mock Test',
    btnResultReview: 'Hasil & Review',
    emptyHistTitle: 'Belum ada riwayat ujian',
    emptyHistSub: 'Setelah Anda menyelesaikan Mock Test, ringkasan nilai dan review jawaban akan tampil di sini.',
    // Setup
    setupKicker: 'PERSIAPAN UJIAN · 特定技能1号・飲食料品製造業',
    setupTitle: 'Mulai Mock Test SSW PM',
    setupDesc: 'Pilih mode ujian, paket soal, pengacakan soal/opsi, dan durasi pengerjaan sebelum memasuki layar simulasi CBT.',
    openBankBtn: 'Buka Bank Soal',
    setupFormTitle: 'Konfigurasi Ujian',
    setupFormSub: 'Pengaturan simulasi SSW PM Mock Test by Faiz',
    fieldMode: 'Mode Ujian',
    modeOptFull: 'Mock Test Penuh (40 Soal · Default 70 Menit)',
    modeOptPrac: 'Latihan Fleksibel (Tanpa Kewajiban Timer)',
    modeOptCust: 'Simulasi Kustom (Jumlah Soal & Durasi Bebas)',
    modeDescFull: 'Mock Test Penuh: mengambil seluruh 40 soal dari paket terpilih dengan durasi default 70 menit, timer berjalan otomatis, dan jawaban tersimpan otomatis.',
    modeDescPrac: 'Mode Latihan: mengerjakan soal secara fleksibel tanpa kewajiban timer, bebas berpindah antarsoal, dan dapat meninjau kembali jawaban kapan saja.',
    modeDescCust: 'Simulasi Kustom: tentukan sendiri jumlah soal, durasi waktu, paket sumber soal, urutan soal, maupun pengacakan posisi opsi jawaban.',
    fieldPackage: 'Paket Soal SSW PM',
    allPackagesOpt: 'Semua Paket Bank Soal SSW PM',
    fieldPkgHelp: 'Paket utama: Soal Ujian 1 — CBTP Gino1 (40 soal dari PDF).',
    fieldCandName: 'Nama Kandidat / Peserta',
    fieldCandNameHelp: 'Ditampilkan pada header layar ujian dan laporan hasil.',
    fieldCandPhoto: 'Foto Kandidat (Opsional)',
    fieldCandPhotoHelp: 'Ditampilkan pada lembar cetak hasil ujian.',
    fieldCount: 'Jumlah Soal',
    fieldCountHelpFull: 'Mock Test Penuh otomatis mengambil seluruh soal dalam paket.',
    fieldCountHelpCustom: 'Dapat disesuaikan pada mode Latihan atau Simulasi Kustom.',
    fieldDuration: 'Durasi Ujian (Menit)',
    fieldDurHelpPrac: 'Timer hitung mundur dinonaktifkan pada mode tanpa batas waktu.',
    fieldDurHelpTimed: 'Durasi default simulasi penuh adalah 70 menit (dapat diubah).',
    toggleRandomQTitle: 'Acak urutan nomor soal',
    toggleRandomQSub: 'Jika nonaktif, soal ditampilkan sesuai urutan asli nomor 1 sampai 40.',
    toggleShuffleOptTitle: 'Acak posisi opsi jawaban (A, B, C)',
    toggleShuffleOptSub: 'Mengacak urutan pilihan jawaban pada setiap soal agar latihan lebih efektif.',
    togglePracticeTitle: 'Nonaktifkan batas waktu (Mode Latihan Santai)',
    togglePracticeSub: 'Kerjakan soal tanpa hitung mundur waktu ujian.',
    startNowBtn: 'Mulai Ujian SSW PM Sekarang',
    sumOverline: 'RINGKASAN SIMULASI SSW PM',
    sumFieldField: 'Bidang Ujian',
    sumFieldMode: 'Mode',
    sumFieldDuration: 'Sisa Waktu / Durasi',
    sumFieldNoLimit: 'Tanpa Batas Waktu',
    sumFieldMinutes: 'Menit',
    sumFieldQOrder: 'Urutan Soal',
    sumOrderShuffled: 'Diacak',
    sumOrderOriginal: 'Urutan Asli (1–40)',
    sumFieldOptOrder: 'Posisi Opsi',
    sumOptShuffled: 'Diacak (A/B/C)',
    sumOptOriginal: 'Sesuai Sumber PDF',
    sumFieldWeight: 'Bobot Nilai',
    sumNavNoticeTitle: 'Navigasi Global 1–40',
    sumNavNoticeBody: 'Seluruh soal dapat dinavigasi secara bebas melalui kolom nomor di sisi kiri layar CBT. Gunakan tombol ▦ di kiri bawah untuk menampilkan/menyembunyikan daftar nomor soal secara permanen.',
    // Exam Screen (CBT)
    examQuestionLabel: 'Question',
    examSectionLabel: 'Section',
    examTimeRemaining: 'Time Remaining',
    examPracticeTime: 'Practice Time',
    examFinishBtn: 'Finish Exam',
    examTestLabel: 'Test',
    examCandidateLabel: 'Candidate',
    examBackBtn: 'Back',
    examNextBtn: 'Next',
    examSettingsTitle: 'Pengaturan Ujian (Ukuran Font, Furigana & Bahasa)',
    examToggleMapTitle: 'Sembunyikan / Tampilkan Daftar Nomor Soal',
    examFullscreenTitle: 'Layar Penuh / Full Screen (Shortcut: F)',
    examFlagTitle: 'Tandai Soal untuk Ditinjau',
    // Exam Settings Popover
    setPopoverTitle: 'Pengaturan Ujian (試験設定)',
    setFuriganaTitle: 'ふりがな表示 (Tampilkan Furigana)',
    setFuriganaSub: 'Tampilkan atau sembunyikan anotasi bacaan kanji pada soal & opsi',
    setLangTitle: 'Bahasa Interface (表示言語)',
    setQFontTitle: 'Ukuran Teks Soal',
    setAFontTitle: 'Ukuran Teks Jawaban',
    setFsTitle: 'Mode Layar Penuh (Full Screen)',
    setFsActive: 'Aktif (Layar Penuh)',
    setFsInactive: 'Nonaktif (Jendela Normal)',
    setFsHint: 'Tekan tombol F pada keyboard untuk masuk/keluar Full Screen, atau Esc untuk keluar.',
    setResetBtn: 'Reset Default',
    setDoneBtn: 'Tutup',
    // Finish Confirm Modal
    finishConfirmTitle: 'Konfirmasi Selesaikan Ujian',
    finishConfirmIntro: 'Apakah Anda yakin ingin menyelesaikan ujian sekarang? Periksa ringkasan pengerjaan Anda:',
    finishTotalQ: 'Jumlah Soal',
    finishAnswered: 'Sudah Dijawab',
    finishBlank: 'Belum Dijawab',
    finishWarnBlank: 'soal belum dijawab. Soal kosong akan dihitung salah/tidak dijawab.',
    finishAllDone: 'Seluruh soal telah dijawab.',
    btnCancel: 'Batal',
    // Result & Review
    resKicker: 'HASIL MOCK TEST SSW PM · 特定技能1号・飲食料品製造業',
    resTitle: 'Ringkasan Hasil & Review Jawaban',
    btnPrint: 'Cetak Hasil',
    btnExportJson: 'Ekspor JSON',
    btnNextExam: 'Mock Test Berikutnya →',
    resCorrectLabel: 'JAWABAN BENAR',
    resTotalQ: 'Total Soal',
    resCorrectAns: 'Jawaban Benar',
    resWrongAns: 'Jawaban Salah',
    resUnanswered: 'Tidak Dijawab',
    resPercent: 'Persentase Benar',
    resWeighted: 'Skor Bobot (×3,75)',
    resElapsed: 'Waktu Pengerjaan',
    resStatus: 'Status',
    statusCompleted: 'Selesai',
    statusTimeUp: 'Waktu Habis',
    revFilterLabel: 'Daftar Review Seluruh Soal',
    revFilterAll: 'Semua Soal',
    revFilterWrong: 'Jawaban Salah',
    revFilterBlank: 'Tidak Dijawab',
    revFilterCorrect: 'Jawaban Benar',
    revTagBlank: 'Tidak Dijawab',
    revTagCorrect: 'Benar (+3,75)',
    revTagWrong: 'Salah (0)',
    revMarkUserCorrect: '✓ Jawaban Anda & Kunci Benar',
    revMarkKey: '✓ Kunci Jawaban Benar',
    revMarkUserWrong: '✗ Jawaban Anda',
    furiShowTitle: 'Tampilkan Furigana',
    furiHideTitle: 'Sembunyikan Furigana',
    transShowTitle: 'Tampilkan Terjemahan Indonesia',
    transHideTitle: 'Sembunyikan Terjemahan Indonesia',
    histKicker: 'ARSIP EVALUASI',
    unitSessions: 'sesi',
    unitPackages: 'paket',
    thPkg: 'Paket',
    thAccuracy: 'Akurasi',
    btnReview: 'Review',
    btnDelete: 'Hapus',
    emptyHistTitle: 'Belum ada rekaman ujian.',
    emptyHistSub: 'Selesaikan satu sesi Mock Test untuk mulai melihat tren skor.',
    backupKicker: 'DATA & PREFERENSI',
    backupTitle: 'Backup & Pengaturan',
    backupSecBackup: 'Cadangan & Pemulihan Data',
    backupExportTitle: 'Ekspor Database',
    backupExportDesc: 'Simpan seluruh bank soal, furigana, ilustrasi gambar, dan riwayat ujian ke penyimpanan perangkat.',
    backupBtnZip: 'Unduh Arsip (.zip)',
    backupBtnJson: 'Ekspor JSON (.json)',
    backupRestoreTitle: 'Pulihkan atau Impor Paket',
    backupRestoreDesc: 'Pilih berkas .zip atau .json untuk memulihkan cadangan atau menambahkan paket soal.',
    backupBtnChooseFile: 'Pilih Berkas (.zip / .json)',
    backupStatusNoFile: 'Belum ada berkas dipilih.',
    backupSecPrefs: 'Preferensi Standar',
    backupFieldDuration: 'Durasi Standar Mock Test (Menit)',
    backupFieldCount: 'Jumlah Soal Standar',
    backupToggleResume: 'Lanjutkan sesi otomatis setelah halaman dimuat ulang',
    backupToggleFurigana: 'Tampilkan furigana (ふりがな) secara bawaan',
    backupBtnSave: 'Simpan Preferensi',
    backupBtnReset: 'Reset & Muat Ulang Paket Bawaan',
    studyKicker: 'DAFTAR BELAJAR',
    studyMetaCount: 'soal tersimpan',
    studyAddedDate: 'Ditambahkan:',
    studyCorrectKey: '✓ Kunci',
    studyPromptTransLabel: 'Terjemahan Pertanyaan:',
    studyExplanationLabel: 'Pembahasan:',
    studyTransMissing: 'Terjemahan belum tersedia',
    studyNoMatchFilter: 'Tidak ada soal yang cocok dengan filter atau kata kunci pencarian.',
    studyResetFilterBtn: 'Reset Filter',
    btnClose: 'Tutup',
    reviewSectionTitle: 'Tinjauan Jawaban',
    reviewSelectedLabel: 'Pilihan:',
    reviewKeyLabel: 'Kunci:',
    reviewTagCorrect: 'Benar',
    reviewTagWrong: 'Salah',
    reviewTagBlank: 'Kosong',
    reviewPhotoChange: 'Ubah Foto Kandidat pada Report',
    reviewPhotoAdd: 'Tambahkan Foto Kandidat pada Report (Opsional)',
    reviewTransMissing: 'Terjemahan belum tersedia.',
    revKeySource: 'Informasi Kunci & Sumber',
    bankKicker: 'PUSTAKA & EDITOR SOAL',
    resultKicker: 'HASIL EVALUASI',
    resultNotFound: 'Hasil ujian tidak ditemukan.',
    reviewNoMatchFilter: 'Tidak ada soal pada filter ini.',
    setupPickerEmpty: 'Tidak ada soal aktif pada paket ini.',
    setupPickerDefault: 'Mengikuti jumlah soal paket',
    setupPickerSelected: 'soal dipilih'
  },
  en: {
    locale: 'en-US',
    navHome: 'Home',
    navSetup: 'Mock Test',
    navBank: 'Question Bank',
    navHistory: 'History',
    navBackup: 'Backup',
    pageExam: 'SSW PM Exam Screen',
    pageResult: 'Exam Result',
    pageReview: 'Answer Review',
    topAddQuestion: 'Add Question',
    topStartExam: 'Start Exam',
    storageOnline: 'Local storage',
    storageOffline: 'Offline local',
    sidebarTagline: 'SSW Food Manufacturing Exam Simulator (食品製造)',
    // Home
    homeKicker: 'SSW PM MOCK TEST BY FAIZ · 特定技能1号・飲食料品製造業',
    homeTitle: 'SSW Food Manufacturing Exam Simulator (食品製造)',
    homeDesc: 'CBT mock test simulator for SSW 特定技能1号・飲食料品製造業 with furigana toggle (ふりがな表示), adjustable font sizes, full screen mode, and automated grading.',
    homeStartBtn: 'Start Mock Test (40 Questions)',
    resumeTitle: 'Unfinished Mock Test Session Found',
    resumeRemaining: 'time left',
    resumeFlex: 'flexible practice mode',
    resumeBtn: 'Resume Exam',
    statTotalBank: 'Total Question Bank',
    statReadyNote: 'active questions ready',
    statKunci1: 'Soal Ujian 1',
    statKunci1Note: 'CBTP Gino1 · 40 questions + furigana & images',
    statPackages: 'SSW PM Question Sets',
    statPackagesNote: 'Stored in local IndexedDB',
    statHistory: 'Exam History',
    statHistoryNote: 'Saved results & answer reviews',
    pkgPanelTitle: 'SSW PM Question Sets (飲食料品製造業)',
    pkgPanelSub: 'Select a question set to start a simulation or browse questions',
    pkgLabel: 'QUESTION SETS',
    pkgSource: 'Source',
    pkgWithImg: 'illustrated questions',
    pkgUnit: 'questions',
    pkgStartBtn: 'Start Exam →',
    manageBankBtn: 'Manage Question Bank',
    configExamBtn: 'Configure Mock Test',
    modesPanelTitle: 'Practice & Simulation Modes',
    modesPanelSub: 'Tailor the test experience to your SSW PM study goals',
    qaFullTitle: 'Full Mock Test — Soal Ujian 1',
    qaFullSub: '40 CBTP Gino1 questions · 70 minutes · 3.75 pts/question',
    qaPracTitle: 'Flexible Practice Mode',
    qaPracSub: 'Untimed · Jump freely & toggle ふりがな表示 anytime',
    qaCustTitle: 'Custom Simulation',
    qaCustSub: 'Customize question count, timer, shuffle order & shuffle options',
    qaBankTitle: 'Manage & Add SSW PM Questions',
    qaBankSub: 'Edit Japanese text, ruby furigana, illustrations, and options',
    qaBackupTitle: 'Backup & Restore Database',
    qaBackupSub: 'Export/import question sets and images locally (.zip / .json)',
    scoringNoticeTitle: 'SSW PM Scoring Information',
    scoringNoticeBody: 'Each question in Soal Ujian 1 carries 3.75 points (maximum 150 points for 40 questions). Results show raw correct answers out of 40 and percentage as the primary self-evaluation metric.',
    recentHistTitle: 'Recent Mock Test History',
    recentHistSub: 'Stored locally in your browser on this device',
    viewAllHist: 'View all history →',
    thDate: 'Date',
    thPkgSim: 'Package / Simulation',
    thMode: 'Mode',
    thCorrect: 'Correct',
    thPointScore: 'Points',
    thPercent: 'Percentage',
    thEmpty: 'Blank',
    thTime: 'Time',
    thAction: 'Action',
    modePractice: 'Practice',
    modeExam: 'Mock Test',
    btnResultReview: 'Result & Review',
    emptyHistTitle: 'No exam history yet',
    emptyHistSub: 'Complete a Mock Test session to view your score summary and detailed answer review here.',
    // Setup
    setupKicker: 'EXAM PREPARATION · 特定技能1号・飲食料品製造業',
    setupTitle: 'Start SSW PM Mock Test',
    setupDesc: 'Choose exam mode, question package, question/option shuffling, and duration before launching the CBT simulator.',
    openBankBtn: 'Open Question Bank',
    setupFormTitle: 'Exam Configuration',
    setupFormSub: 'SSW PM Mock Test by Faiz simulation settings',
    fieldMode: 'Exam Mode',
    modeOptFull: 'Full Mock Test (40 Questions · Default 70 Mins)',
    modeOptPrac: 'Flexible Practice (Untimed Mode)',
    modeOptCust: 'Custom Simulation (Custom Count & Timer)',
    modeDescFull: 'Full Mock Test: takes all 40 questions from the selected package with a 70-minute countdown timer and automatic answer saving.',
    modeDescPrac: 'Practice Mode: answer questions at your own pace without a timer requirement and review answers freely.',
    modeDescCust: 'Custom Simulation: choose your own question count, duration, question set, question order, and option shuffling.',
    fieldPackage: 'SSW PM Question Package',
    allPackagesOpt: 'All SSW PM Question Sets',
    fieldPkgHelp: 'Primary set: Soal Ujian 1 — CBTP Gino1 (40 questions from PDF).',
    fieldCandName: 'Candidate Name',
    fieldCandNameHelp: 'Displayed on the CBT exam header and printable result report.',
    fieldCandPhoto: 'Candidate Photo (Optional)',
    fieldCandPhotoHelp: 'Displayed on the printable result sheet.',
    fieldCount: 'Number of Questions',
    fieldCountHelpFull: 'Full Mock Test automatically includes all questions in the set.',
    fieldCountHelpCustom: 'Customizable in Practice or Custom Simulation mode.',
    fieldDuration: 'Exam Duration (Minutes)',
    fieldDurHelpPrac: 'Countdown timer is disabled in untimed practice mode.',
    fieldDurHelpTimed: 'Default full simulation duration is 70 minutes (adjustable).',
    toggleRandomQTitle: 'Shuffle question order',
    toggleRandomQSub: 'When off, questions appear in their original order (1 to 40).',
    toggleShuffleOptTitle: 'Shuffle option positions (A, B, C)',
    toggleShuffleOptSub: 'Randomizes the order of answer choices within each question.',
    togglePracticeTitle: 'Disable time limit (Relaxed Practice Mode)',
    togglePracticeSub: 'Work through questions without a countdown timer.',
    startNowBtn: 'Start SSW PM Exam Now',
    sumOverline: 'SSW PM SIMULATION SUMMARY',
    sumFieldField: 'Exam Field',
    sumFieldMode: 'Mode',
    sumFieldDuration: 'Duration',
    sumFieldNoLimit: 'No Time Limit',
    sumFieldMinutes: 'Minutes',
    sumFieldQOrder: 'Question Order',
    sumOrderShuffled: 'Shuffled',
    sumOrderOriginal: 'Original Order (1–40)',
    sumFieldOptOrder: 'Option Order',
    sumOptShuffled: 'Shuffled (A/B/C)',
    sumOptOriginal: 'Original PDF Order',
    sumFieldWeight: 'Scoring Weight',
    sumNavNoticeTitle: 'Global Navigation 1–40',
    sumNavNoticeBody: 'Navigate freely across all questions using the left number column. Click the ▦ icon in the bottom-left bar to persistently hide or show the question list.',
    // Exam Screen (CBT)
    examQuestionLabel: 'Question',
    examSectionLabel: 'Section',
    examTimeRemaining: 'Time Remaining',
    examPracticeTime: 'Practice Time',
    examFinishBtn: 'Finish Section',
    examTestLabel: 'Test',
    examCandidateLabel: 'Candidate',
    examBackBtn: 'Back',
    examNextBtn: 'Next',
    examSettingsTitle: 'Exam Settings (Font Size, Furigana & Language)',
    examToggleMapTitle: 'Hide / Show Question Number List',
    examFullscreenTitle: 'Toggle Full Screen (Shortcut: F)',
    examFlagTitle: 'Flag Question for Review',
    // Exam Settings Popover
    setPopoverTitle: 'Exam Settings (試験設定)',
    setFuriganaTitle: 'ふりがな表示 (Show Furigana)',
    setFuriganaSub: 'Show or hide kanji reading annotations on questions & choices',
    setLangTitle: 'Interface Language (表示言語)',
    setQFontTitle: 'Question Text Size',
    setAFontTitle: 'Answer Text Size',
    setFsTitle: 'Full Screen Mode',
    setFsActive: 'Active (Full Screen)',
    setFsInactive: 'Inactive (Windowed)',
    setFsHint: 'Press F on your keyboard to toggle Full Screen, or Esc to exit.',
    setResetBtn: 'Reset Defaults',
    setDoneBtn: 'Close',
    // Finish Confirm Modal
    finishConfirmTitle: 'Confirm Finish Exam',
    finishConfirmIntro: 'Are you sure you want to finish the exam now? Review your progress summary:',
    finishTotalQ: 'Total Questions',
    finishAnswered: 'Answered',
    finishBlank: 'Unanswered',
    finishWarnBlank: 'questions are still unanswered. Blank questions count as incorrect.',
    finishAllDone: 'All questions have been answered.',
    btnCancel: 'Cancel',
    // Result & Review
    resKicker: 'SSW PM MOCK TEST RESULT · 特定技能1号・飲食料品製造業',
    resTitle: 'Score Summary & Answer Review',
    btnPrint: 'Print Result',
    btnExportJson: 'Export JSON',
    btnNextExam: 'Next Mock Test →',
    resCorrectLabel: 'CORRECT ANSWERS',
    resTotalQ: 'Total Questions',
    resCorrectAns: 'Correct Answers',
    resWrongAns: 'Wrong Answers',
    resUnanswered: 'Unanswered',
    resPercent: 'Accuracy',
    resWeighted: 'Weighted Score (×3.75)',
    resElapsed: 'Elapsed Time',
    resStatus: 'Status',
    statusCompleted: 'Completed',
    statusTimeUp: 'Time Up',
    revFilterLabel: 'Review All Questions',
    revFilterAll: 'All Questions',
    revFilterWrong: 'Wrong Answers',
    revFilterBlank: 'Unanswered',
    revFilterCorrect: 'Correct Answers',
    revTagBlank: 'Unanswered',
    revTagCorrect: 'Correct (+3.75)',
    revTagWrong: 'Wrong (0)',
    revMarkUserCorrect: '✓ Your Answer & Correct Key',
    revMarkKey: '✓ Correct Answer Key',
    revMarkUserWrong: '✗ Your Answer',
    navStudy: 'Study List',
    studyPageDesc: 'Questions marked during CBT exams for deeper review and practice.',
    studyAddTooltip: 'Add to Study List',
    studyRemoveTooltip: 'Remove from Study List',
    studyAddedToast: 'Question added to Study List.',
    studyRemovedToast: 'Question removed from Study List.',
    studyEmptyTitle: 'Study List is Empty',
    studyEmptyDesc: 'Mark challenging questions during CBT exams or review by clicking the + button.',
    studyFilterAll: 'All Packages',
    studySearchPlaceholder: 'Search questions (Japanese / translation)…',
    studySortRecent: 'Recently Added',
    studySortOldest: 'Oldest Added',
    studySortNumber: 'Question Number',
    studyDetail: 'Question Detail',
    studyRemoveBtn: 'Remove from List',
    furiShowTitle: 'Show Furigana',
    furiHideTitle: 'Hide Furigana',
    transShowTitle: 'Show Indonesian Translation',
    transHideTitle: 'Hide Indonesian Translation',
    histKicker: 'EVALUATION ARCHIVE',
    unitSessions: 'sessions',
    unitPackages: 'packages',
    thPkg: 'Package',
    thAccuracy: 'Accuracy',
    btnReview: 'Review',
    btnDelete: 'Delete',
    emptyHistTitle: 'No examination records yet.',
    emptyHistSub: 'Complete a Mock Test session to view score trends and progress.',
    backupKicker: 'DATA & PREFERENCES',
    backupTitle: 'Backup & Settings',
    backupSecBackup: 'Data Backup & Restore',
    backupExportTitle: 'Export Database',
    backupExportDesc: 'Save the entire question bank, furigana, illustrations, and exam history to local storage.',
    backupBtnZip: 'Download Archive (.zip)',
    backupBtnJson: 'Export JSON (.json)',
    backupRestoreTitle: 'Restore or Import Packages',
    backupRestoreDesc: 'Choose a .zip or .json file to restore backups or add question packages.',
    backupBtnChooseFile: 'Choose File (.zip / .json)',
    backupStatusNoFile: 'No file selected.',
    backupSecPrefs: 'Standard Preferences',
    backupFieldDuration: 'Standard Mock Test Duration (Minutes)',
    backupFieldCount: 'Standard Question Count',
    backupToggleResume: 'Automatically resume session after page reload',
    backupToggleFurigana: 'Show furigana (ふりがな) by default',
    backupBtnSave: 'Save Preferences',
    backupBtnReset: 'Reset & Reload Built-in Sets',
    studyKicker: 'STUDY LIST',
    studyMetaCount: 'saved questions',
    studyAddedDate: 'Added:',
    studyCorrectKey: '✓ Key',
    studyPromptTransLabel: 'Question Translation:',
    studyExplanationLabel: 'Explanation:',
    studyTransMissing: 'Translation not available',
    studyNoMatchFilter: 'No questions match the current filter or search keyword.',
    studyResetFilterBtn: 'Reset Filter',
    btnClose: 'Close',
    reviewSectionTitle: 'Answer Review',
    reviewSelectedLabel: 'Selected:',
    reviewKeyLabel: 'Key:',
    reviewTagCorrect: 'Correct',
    reviewTagWrong: 'Incorrect',
    reviewTagBlank: 'Unanswered',
    reviewPhotoChange: 'Change Candidate Photo on Report',
    reviewPhotoAdd: 'Add Candidate Photo to Report (Optional)',
    reviewTransMissing: 'Translation not available.',
    revKeySource: 'Answer Key & Source Info',
    bankKicker: 'QUESTION LIBRARY & EDITOR',
    resultKicker: 'EVALUATION RESULTS',
    resultNotFound: 'Exam result not found.',
    reviewNoMatchFilter: 'No questions match this filter.',
    setupPickerEmpty: 'No active questions in this package.',
    setupPickerDefault: 'Default to package question count',
    setupPickerSelected: 'questions selected'
  },
  ja: {
    locale: 'ja-JP',
    navHome: 'ホーム',
    navSetup: '模擬試験',
    navBank: '問題バンク',
    navHistory: '履歴',
    navStudy: '学習リスト',
    studyPageDesc: 'CBT模擬試験中に後で復習したい問題としてブックマークした問題一覧です。',
    studyAddTooltip: '学習リストに追加',
    studyRemoveTooltip: '学習リストから削除',
    studyAddedToast: '問題を学習リストに追加しました。',
    studyRemovedToast: '問題を学習リストから削除しました。',
    studyToggleAction: '学習リスト切り替え',
    addSelStudy: '学習リストに追加',
    studyEmptyTitle: '学習リストは空です',
    studyEmptyDesc: 'CBT試験中に「F」ボタン横の「+」を押すと、ここに問題を保存して復習できます。',
    studyFilterAll: 'すべての問題集',
    studySearchPlaceholder: '問題を検索（日本語 / インドネシア語）…',
    studySortRecent: '最近追加された順',
    studySortOldest: '最初に追加された順',
    studySortNumber: '問題番号順',
    studyDetail: '問題詳細',
    studyRemoveBtn: 'リストから削除',
    navBackup: 'バックアップ',
    pageExam: 'SSW PM 試験画面',
    pageResult: '試験結果',
    pageReview: '解答レビュー',
    topAddQuestion: '問題追加',
    topStartExam: '試験開始',
    storageOnline: 'ローカル保存',
    storageOffline: 'オフライン保存',
    sidebarTagline: '特定技能1号・飲食料品製造業 模擬試験シミュレーター',
    // Home
    homeKicker: 'SSW PM MOCK TEST BY FAIZ · 特定技能1号・飲食料品製造業',
    homeTitle: '特定技能1号・飲食料品製造業（食品製造）模擬試験',
    homeDesc: '特定技能1号（飲食料品製造業）のCBT模擬試験シミュレーターです。ふりがな表示切替、文字サイズ調整、全画面表示、自動採点に対応しています。',
    homeStartBtn: '模擬試験を開始（40問）',
    resumeTitle: '未完了の模擬試験セッションがあります',
    resumeRemaining: '残り時間',
    resumeFlex: '時間制限なし練習モード',
    resumeBtn: '試験を再開する',
    statTotalBank: '総問題数',
    statReadyNote: '問が出題可能',
    statKunci1: 'Soal Ujian 1',
    statKunci1Note: 'CBTP Gino1 · 全40問（ふりがな・イラスト付）',
    statPackages: '問題パッケージ数',
    statPackagesNote: 'IndexedDBにローカル保存',
    statHistory: '受験履歴',
    statHistoryNote: '採点結果と解答レビュー',
    pkgPanelTitle: 'SSW PM 問題パッケージ（飲食料品製造業）',
    pkgPanelSub: 'パッケージを選択して模擬試験を開始、または問題一覧を確認できます',
    pkgLabel: '問題セット',
    pkgSource: '出典',
    pkgWithImg: '問イラスト付',
    pkgUnit: '問',
    pkgStartBtn: '試験開始 →',
    manageBankBtn: '問題バンク管理',
    configExamBtn: '試験設定へ',
    modesPanelTitle: '練習・模擬試験モード',
    modesPanelSub: '学習目的に合わせて出題モードを選択してください',
    qaFullTitle: '本番形式模擬試験 — Soal Ujian 1',
    qaFullSub: '全40問 · 制限時間70分 · 1問3.75点（150点満点）',
    qaPracTitle: 'フリー練習モード',
    qaPracSub: '時間制限なし · 自由な問題移動＆ふりがな表示切替',
    qaCustTitle: 'カスタム模擬試験',
    qaCustSub: '問題数・時間・問題順シャッフル・選択肢シャッフルを設定',
    qaBankTitle: '問題の追加・編集',
    qaBankSub: '日本語問題文、ルビ（ふりがな）、画像、選択肢A/B/Cを編集',
    qaBackupTitle: 'バックアップと復元',
    qaBackupSub: '問題データと画像をZIP / JSON形式で保存・復元',
    scoringNoticeTitle: '採点について',
    scoringNoticeBody: 'Soal Ujian 1は1問3.75点（40問で150点満点）です。結果画面では40問中の正解数と正答率（％）をメイン指標として表示します。',
    recentHistTitle: '最近の受験履歴',
    recentHistSub: 'このブラウザにローカル保存されています',
    viewAllHist: 'すべての履歴を見る →',
    thDate: '日時',
    thPkgSim: 'パッケージ / 試験名',
    thMode: 'モード',
    thCorrect: '正解数',
    thPointScore: '得点',
    thPercent: '正答率',
    thEmpty: '未回答',
    thTime: '所要時間',
    thAction: '操作',
    modePractice: '練習',
    modeExam: '模擬試験',
    btnResultReview: '結果・見直し',
    emptyHistTitle: '受験履歴はまだありません',
    emptyHistSub: '模擬試験を完了すると、ここに得点と解答レビューが表示されます。',
    // Setup
    setupKicker: '試験準備 · 特定技能1号・飲食料品製造業',
    setupTitle: 'SSW PM 模擬試験の設定',
    setupDesc: 'CBT試験画面に入る前に、試験モード・問題セット・シャッフル設定・制限時間を選択してください。',
    openBankBtn: '問題バンクを開く',
    setupFormTitle: '試験コンフィギュレーション',
    setupFormSub: 'SSW PM Mock Test by Faiz シミュレーション設定',
    fieldMode: '試験モード',
    modeOptFull: '本番形式模擬試験（全40問・標準70分）',
    modeOptPrac: 'フリー練習モード（時間制限なし）',
    modeOptCust: 'カスタム試験（問題数・時間を自由に設定）',
    modeDescFull: '本番形式模擬試験：選択したセットから全40問を出題し、70分のカウントダウンタイマーと自動保存が有効になります。',
    modeDescPrac: 'フリー練習モード：時間制限なしで自由に問題を解き、いつでも見直しができます。',
    modeDescCust: 'カスタム試験：問題数、制限時間、問題順序のシャッフル、選択肢の並び順シャッフルを自由に設定できます。',
    fieldPackage: '出題パッケージ',
    allPackagesOpt: 'すべてのSSW PM問題セット',
    fieldPkgHelp: 'メインセット：Soal Ujian 1 — CBTP Gino1（PDF全40問）。',
    fieldCandName: '受験者名（任意）',
    fieldCandNameHelp: '試験画面上部および結果レポートに表示されます。',
    fieldCandPhoto: '受験者写真（任意）',
    fieldCandPhotoHelp: '印刷用結果レポートに表示されます。',
    fieldCount: '出題数',
    fieldCountHelpFull: '本番形式ではパッケージ内の全問題が出題されます。',
    fieldCountHelpCustom: '練習モード・カスタム試験で変更可能です。',
    fieldDuration: '制限時間（分）',
    fieldDurHelpPrac: '時間制限なしモードではタイマーは無効になります。',
    fieldDurHelpTimed: '標準の制限時間は70分です（変更可能）。',
    toggleRandomQTitle: '問題順序をランダムにする',
    toggleRandomQSub: 'オフの場合、1番から40番まで順番通りに出題されます。',
    toggleShuffleOptTitle: '選択肢の並び順をシャッフルする',
    toggleShuffleOptSub: '各問題の選択肢（A, B, C）の位置をランダムに入れ替えます。',
    togglePracticeTitle: '制限時間を無効にする（練習モード）',
    togglePracticeSub: 'カウントダウンなしでじっくり問題を解くことができます。',
    startNowBtn: 'SSW PM 模擬試験を開始する',
    sumOverline: 'SSW PM 試験概要',
    sumFieldField: '試験区分',
    sumFieldMode: 'モード',
    sumFieldDuration: '制限時間',
    sumFieldNoLimit: '制限時間なし',
    sumFieldMinutes: '分',
    sumFieldQOrder: '問題順序',
    sumOrderShuffled: 'シャッフル',
    sumOrderOriginal: '順番通り（1〜40）',
    sumFieldOptOrder: '選択肢の位置',
    sumOptShuffled: 'シャッフル',
    sumOptOriginal: '元の順序',
    sumFieldWeight: '配点',
    sumNavNoticeTitle: '全問自由ナビゲーション（1〜40）',
    sumNavNoticeBody: '左側の問題番号リストから1〜40問へ自由に移動できます。左下の「▦」アイコンを押すと、再度クリックするまで問題番号リストを非表示に保てます。',
    // Exam Screen (CBT)
    examQuestionLabel: 'Question',
    examSectionLabel: 'Section',
    examTimeRemaining: '残り時間',
    examPracticeTime: '経過時間',
    examFinishBtn: '試験終了',
    examTestLabel: 'Test',
    examCandidateLabel: 'Candidate',
    examBackBtn: '前へ',
    examNextBtn: '次へ',
    examSettingsTitle: '試験設定（文字サイズ・ふりがな・言語）',
    examToggleMapTitle: '問題番号リストの表示 / 非表示',
    examFullscreenTitle: '全画面モード切替（ショートカット: F）',
    examFlagTitle: '後で見直すためにフラグを付ける',
    // Exam Settings Popover
    setPopoverTitle: '試験設定 (Exam Settings)',
    setFuriganaTitle: 'ふりがな表示',
    setFuriganaSub: '問題文および選択肢の漢字ルビ（ふりがな）を表示／非表示にします',
    setLangTitle: '表示言語 (Interface Language)',
    setQFontTitle: '問題文の文字サイズ',
    setAFontTitle: '選択肢の文字サイズ',
    setFsTitle: '全画面表示 (Full Screen)',
    setFsActive: '有効（全画面）',
    setFsInactive: '無効（通常ウィンドウ）',
    setFsHint: 'キーボードの F キーで全画面切替、Esc キーで解除できます。',
    setResetBtn: '初期値に戻す',
    setDoneBtn: '閉じる',
    // Finish Confirm Modal
    finishConfirmTitle: '試験終了の確認',
    finishConfirmIntro: '試験を終了して採点しますか？現在の回答状況を確認してください：',
    finishTotalQ: '総問題数',
    finishAnswered: '回答済み',
    finishBlank: '未回答',
    finishWarnBlank: '問が未回答です。未回答の問題は不正解として扱われます。',
    finishAllDone: 'すべての問題に回答済みです。',
    btnCancel: 'キャンセル',
    // Result & Review
    resKicker: 'SSW PM 模擬試験結果 · 特定技能1号・飲食料品製造業',
    resTitle: '採点結果と解答レビュー',
    btnPrint: '結果を印刷',
    btnExportJson: 'JSON出力',
    btnNextExam: '次の模擬試験へ →',
    resCorrectLabel: '正解数',
    resTotalQ: '総問題数',
    resCorrectAns: '正解数',
    resWrongAns: '不正解数',
    resUnanswered: '未回答数',
    resPercent: '正答率',
    resWeighted: '換算得点 (×3.75)',
    resElapsed: '所要時間',
    resStatus: 'ステータス',
    statusCompleted: '完了',
    statusTimeUp: '時間切れ',
    revFilterLabel: '解答レビュー一覧',
    revFilterAll: 'すべての問題',
    revFilterWrong: '不正解のみ',
    revFilterBlank: '未回答のみ',
    revFilterCorrect: '正解のみ',
    revTagBlank: '未回答',
    revTagCorrect: '正解 (+3.75)',
    revTagWrong: '不正解 (0)',
    revMarkUserCorrect: '✓ あなたの回答（正解）',
    revMarkKey: '✓ 正解の選択肢',
    revMarkUserWrong: '✗ あなたの回答',
    furiShowTitle: 'ふりがなを表示',
    furiHideTitle: 'ふりがなを非表示',
    transShowTitle: 'インドネシア語訳を表示',
    transHideTitle: 'インドネシア語訳を非表示',
    histKicker: '評価アーカイブ',
    unitSessions: '件',
    unitPackages: 'パッケージ',
    thPkg: 'パッケージ',
    thAccuracy: '正答率',
    btnReview: '詳細',
    btnDelete: '削除',
    emptyHistTitle: '試験履歴はまだありません。',
    emptyHistSub: '模擬試験を完了すると、ここにスコア履歴が表示されます。',
    backupKicker: 'データ＆設定',
    backupTitle: 'バックアップと設定',
    backupSecBackup: 'データのバックアップと復元',
    backupExportTitle: 'データベース出力',
    backupExportDesc: '問題バンク、ふりがな、画像、試験履歴を端末に保存します。',
    backupBtnZip: 'ZIPアーカイブ保存 (.zip)',
    backupBtnJson: 'JSON出力 (.json)',
    backupRestoreTitle: 'バックアップ復元・パッケージ追加',
    backupRestoreDesc: '.zip または .json ファイルを選択してデータを復元または追加します。',
    backupBtnChooseFile: 'ファイルを選択 (.zip / .json)',
    backupStatusNoFile: 'ファイル未選択',
    backupSecPrefs: '基本設定',
    backupFieldDuration: '模擬試験の標準時間（分）',
    backupFieldCount: '標準問題数',
    backupToggleResume: 'ページ再読み込み後にセッションを自動再開',
    backupToggleFurigana: 'ふりがなをデフォルトで表示する',
    backupBtnSave: '設定を保存',
    backupBtnReset: '初期データをリセット＆再読込',
    studyKicker: '学習リスト',
    studyMetaCount: '問保存',
    studyAddedDate: '追加日:',
    studyCorrectKey: '✓ 正解',
    studyPromptTransLabel: '問題の翻訳:',
    studyExplanationLabel: '解説:',
    studyTransMissing: '翻訳がまだありません',
    studyNoMatchFilter: 'フィルターまたは検索キーワードに一致する問題がありません。',
    studyResetFilterBtn: 'フィルターをリセット',
    btnClose: '閉じる',
    reviewSectionTitle: '解答の確認',
    reviewSelectedLabel: 'あなたの回答:',
    reviewKeyLabel: '正解:',
    reviewTagCorrect: '正解',
    reviewTagWrong: '不正解',
    reviewTagBlank: '未回答',
    reviewPhotoChange: '証明写真を変更',
    reviewPhotoAdd: '証明写真を追加（任意）',
    reviewTransMissing: '翻訳がまだありません。',
    revKeySource: '正解・出典情報',
    bankKicker: '問題ライブラリ＆エディタ',
    resultKicker: '評価結果',
    resultNotFound: '試験結果が見つかりません。',
    reviewNoMatchFilter: 'このフィルターに一致する問題はありません。',
    setupPickerEmpty: 'このパッケージに有効な問題がありません。',
    setupPickerDefault: 'パッケージの問題数に従う',
    setupPickerSelected: '問選択中'
  }
};

function loadLang() {
  try {
    const saved = localStorage.getItem('sswPmLang');
    if (saved && I18N[saved]) return saved;
  } catch {}
  return 'id';
}

function saveLang(lang) {
  try {
    localStorage.setItem('sswPmLang', lang);
  } catch {}
}

function loadMapHidden() {
  try {
    return localStorage.getItem('sswPmMapHidden') === 'true';
  } catch {
    return false;
  }
}

function saveMapHidden(hidden) {
  try {
    localStorage.setItem('sswPmMapHidden', String(Boolean(hidden)));
  } catch {}
}

const DEFAULT_EXAM_PREFS = {
  showFurigana: true,
  questionFontSize: 22,
  answerFontSize: 17
};

function loadExamPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem('sswPmExamPrefs') || 'null');
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_EXAM_PREFS };
    return {
      showFurigana: raw.showFurigana !== false,
      questionFontSize: Math.min(36, Math.max(18, Number(raw.questionFontSize) || DEFAULT_EXAM_PREFS.questionFontSize)),
      answerFontSize: Math.min(30, Math.max(16, Number(raw.answerFontSize) || DEFAULT_EXAM_PREFS.answerFontSize))
    };
  } catch {
    return { ...DEFAULT_EXAM_PREFS };
  }
}

function saveExamPrefs(prefs) {
  try {
    localStorage.setItem('sswPmExamPrefs', JSON.stringify(prefs));
  } catch (err) {
    console.warn('Gagal menyimpan preferensi layar ujian:', err);
  }
}

const EXAM_SHORTCUTS_STORAGE_KEY = 'sswPmExamShortcuts';
const EXAM_SHORTCUTS_VERSION = 2;

const DEFAULT_SHORTCUTS_V1 = Object.freeze({
  nextQuestion: 'ArrowRight',
  prevQuestion: 'ArrowLeft',
  selectOption1: '1',
  selectOption2: '2',
  selectOption3: '3',
  selectOption4: '4',
  toggleFurigana: 'e',
  toggleMap: 'q',
  toggleFlag: 'w',
  openSettings: 'r',
  togglePracticeTranslation: 'y'
});

const DEFAULT_SHORTCUTS_V2 = Object.freeze({
  ...DEFAULT_SHORTCUTS_V1,
  scrollQuestionUp: 'ArrowUp',
  scrollQuestionDown: 'ArrowDown',
  toggleStudyList: 't',
  togglePracticeReveal: 'u',
  toggleQuestionTrans: 'g',
  toggleOption1Trans: 'a',
  toggleOption2Trans: 's',
  toggleOption3Trans: 'd',
  toggleQuestionKotoba: 'v',
  toggleOption1Kotoba: 'z',
  toggleOption2Kotoba: 'x',
  toggleOption3Kotoba: 'c'
});

const DEFAULT_SHORTCUTS_US3 = Object.freeze({
  ...DEFAULT_SHORTCUTS_V1,
  scrollQuestionUp: 'ArrowUp',
  scrollQuestionDown: 'ArrowDown',
  toggleStudyList: 't',
  togglePracticeReveal: 'u'
});

const DEFAULT_EXAM_SHORTCUTS = DEFAULT_SHORTCUTS_V2;

const EXAM_SHORTCUT_ACTIONS = Object.freeze([
  { id: 'nextQuestion', label: 'Soal Berikutnya' },
  { id: 'prevQuestion', label: 'Soal Sebelumnya' },
  { id: 'scrollQuestionUp', label: 'Gulir Halaman ke Atas' },
  { id: 'scrollQuestionDown', label: 'Gulir Halaman ke Bawah' },
  { id: 'selectOption1', label: 'Pilih Opsi 1' },
  { id: 'selectOption2', label: 'Pilih Opsi 2' },
  { id: 'selectOption3', label: 'Pilih Opsi 3' },
  { id: 'selectOption4', label: 'Pilih Opsi 4 (jika ada)' },
  { id: 'toggleFurigana', label: 'Toggle Furigana' },
  { id: 'toggleMap', label: 'Toggle Peta Soal' },
  { id: 'toggleFlag', label: 'Tandai Soal (Flag)' },
  { id: 'openSettings', label: 'Buka Pengaturan' },
  { id: 'togglePracticeTranslation', label: 'Terjemahan Practice' },
  { id: 'toggleStudyList', label: 'Tandai ke Study List' },
  { id: 'togglePracticeReveal', label: 'Intip Kunci Jawaban' },
  { id: 'toggleQuestionTrans', label: 'Terjemahan Kalimat Soal' },
  { id: 'toggleOption1Trans', label: 'Terjemahan Opsi 1' },
  { id: 'toggleOption2Trans', label: 'Terjemahan Opsi 2' },
  { id: 'toggleOption3Trans', label: 'Terjemahan Opsi 3' },
  { id: 'toggleQuestionKotoba', label: 'Kosakata Soal' },
  { id: 'toggleOption1Kotoba', label: 'Kosakata Opsi 1' },
  { id: 'toggleOption2Kotoba', label: 'Kosakata Opsi 2' },
  { id: 'toggleOption3Kotoba', label: 'Kosakata Opsi 3' }
]);

const RESERVED_SHORTCUT_KEYS = new Set(['f', 'Escape', 'Enter', ' ', 'Tab']);

const MODIFIER_ONLY_KEYS = new Set([
  'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock',
  'ContextMenu', 'OS', 'Process', 'Unidentified', 'Dead', 'AltGraph'
]);

function normalizeShortcutKey(rawKey) {
  if (typeof rawKey !== 'string' || !rawKey.length) return null;
  if (MODIFIER_ONLY_KEYS.has(rawKey)) return null;
  if (rawKey === 'Spacebar' || rawKey === ' ') return ' ';
  if (rawKey === 'Escape' || rawKey === 'Enter' || rawKey === 'Tab') return rawKey;
  if (rawKey === 'ArrowLeft' || rawKey === 'ArrowRight' || rawKey === 'ArrowUp' || rawKey === 'ArrowDown') {
    return rawKey;
  }
  if (/^[a-zA-Z]$/.test(rawKey)) return rawKey.toLowerCase();
  if (/^[0-9]$/.test(rawKey)) return rawKey;
  if (rawKey.length === 1 && !/\s/.test(rawKey)) return rawKey;
  return null;
}

function formatShortcutKeyLabel(key) {
  switch (key) {
    case 'ArrowRight': return '→';
    case 'ArrowLeft': return '←';
    case 'ArrowUp': return '↑';
    case 'ArrowDown': return '↓';
    case ' ': return 'Space';
    default: return /^[a-z]$/.test(key) ? key.toUpperCase() : String(key || '');
  }
}

function getShortcutActionLabel(actionId) {
  const found = EXAM_SHORTCUT_ACTIONS.find(item => item.id === actionId);
  return found ? found.label : actionId;
}

function loadExamShortcuts() {
  try {
    const raw = JSON.parse(localStorage.getItem(EXAM_SHORTCUTS_STORAGE_KEY) || 'null');
    const source = raw && typeof raw === 'object'
      ? (raw.bindings && typeof raw.bindings === 'object' ? raw.bindings : raw)
      : null;
    if (!source) return { ...DEFAULT_EXAM_SHORTCUTS };

    const next = {};
    const usedKeys = new Set();

    // Pass 1: Preserve valid, non-reserved, non-conflicting user bindings from storage
    for (const actionId of Object.keys(DEFAULT_EXAM_SHORTCUTS)) {
      if (source[actionId] !== undefined) {
        const normalized = normalizeShortcutKey(source[actionId]);
        if (normalized && !RESERVED_SHORTCUT_KEYS.has(normalized) && !usedKeys.has(normalized)) {
          next[actionId] = normalized;
          usedKeys.add(normalized);
        }
      }
    }

    // Pass 2: Populate missing new Schema v2 actions with default keys
    for (const [actionId, defaultKey] of Object.entries(DEFAULT_EXAM_SHORTCUTS)) {
      if (!next[actionId]) {
        if (!usedKeys.has(defaultKey) && !RESERVED_SHORTCUT_KEYS.has(defaultKey)) {
          next[actionId] = defaultKey;
          usedKeys.add(defaultKey);
        } else {
          next[actionId] = defaultKey;
        }
      }
    }

    return next;
  } catch {
    return { ...DEFAULT_EXAM_SHORTCUTS };
  }
}

function saveExamShortcuts(shortcuts) {
  try {
    localStorage.setItem(EXAM_SHORTCUTS_STORAGE_KEY, JSON.stringify({
      version: EXAM_SHORTCUTS_VERSION,
      updatedAt: new Date().toISOString(),
      bindings: shortcuts
    }));
  } catch (err) {
    console.warn('Gagal menyimpan shortcut ujian:', err);
  }
}

function assignExamShortcut(actionId, rawKey) {
  if (!Object.prototype.hasOwnProperty.call(DEFAULT_EXAM_SHORTCUTS, actionId)) {
    return { ok: false, reason: 'unknown-action', message: 'Aksi shortcut tidak dikenal.' };
  }
  const normalized = normalizeShortcutKey(rawKey);
  if (!normalized) {
    return { ok: false, reason: 'invalid', message: 'Tombol tersebut tidak dapat digunakan sebagai shortcut.' };
  }
  if (RESERVED_SHORTCUT_KEYS.has(normalized)) {
    return {
      ok: false,
      reason: 'reserved',
      message: `Tombol ${formatShortcutKeyLabel(normalized)} dicadangkan oleh sistem dan tidak bisa dipakai.`
    };
  }
  for (const [otherAction, otherKey] of Object.entries(state.examShortcuts)) {
    if (otherAction !== actionId && otherKey === normalized) {
      return {
        ok: false,
        reason: 'conflict',
        conflictAction: otherAction,
        message: `Tombol ${formatShortcutKeyLabel(normalized)} sudah dipakai untuk "${getShortcutActionLabel(otherAction)}".`
      };
    }
  }
  state.examShortcuts = {
    ...state.examShortcuts,
    [actionId]: normalized
  };
  saveExamShortcuts(state.examShortcuts);
  return { ok: true, key: normalized };
}

function resetExamShortcuts() {
  state.examShortcuts = { ...DEFAULT_EXAM_SHORTCUTS };
  state.shortcutCaptureAction = null;
  state.shortcutConflictMessage = '';
  saveExamShortcuts(state.examShortcuts);
}

const state = {
  page: 'home',
  lang: loadLang(),
  mapHidden: loadMapHidden(),
  questions: [],
  sessions: [],
  settings: {
    standardDuration: 70,
    standardCount: 40,
    resumeInterrupted: true,
    defaultSetId: 'ssw-pm-kunci-ujian-1'
  },
  examPrefs: loadExamPrefs(),
  examShortcuts: loadExamShortcuts(),
  shortcutCaptureAction: null,
  shortcutConflictMessage: '',
  examFillScreen: false,
  examSettingsOpen: false,
  practiceTranslationOpen: false,
  practiceRevealAnswer: false,
  editor: null,
  activeSession: null,
  resultId: null,
  reviewFilter: 'all',
  showAllTranslations: false,
  openTranslationIds: new Set(),
  cardFurigana: new Map(),
  studyList: [],
  studySearch: '',
  studyPackageFilter: 'all',
  studySort: 'recent',
  studyCardFurigana: new Map(),
  studyCardTrans: new Set(),

  bankSelectedIds: new Set(),
  bankVisibleIds: [],
  bankListExpanded: false,
  bankPage: 1,
  bankPageSize: 50,
  bankFilter: {
    search: '',
    setId: 'all',
    media: 'all',
    status: 'all'
  },
  setup: {
    mode: 'full',
    setId: 'ssw-pm-kunci-ujian-1',
    candidateName: '',
    candidatePhoto: '',
    count: 40,
    duration: 70,
    random: false,
    shuffleOptions: false,
    practice: false
  },
  setupCustomIds: new Set(),
  csvImport: null
};
if (typeof window !== 'undefined') { window.state = state; window.isQuestionInStudy = isQuestionInStudy; }

function t(key) {
  const dict = I18N[state.lang] || I18N.id;
  return dict[key] ?? I18N.id[key] ?? key;
}

function pageLabel(page) {
  const map = {
    home: t('navHome'),
    setup: t('navSetup'),
    bank: t('navBank'),
    history: t('navHistory'),
    study: t('navStudy'),
    backup: t('navBackup'),
    exam: t('pageExam'),
    result: t('pageResult'),
    review: t('pageReview')
  };
  return map[page] || 'SSW PM Mock Test';
}

const FLAG_ICONS = {
  id: `<span class="flag-box"><svg viewBox="0 0 24 16" width="22" height="14" aria-hidden="true"><rect width="24" height="8" fill="#e70011"/><rect y="8" width="24" height="8" fill="#ffffff"/><rect width="24" height="16" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1"/></svg></span>`,
  en: `<span class="flag-box"><svg viewBox="0 0 60 30" width="22" height="14" aria-hidden="true"><clipPath id="uk-clip-active"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="uk-diag-active"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clip-path="url(#uk-clip-active)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#uk-diag-active)" stroke="#c8102e" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#c8102e" stroke-width="6"/><rect width="60" height="30" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1"/></g></svg></span>`,
  ja: `<span class="flag-box"><svg viewBox="0 0 24 16" width="22" height="14" aria-hidden="true"><rect width="24" height="16" fill="#ffffff"/><circle cx="12" cy="8" r="4.8" fill="#bc002d"/><rect width="24" height="16" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1"/></svg></span>`
};

function updateLangDropdownUI(lang = state.lang || 'id') {
  const currentFlag = $('#zen-lang-current-flag');
  if (currentFlag) {
    currentFlag.innerHTML = FLAG_ICONS[lang] || FLAG_ICONS.id;
  }
  $$('.zen-lang-item').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  const langSelect = $('#global-lang-select');
  if (langSelect && langSelect.value !== lang) {
    langSelect.value = lang;
  }
}

function updateShellLanguage() {
  document.documentElement.lang = state.lang;
  updateLangDropdownUI(state.lang);
  const navMap = {
    home: t('navHome'),
    setup: t('navSetup'),
    bank: t('navBank'),
    history: t('navHistory'),
    study: t('navStudy'),
    backup: t('navBackup')
  };
  $$('.nav-item').forEach(btn => {
    const p = btn.dataset.page;
    const labelSpan = btn.querySelector('[data-i18n]') || btn.querySelectorAll('span')[1];
    if (p && navMap[p] && labelSpan) {
      labelSpan.textContent = navMap[p];
    }
  });
  const tagline = $('.brand-tagline');
  if (tagline) tagline.textContent = t('sidebarTagline');
  const addQBtn = $('.topbar-actions [data-action="new-question"]');
  if (addQBtn) addQBtn.textContent = t('topAddQuestion');
  const startBtn = $('.topbar-actions [data-page="setup"]');
  if (startBtn) startBtn.textContent = t('topStartExam');
  const langSelect = $('#global-lang-select');
  if (langSelect && langSelect.value !== state.lang) langSelect.value = state.lang;
  const connLabel = $('#connection-label');
  if (connLabel) connLabel.textContent = navigator.onLine ? t('storageOnline') : t('storageOffline');
  const bc = $('#breadcrumbs');
  if (bc) bc.textContent = pageLabel(state.page);
}

// Safe rich-HTML support for Japanese question content and <ruby><rt> furigana.
const RICH_HTML_TAGS = new Set([
  'p','div','span','br','hr','strong','b','em','i','u','s','del','ins','mark','small',
  'sub','sup','ruby','rt','rp','ul','ol','li','blockquote','pre','code',
  'h1','h2','h3','h4','h5','h6','table','thead','tbody','tfoot','tr','th','td','img','font'
]);
const RICH_HTML_DROP_TAGS = new Set([
  'script','style','iframe','frame','frameset','object','embed','svg','math','form','input',
  'button','textarea','select','option','video','audio','source','link','meta','picture',
  'canvas','template','noscript'
]);
const RICH_HTML_STYLE_PROPS = new Set([
  'color','background-color','font-weight','font-style','text-decoration','font-size',
  'vertical-align','text-align','white-space','letter-spacing','line-height','font-family',
  'border','border-color','border-width','border-style','padding','padding-left','padding-right',
  'padding-top','padding-bottom','margin','margin-left','margin-right','margin-top','margin-bottom'
]);

function sanitizeRichStyle(rawStyle) {
  const probe = document.createElement('span');
  probe.setAttribute('style', String(rawStyle || ''));
  const safe = [];
  for (const property of RICH_HTML_STYLE_PROPS) {
    const value = probe.style.getPropertyValue(property).trim();
    if (!value || value.length > 120) continue;
    if (/(?:url\s*\(|expression\s*\(|javascript\s*:|@import|behavior\s*:|-moz-binding|var\s*\()/i.test(value)) continue;
    try {
      if (globalThis.CSS?.supports && !CSS.supports(property, value)) continue;
    } catch { continue; }
    safe.push(`${property}: ${value}`);
  }
  return safe.join('; ');
}

function sanitizeRichHTML(value = '') {
  const template = document.createElement('template');
  template.innerHTML = String(value ?? '');
  const output = document.createElement('div');
  const visit = (node, parent) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.nodeValue || ''));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName.toLowerCase();
    if (RICH_HTML_DROP_TAGS.has(tag)) return;
    if (tag === 'img') {
      const src = (node.getAttribute('src') || '').trim();
      if (!/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(src) || src.length > 12 * 1024 * 1024) return;
      const cleanImage = document.createElement('img');
      cleanImage.setAttribute('src', src);
      cleanImage.setAttribute('alt', String(node.getAttribute('alt') || 'Ilustrasi soal').slice(0, 200));
      parent.append(cleanImage);
      return;
    }
    if (!RICH_HTML_TAGS.has(tag)) {
      for (const child of [...node.childNodes]) visit(child, parent);
      return;
    }
    const clean = document.createElement(tag);
    if (node.hasAttribute('style')) {
      const style = sanitizeRichStyle(node.getAttribute('style'));
      if (style) clean.setAttribute('style', style);
    }
    if (tag === 'font') {
      const color = (node.getAttribute('color') || '').trim();
      if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) {
        clean.setAttribute('style', [clean.getAttribute('style'), `color: ${color}`].filter(Boolean).join('; '));
      }
    }
    if (node.hasAttribute('lang')) {
      const lang = node.getAttribute('lang').trim();
      if (/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(lang)) clean.setAttribute('lang', lang);
    }
    if (tag === 'td' || tag === 'th') {
      for (const attr of ['colspan','rowspan']) {
        const n = Number.parseInt(node.getAttribute(attr), 10);
        if (Number.isInteger(n) && n >= 1 && n <= 20) clean.setAttribute(attr, String(n));
      }
      if (tag === 'th' && ['row','col','rowgroup','colgroup'].includes(node.getAttribute('scope'))) {
        clean.setAttribute('scope', node.getAttribute('scope'));
      }
    }
    if (tag === 'ol' && node.hasAttribute('start')) {
      const start = Number.parseInt(node.getAttribute('start'), 10);
      if (Number.isInteger(start) && start >= 1 && start <= 10000) clean.setAttribute('start', String(start));
    }
    for (const child of [...node.childNodes]) visit(child, clean);
    parent.append(clean);
  };
  for (const child of [...template.content.childNodes]) visit(child, output);
  return output.innerHTML;
}

function richHTML(value = '') { return sanitizeRichHTML(value); }

function richPlainText(value = '') {
  const holder = document.createElement('div');
  holder.innerHTML = sanitizeRichHTML(value);
  holder.querySelectorAll('rt, rp').forEach(node => node.remove());
  return (holder.textContent || '').replace(/\s+/g, ' ').trim();
}

function normalizedRichEditorValue(value = '') {
  const safe = sanitizeRichHTML(value);
  return (richPlainText(safe) || /<img\b/i.test(safe)) ? safe : '';
}

function applyExamPrefs() {
  const prefs = state.examPrefs;
  document.documentElement.style.setProperty('--exam-question-font-size', `${prefs.questionFontSize}px`);
  document.documentElement.style.setProperty('--exam-answer-font-size', `${prefs.answerFontSize}px`);
  document.body.classList.toggle('hide-furigana', !prefs.showFurigana);
  const qVal = $('#exam-pref-q-font-val');
  if (qVal) qVal.textContent = `${prefs.questionFontSize} px`;
  const aVal = $('#exam-pref-a-font-val');
  if (aVal) aVal.textContent = `${prefs.answerFontSize} px`;
  const fToggle = $('#exam-pref-furigana');
  if (fToggle) fToggle.checked = Boolean(prefs.showFurigana);
  const fStatus = $('#exam-furigana-pill-state');
  if (fStatus) fStatus.textContent = prefs.showFurigana ? 'ON' : 'OFF';
  const fHeaderBtn = $('[data-action="toggle-furigana-quick"]');
  if (fHeaderBtn) fHeaderBtn.classList.toggle('is-active', Boolean(prefs.showFurigana));
}

function isFullscreenActive() {
  return Boolean(state.examFillScreen || document.fullscreenElement || document.webkitFullscreenElement);
}

function shouldUseFillScreenFallback() {
  const docEl = document.documentElement;
  const hasNativeFs = Boolean(docEl && (docEl.requestFullscreen || docEl.webkitRequestFullscreen));
  if (!hasNativeFs) return true;
  // Guard iOS where element fullscreen is known to fail or throw
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  if (isIOS) return true;
  return false;
}

async function lockExamLandscape() {
  try {
    if (screen.orientation && typeof screen.orientation.lock === 'function') {
      await screen.orientation.lock('landscape');
    } else {
      const legacyLock = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation;
      if (typeof legacyLock === 'function') {
        legacyLock.call(screen, 'landscape');
      }
    }
  } catch (err) {
    // Diabaikan pada perangkat desktop atau browser yang tidak mendukung kunci orientasi
  }
}

function unlockExamOrientation() {
  try {
    if (screen.orientation && typeof screen.orientation.unlock === 'function') {
      screen.orientation.unlock();
    } else {
      const legacyUnlock = screen.unlockOrientation || screen.mozUnlockOrientation || screen.msUnlockOrientation;
      if (typeof legacyUnlock === 'function') {
        legacyUnlock.call(screen);
      }
    }
  } catch (err) {
    // Diabaikan jika tidak didukung
  }
}

async function toggleFullScreen() {
  // Path 1: Fallback environment (iOS or unsupported)
  if (shouldUseFillScreenFallback()) {
    state.examFillScreen = !state.examFillScreen;
    updateFullscreenUI();
    syncExamViewportAfterResume();
    return;
  }

  // Path 2: Standard / Android environment with native API
  const docEl = document.documentElement;
  const reqFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
  const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;

  try {
    if (!fsEl) {
      if (reqFs) await reqFs.call(docEl);
    } else {
      if (exitFs) await exitFs.call(document);
    }
  } catch (err) {
    console.warn('[Fullscreen] Native request rejected or failed:', err);
    // Graceful fallback to CSS fill-screen on unexpected browser security rejection
    state.examFillScreen = !state.examFillScreen;
  } finally {
    updateFullscreenUI();
    syncExamViewportAfterResume();
  }
}

function updateFullscreenUI() {
  const nativeActive = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  const fillActive = Boolean(state.examFillScreen);
  const active = nativeActive || fillActive;
  document.body.classList.toggle('is-fullscreen', nativeActive);
  document.body.classList.toggle('is-fill-screen', fillActive);
  $$('[data-action="toggle-fullscreen"]').forEach(btn => {
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.setAttribute('title', active ? 'Keluar Layar Penuh (Esc)' : 'Layar Penuh');
    const icon = btn.querySelector('.fs-icon');
    if (icon) icon.textContent = active ? '🗗' : '⛶';
    const label = btn.querySelector('.fs-label');
    if (label) label.textContent = active ? t('setFsActive') : t('setFsTitle');
  });
  const fsBadge = $('#exam-settings-fs-status');
  if (fsBadge) {
    fsBadge.textContent = active ? t('setFsActive') : t('setFsInactive');
    fsBadge.className = `status ${active ? 'status-on' : 'status-neutral'}`;
  }
}

function cleanupFullscreen() {
  const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
  const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  if (isFs && exitFs) {
    try {
      const p = exitFs.call(document);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {}
  }
  state.examFillScreen = false;
  document.body.classList.remove('is-fullscreen', 'is-fill-screen');
  unlockExamOrientation();
  updateFullscreenUI();
}


let examViewportTimers = [];

function syncExamViewportHeight() {
  const vv = window.visualViewport;
  // visualViewport.scale is strictly a read-only observer; pinch zoom is actuated by the browser.
  if (vv && typeof vv.scale === 'number' && vv.scale > 1.02) {
    return;
  }

  if (document.body && document.body.classList.contains('exam-mode')) {
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo(0, 0);
    }
    if (document.documentElement && document.documentElement.scrollTop !== 0) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body && document.body.scrollTop !== 0) {
      document.body.scrollTop = 0;
    }
  }

  const height = Math.round(
    (vv && vv.height > 0 ? vv.height : 0) ||
    window.innerHeight ||
    document.documentElement.clientHeight
  );

  if (height > 0) {
    document.documentElement.style.setProperty('--exam-viewport-height', `${height}px`);
    document.documentElement.style.setProperty('--exam-viewport-top', '0px');
  }
}

function scheduleExamViewportSync() {
  requestAnimationFrame(syncExamViewportHeight);
}

function syncExamViewportAfterResume() {
  syncExamViewportHeight();
  requestAnimationFrame(syncExamViewportHeight);

  examViewportTimers.forEach(id => clearTimeout(id));
  examViewportTimers = [
    setTimeout(syncExamViewportHeight, 60),
    setTimeout(syncExamViewportHeight, 180),
    setTimeout(syncExamViewportHeight, 350),
    setTimeout(syncExamViewportHeight, 600)
  ];
}

function handleFullscreenStateChange() {
  updateFullscreenUI();
  syncExamViewportAfterResume();
}

document.addEventListener('fullscreenchange', handleFullscreenStateChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenStateChange);

window.addEventListener('resize', syncExamViewportAfterResume, { passive: true });
window.addEventListener('orientationchange', syncExamViewportAfterResume, { passive: true });
window.addEventListener('pageshow', () => {
  if (!isFullscreenActive()) unlockExamOrientation();
  syncExamViewportAfterResume();
}, { passive: true });
window.addEventListener('focus', syncExamViewportAfterResume, { passive: true });

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncExamViewportAfterResume, { passive: true });
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Saat browser di-minimize atau berpindah aplikasi, lepas kunci landscape
    // dan keluar dari fullscreen agar kembali ke orientasi portrait bawaan HP
    unlockExamOrientation();
    if (isFullscreenActive()) {
      const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
      if (exitFs) {
        try {
          const p = exitFs.call(document);
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch {}
      }
    }
  } else {
    if (!isFullscreenActive()) {
      unlockExamOrientation();
    }
    syncExamViewportAfterResume();
  }
});

syncExamViewportHeight();


function toast(message, type = 'info') {
  const node = document.createElement('div');
  node.className = `toast toast-${type}`;
  node.textContent = message;
  toastRoot.append(node);
  setTimeout(() => {
    node.classList.add('toast-out');
    setTimeout(() => node.remove(), 250);
  }, 3500);
}

function modal(title, content, footer = '') {
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header class="modal-header"><h2>${esc(title)}</h2><button class="icon-button" data-action="close-modal" aria-label="Tutup">×</button></header><div class="modal-body">${content}</div>${footer ? `<footer class="modal-footer">${footer}</footer>` : ''}</section></div>`;
  $('.modal', modalRoot)?.focus?.();
}

function closeModal() {
  modalRoot.innerHTML = '';
  state.editor = null;
}

function confirmModal(title, htmlOrText, confirmLabel = 'Ya, lanjutkan', danger = true, isHTML = false) {
  return new Promise(resolve => {
    const body = isHTML ? htmlOrText : `<p class="modal-copy">${esc(htmlOrText)}</p>`;
    modal(
      title,
      body,
      `<button class="button button-outline" data-action="confirm-cancel">${esc(t('btnCancel'))}</button><button class="button ${danger ? 'button-danger' : 'button-primary'}" data-action="confirm-ok">${esc(confirmLabel)}</button>`
    );
    state.confirmResolve = resolve;
  });
}

function activeQuestions() {
  return state.questions.filter(q => q.active !== false && validateQuestion(q).length === 0);
}

function getAvailablePackages(questions = state.questions) {
  const map = new Map();
  for (const pkg of DEFAULT_PACKAGES) {
    map.set(pkg.id, {
      id: pkg.id,
      name: pkg.name,
      sourcePdf: pkg.sourcePdf || '',
      description: pkg.description || '',
      total: 0,
      active: 0,
      withImage: 0
    });
  }
  for (const q of questions) {
    const setId = (q.setId || 'ssw-pm-custom').trim();
    const setName = packageName(q, 'Paket Kustom SSW PM');
    if (!map.has(setId)) {
      map.set(setId, {
        id: setId,
        name: setName,
        sourcePdf: q.sourcePdf || '',
        description: 'Paket bank soal SSW PM.',
        total: 0,
        active: 0,
        withImage: 0
      });
    }
    const entry = map.get(setId);
    entry.total++;
    if (q.active !== false && validateQuestion(q).length === 0) entry.active++;
    if (q.imageMediaId || q.questionImage) entry.withImage++;
  }
  return [...map.values()].filter(p => p.total > 0 || p.id === 'ssw-pm-kunci-ujian-1' || p.id === 'ssw-pm-tipe2-nguyen1');
}

function getMedia(q, mediaId) {
  if (!q) return undefined;
  if (mediaId) {
    const found = q.media?.find(m => m.id === mediaId);
    if (found) return found;
  }
  if (q.questionImage && (!mediaId || mediaId === q.imageMediaId || mediaId === 'question-image')) {
    return {
      id: q.imageMediaId || `img-${q.id}`,
      name: q.questionImage.split('/').pop() || 'question.png',
      type: 'image/png',
      path: q.questionImage
    };
  }
  return undefined;
}

function getQuestionMainMedia(q) {
  if (!q) return null;
  return (q.imageMediaId ? getMedia(q, q.imageMediaId) : null) || (q.questionImage ? getMedia(q, 'question-image') : null);
}

function getOptionMedia(q, o, idx = 0) {
  if (!q || !o) return null;
  if (o.mediaId) {
    const found = getMedia(q, o.mediaId);
    if (found) return found;
  }
  if (o.optionImage) {
    return {
      id: o.mediaId || `opt-${q.id}-${idx}`,
      name: o.optionImage.split('/').pop() || 'option.png',
      type: 'image/png',
      path: o.optionImage
    };
  }
  return null;
}

function questionLocationLabel(q) {
  const pkg = packageName(q, 'Bank Soal SSW PM');
  const num = q?.questionNumber ? `#${q.questionNumber}` : '';
  const page = (q?.sourcePage || q?.pdfPage) ? `p.${q.sourcePage || q.pdfPage}` : '';
  return [pkg, num, page].filter(Boolean).join(' · ');
}


function mediaURL(media) {
  if (!media) return '';

  if (media.blob instanceof Blob) {
    if (!objectURLs.has(media.id)) {
      objectURLs.set(
        media.id,
        URL.createObjectURL(media.blob)
      );
    }
    return objectURLs.get(media.id);
  }

  if (typeof media.dataUrl === 'string' && media.dataUrl.trim()) {
    return media.dataUrl.trim();
  }

  if (typeof media.path === 'string' && media.path.trim()) {
    const rawPath = media.path.trim();
    const marker = 'assets/questions/';
    const markerIndex = rawPath.indexOf(marker);

    // Tangani path relatif maupun URL absolut lama.
    if (markerIndex !== -1) {
      const filename = rawPath.slice(
        markerIndex + marker.length
      );

      return `./${filename.replace(/^\/+/, '')}`;
    }

    if (/^(?:https?:|data:|blob:)/i.test(rawPath)) {
      return rawPath;
    }

    return rawPath.startsWith('./')
      ? rawPath
      : `./${rawPath.replace(/^\/+/, '')}`;
  }

  return '';
}

function revokeUnusedURLs() {
  const ids = new Set();
  for (const q of state.questions) for (const m of (q.media || [])) ids.add(m.id);
  for (const session of state.sessions) for (const q of (session.questions || [])) {
    for (const m of (q.media || [])) ids.add(m.id);
  }
  if (state.activeSession) for (const q of (state.activeSession.questions || [])) {
    for (const m of (q.media || [])) ids.add(m.id);
  }
  if (state.editor?.q) for (const m of (state.editor.q.media || [])) ids.add(m.id);
  for (const [id, url] of objectURLs) {
    if (!ids.has(id)) {
      URL.revokeObjectURL(url);
      objectURLs.delete(id);
    }
  }
}

async function reloadData() {
  const prevQuestions = Array.isArray(state.questions) ? state.questions : [];
  const [dbQuestions, dbSessions, dbStudyList] = await Promise.all([all('questions'), all('sessions'), all('studyList')]);
  state.sessions = dbSessions || [];
  state.studyList = Array.isArray(dbStudyList) ? dbStudyList : [];
  updateStudyBadge();
  let currentQuestions = dbQuestions || [];
  let anyChanged = false;
  for (const q of [...currentQuestions]) {
    if (q.isDemo) {
      await del('questions', q.id);
      anyChanged = true;
      continue;
    }
    let changed = false;
    if (!q.setId) {
      if (q.themeId === 'tema-ssw-pm-tipe2' || String(q.id).startsWith('q0')) {
        q.setId = 'ssw-pm-tipe2-nguyen1';
        q.setName = 'Latsol Tipe 2 SSW PM — Đề 7 Thực Phẩm GINO1';
      } else {
        q.setId = 'ssw-pm-kunci-ujian-1';
        q.setName = 'Soal Ujian 1 — CBTP Gino1';
      }
      changed = true;
    }
    if (!q.setName) {
      q.setName = packageName(q.setId, 'Bank Soal SSW PM');
      changed = true;
    } else if (/^Kunci Soal Ujian\b/.test(q.setName)) {
      q.setName = q.setName.replace(/^Kunci Soal Ujian\b/, 'Soal Ujian');
      changed = true;
    }
    if (changed) {
      await put('questions', q);
      anyChanged = true;
    }
  }
  if (anyChanged) {
    currentQuestions = await all('questions');
  }
  if (prevQuestions.length > currentQuestions.length) {
    const dbIds = new Set(currentQuestions.map(q => q.id));
    const missingInDb = prevQuestions.filter(q => !dbIds.has(q.id));
    if (missingInDb.length) {
      try { await putMany('questions', missingInDb); } catch {}
    }
    const merged = new Map(prevQuestions.map(q => [q.id, q]));
    for (const q of currentQuestions) merged.set(q.id, q);
    state.questions = [...merged.values()];
  } else {
    state.questions = currentQuestions;
  }
  const settings = await get('meta', 'settings');
  if (settings) state.settings = { ...state.settings, ...settings };
  revokeUnusedURLs();
}

async function go(page) {
  if (state.page === 'exam' && page !== 'exam') {
    toast('Selesaikan ujian terlebih dahulu sebelum keluar dari layar ujian CBT.', 'warn');
    return;
  }
  state.page = page;
  state.examSettingsOpen = false;
  closeModal();
  if (page === 'exam') {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    document.body.classList.add('exam-mode');
    document.documentElement.classList.add('in-exam');
  } else {
    state.practiceRevealAnswer = false;
    lastExamMapSessionId = null;
    document.body.classList.remove('exam-mode');
    document.documentElement.classList.remove('in-exam');
    cleanupFullscreen();
  }
  render();
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  updateShellLanguage();
  $('#sidebar').classList.remove('sidebar-open');
  if (page === 'exam') {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    syncExamViewportAfterResume();
  }
  view.focus({ preventScroll: true });
}

function render() {
  if (state.page !== 'exam') {
    state.practiceRevealAnswer = false;
    lastExamMapSessionId = null;
    document.body.classList.remove('exam-mode');
    document.documentElement.classList.remove('in-exam');
    cleanupFullscreen();
  }
  applyExamPrefs();
  updateShellLanguage();
  if (state.page === 'home') renderHome();
  else if (state.page === 'setup') renderSetup();
  else if (state.page === 'bank') renderBank();
  else if (state.page === 'history') renderHistory();
  else if (state.page === 'study') renderStudy();
  else if (state.page === 'backup') renderBackup();
  else if (state.page === 'exam') renderExam();
  else if (state.page === 'result') renderResult();
  else if (state.page === 'review') renderReview();
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === state.page));
  $('#breadcrumbs').textContent = pageLabel(state.page);
}

function pageHead(kicker, title, desc, actions = '') {
  return `<div class="page-head"><div><div class="eyebrow">${esc(kicker)}</div><h1>${title}</h1><p>${desc}</p></div><div class="head-actions">${actions}</div></div>`;
}

function statCard(label, value, note, icon) {
  return `<div class="stat-card"><div class="stat-top"><span>${esc(label)}</span><span class="stat-icon">${icon || '—'}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>`;
}

function cleanHomeText(value) {
  return String(value ?? '')
    .replace(/\s*—\s*/g, ' · ')
    .replace(/\s*→\s*$/g, '')
    .trim();
}

function getHomePackageCode(pkg, index) {
  const id = String(pkg?.id || '');
  const kunciMatch = id.match(/^ssw-pm-kunci-ujian-(\d+)$/i);
  if (kunciMatch) return String(kunciMatch[1]).padStart(2, '0');
  if (id === 'ssw-pm-tipe2-nguyen1' || /tipe-?2/i.test(id)) return 'T2';
  const bonusMatch = id.match(/^bonus-soal-(\d+)$/i);
  if (bonusMatch) return `B${bonusMatch[1]}`;
  return `P${index + 1}`;
}

function formatHomePackageTitle(pkg) {
  const raw = String(pkg?.name || '').replace(/^Lab Soal\s*—\s*/, '').replace(/^Kunci Soal Ujian\b/, 'Soal Ujian').trim();
  const parts = raw.split(/\s*—\s*/);
  const primary = parts[0]
    .replace(/\bSSW\s+PM\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const rawEdition = parts.slice(1).join(' · ').trim();
  if (!rawEdition || /^CBTP\s+Gino1$/i.test(rawEdition)) {
    return { primary: primary || cleanHomeText(raw), edition: '' };
  }
  const edition = rawEdition
    .replace(/\bGINO1\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { primary: primary || cleanHomeText(raw), edition };
}

function formatHomeSessionTitle(session) {
  const raw = String(session?.setName || session?.title || 'Mock Test').trim();
  const stripped = raw
    .replace(/^(Mock Test Penuh|Latihan|Simulasi Kustom)\s*—\s*/i, '')
    .trim();
  return formatHomePackageTitle({ name: stripped || raw }).primary;
}

function renderHome() {
  const ready = activeQuestions().length;
  const packages = getAvailablePackages();
  const inProgress = state.sessions.find(s => s.status === 'in_progress');
  const completedSessions = [...state.sessions]
    .filter(s => s.status !== 'in_progress')
    .sort((a, b) => (b.endedAt || b.startedAt || 0) - (a.endedAt || a.startedAt || 0));
  const latest = completedSessions.slice(0, 5);
  const loc = t('locale');
  const lang = state.lang || 'id';

  const kunciPackages = packages.filter(p => String(p.id).startsWith('ssw-pm-kunci-ujian-'));
  const bonusPackages = packages.filter(p => !String(p.id).startsWith('ssw-pm-kunci-ujian-'));
  const activeFilter = ['all', 'kunci', 'bonus'].includes(state.homePkgFilter) ? state.homePkgFilter : 'all';
  const visiblePackages = activeFilter === 'kunci'
    ? kunciPackages
    : activeFilter === 'bonus'
      ? bonusPackages
      : packages;

  const copy = lang === 'ja'
    ? {
        kicker: '特定技能1号・飲食料品製造業',
        title: '飲食料品製造業 技能測定試験',
        spec: 'CBT基準 · 40問 · 70分 · 150点満点',
        startExam: '模擬試験を開始',
        startPractice: '時間無制限で練習',
        startCustom: 'カスタム設定',
        resumeTag: '中断中のセッション',
        resumeBtn: '再開する',
        pkgHeading: '問題パッケージ',
        totalQuestions: `全${ready}問`,
        filterAll: 'すべて',
        filterKunci: '本試験キー',
        filterBonus: '追加演習',
        unitSoal: '問',
        unitImg: '図解',
        btnQuestions: '問題一覧',
        btnStartPkg: '開始',
        histHeading: '最近の試験結果',
        histCount: `${completedSessions.length}件`,
        histViewAll: 'すべて表示',
        histEmpty: '試験履歴はまだありません。',
        thDate: '日時',
        thPkg: 'パッケージ',
        thMode: 'モード',
        thCorrect: '正解',
        thScore: '得点',
        thAcc: '正答率',
        btnReview: '詳細',
        utilSetup: '試験設定',
        utilBank: '問題バンク管理',
        utilBackup: 'バックアップ・復元'
      }
    : lang === 'en'
      ? {
          kicker: '特定技能1号・飲食料品製造業',
          title: 'Food & Beverage Manufacturing Exam',
          spec: 'CBT Standard · 40 questions · 70 minutes · 150 points',
          startExam: 'Start Mock Test',
          startPractice: 'Untimed Practice',
          startCustom: 'Custom Simulation',
          resumeTag: 'Session in progress',
          resumeBtn: 'Resume',
          pkgHeading: 'Question Packages',
          totalQuestions: `${ready} questions`,
          filterAll: 'All',
          filterKunci: 'Exam Keys',
          filterBonus: 'Bonus Sets',
          unitSoal: 'questions',
          unitImg: 'illustrated',
          btnQuestions: 'Questions',
          btnStartPkg: 'Start',
          histHeading: 'Recent Results',
          histCount: `${completedSessions.length} sessions`,
          histViewAll: 'View all',
          histEmpty: 'No completed examination sessions yet.',
          thDate: 'Date',
          thPkg: 'Package',
          thMode: 'Mode',
          thCorrect: 'Correct',
          thScore: 'Points',
          thAcc: 'Accuracy',
          btnReview: 'Review',
          utilSetup: 'Exam Configuration',
          utilBank: 'Question Bank',
          utilBackup: 'Backup & Restore'
        }
      : {
          kicker: '特定技能1号・飲食料品製造業',
          title: 'Simulasi Ujian Pengolahan Makanan',
          spec: 'Standar CBT · 40 soal · 70 menit · 150 poin',
          startExam: 'Mulai Mock Test',
          startPractice: 'Latihan Tanpa Timer',
          startCustom: 'Simulasi Kustom',
          resumeTag: 'Sesi berlangsung',
          resumeBtn: 'Lanjutkan',
          pkgHeading: 'Paket Soal',
          totalQuestions: `${ready} soal`,
          filterAll: 'Semua',
          filterKunci: 'Kunci Ujian',
          filterBonus: 'Bonus',
          unitSoal: 'soal',
          unitImg: 'ilustrasi',
          btnQuestions: 'Daftar Soal',
          btnStartPkg: 'Mulai',
          histHeading: 'Riwayat Hasil',
          histCount: `${completedSessions.length} sesi`,
          histViewAll: 'Lihat semua',
          histEmpty: 'Belum ada riwayat sesi ujian.',
          thDate: 'Tanggal',
          thPkg: 'Paket',
          thMode: 'Mode',
          thCorrect: 'Benar',
          thScore: 'Poin',
          thAcc: 'Akurasi',
          btnReview: 'Review',
          utilSetup: 'Konfigurasi Ujian',
          utilBank: 'Kelola Bank Soal',
          utilBackup: 'Backup & Restore'
        };

  view.innerHTML = `
    <div class="home-dashboard">
      ${inProgress && state.settings.resumeInterrupted ? `
        <section class="hd-resume-banner" aria-label="${esc(copy.resumeTag)}">
          <div class="hd-resume-info">
            <span class="hd-resume-dot" aria-hidden="true"></span>
            <span class="hd-resume-label">${esc(copy.resumeTag)}</span>
            <strong class="hd-resume-title">${esc(formatHomeSessionTitle(inProgress))}</strong>
            <span class="hd-resume-meta">${inProgress.deadline ? `${esc(cleanHomeText(t('resumeRemaining')))} ${fmtDuration(Math.max(0, Math.floor((inProgress.deadline - Date.now()) / 1000)))}` : esc(cleanHomeText(t('resumeFlex')))}</span>
          </div>
          <button type="button" class="hd-btn hd-btn-primary hd-btn-compact" data-action="resume-session" data-id="${esc(inProgress.id)}">${esc(copy.resumeBtn)}</button>
        </section>
      ` : ''}

      <header class="hd-hero" aria-labelledby="hd-main-title">
        <p class="hd-kicker">${esc(copy.kicker)}</p>
        <h1 id="hd-main-title" class="hd-title">${esc(copy.title)}</h1>
        <p class="hd-spec">${esc(copy.spec)}</p>
        <div class="hd-actions">
          <button type="button" class="hd-btn hd-btn-primary" data-action="quick-start-kunci1">${esc(copy.startExam)}</button>
          <button type="button" class="hd-btn hd-btn-secondary" data-action="quick-practice-kunci1">${esc(copy.startPractice)}</button>
          <button type="button" class="hd-btn hd-btn-ghost" data-action="quick-custom">${esc(copy.startCustom)}</button>
        </div>
      </header>

      <section class="hd-section hd-library" aria-labelledby="hd-pkg-heading">
        <div class="hd-section-head">
          <div class="hd-section-title-group">
            <h2 id="hd-pkg-heading" class="hd-section-title">${esc(copy.pkgHeading)}</h2>
            <span class="hd-section-meta">${esc(copy.totalQuestions)}</span>
          </div>
          <div class="hd-filter-tabs" role="group" aria-label="${esc(copy.pkgHeading)}">
            <button type="button" class="hd-filter-tab ${activeFilter === 'all' ? 'is-active' : ''}" data-action="set-home-pkg-filter" data-id="all" aria-pressed="${activeFilter === 'all'}">
              <span>${esc(copy.filterAll)}</span>
              <span class="hd-filter-count">${packages.length}</span>
            </button>
            <button type="button" class="hd-filter-tab ${activeFilter === 'kunci' ? 'is-active' : ''}" data-action="set-home-pkg-filter" data-id="kunci" aria-pressed="${activeFilter === 'kunci'}">
              <span>${esc(copy.filterKunci)}</span>
              <span class="hd-filter-count">${kunciPackages.length}</span>
            </button>
            <button type="button" class="hd-filter-tab ${activeFilter === 'bonus' ? 'is-active' : ''}" data-action="set-home-pkg-filter" data-id="bonus" aria-pressed="${activeFilter === 'bonus'}">
              <span>${esc(copy.filterBonus)}</span>
              <span class="hd-filter-count">${bonusPackages.length}</span>
            </button>
          </div>
        </div>

        <div class="hd-pkg-list">
          ${visiblePackages.map((pkg, idx) => {
            const code = getHomePackageCode(pkg, idx);
            const titleObj = formatHomePackageTitle(pkg);
            const metaText = `${pkg.active} ${copy.unitSoal}${pkg.withImage > 0 ? ` · ${pkg.withImage} ${copy.unitImg}` : ''}`;
            return `
              <div class="hd-pkg-row">
                <span class="hd-pkg-code" aria-hidden="true">${esc(code)}</span>
                <div class="hd-pkg-main">
                  <span class="hd-pkg-name">${esc(titleObj.primary)}</span>
                  ${titleObj.edition ? `<span class="hd-pkg-edition">${esc(titleObj.edition)}</span>` : ''}
                </div>
                <span class="hd-pkg-meta">${esc(metaText)}</span>
                <div class="hd-pkg-actions">
                  <button type="button" class="hd-row-btn" data-action="filter-package" data-id="${esc(pkg.id)}">${esc(copy.btnQuestions)}</button>
                  <button type="button" class="hd-row-btn hd-row-btn-primary" data-action="quick-package" data-id="${esc(pkg.id)}">${esc(copy.btnStartPkg)}</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <section class="hd-section hd-history" aria-labelledby="hd-history-heading">
        <div class="hd-section-head">
          <div class="hd-section-title-group">
            <h2 id="hd-history-heading" class="hd-section-title">${esc(copy.histHeading)}</h2>
            ${completedSessions.length > 0 ? `<span class="hd-section-meta">${esc(copy.histCount)}</span>` : ''}
          </div>
          <button type="button" class="hd-text-link" data-page="history">${esc(copy.histViewAll)}</button>
        </div>
        ${latest.length ? `
          <div class="hd-table-wrap">
            <table class="hd-table">
              <thead>
                <tr>
                  <th>${esc(copy.thDate)}</th>
                  <th>${esc(copy.thPkg)}</th>
                  <th>${esc(copy.thMode)}</th>
                  <th>${esc(copy.thCorrect)}</th>
                  <th>${esc(copy.thScore)}</th>
                  <th>${esc(copy.thAcc)}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${latest.map(s => {
                  const st = rawStats(s);
                  const sessionTitle = formatHomeSessionTitle(s);
                  return `
                    <tr>
                      <td data-label="${esc(copy.thDate)}">${fmtDate(s.endedAt || s.startedAt, loc)}</td>
                      <td class="hd-td-pkg" data-label="${esc(copy.thPkg)}">
                        <strong class="hd-hist-pkg">${esc(sessionTitle)}</strong>
                      </td>
                      <td data-label="${esc(copy.thMode)}">${s.mode === 'practice' ? esc(cleanHomeText(t('modePractice'))) : esc(cleanHomeText(t('modeExam')))}</td>
                      <td data-label="${esc(copy.thCorrect)}">${st.correct} / ${st.total}</td>
                      <td data-label="${esc(copy.thScore)}">${st.weightedScore} / ${st.maxWeightedScore}</td>
                      <td data-label="${esc(copy.thAcc)}"><strong>${st.percent}%</strong></td>
                      <td class="hd-td-action">
                        <button type="button" class="hd-row-btn" data-action="open-result" data-id="${esc(s.id)}">${esc(copy.btnReview)}</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <p class="hd-empty-line">${esc(copy.histEmpty)}</p>
        `}
      </section>
    </div>`;
}

function modeDescription(mode) {
  return ({
    full: t('modeDescFull'),
    practice: t('modeDescPrac'),
    custom: t('modeDescCust')
  })[mode] || '';
}

function getCustomCandidates(s) {
  let qs = activeQuestions();
  if (s.setId && s.setId !== 'all') {
    qs = qs.filter(q => q.setId === s.setId);
  }
  return qs.slice().sort((a, b) => (a.questionNumber || 999) - (b.questionNumber || 999));
}

function getSetupPool(s) {
  let qs = getCustomCandidates(s);
  if (s.mode === 'custom' && state.setupCustomIds.size) {
    qs = qs.filter(q => state.setupCustomIds.has(q.id));
  }
  return qs;
}

function renderSetup() {
  const s = state.setup;
  const packages = getAvailablePackages();
  const pool = getSetupPool(s);
  const count = s.mode === 'full' ? (pool.length || 40) : Math.max(1, Number(s.count) || 40);
  const actual = Math.min(count, pool.length);
  const maxPoints = (actual * 3.75).toFixed(2).replace(/\.00$/, '');
  const lang = state.lang || 'id';

  const L = lang === 'ja'
    ? {
        kicker: 'CBT模擬試験 · SSW PM',
        title: '模擬試験の設定',
        mode: '試験モード',
        modeFull: '本試験モード（40問・70分）',
        modePrac: '練習モード（時間無制限）',
        modeCust: 'カスタム設定',
        pkg: '問題パッケージ',
        allPkg: 'すべてのパッケージ',
        qCount: '問題数',
        duration: '制限時間（分）',
        optionsHeading: '出題オプション',
        randomQ: '問題順をシャッフル',
        shuffleOpt: '選択肢（A・B・C）をシャッフル',
        untimed: '制限時間を無効にする',
        candidateHeading: '受験者情報（任意）',
        candName: '受験者名',
        candPhoto: '証明写真（印刷用）',
        pickerTitle: '問題を個別に選択（任意）',
        pickerReset: '選択をリセット',
        startBtn: '試験を開始',
        unitSoal: '問',
        unitMin: '分',
        noLimit: '時間無制限',
        maxPts: `最大 ${maxPoints} 点`
      }
    : lang === 'en'
      ? {
          kicker: 'CBT SIMULATION · SSW PM',
          title: 'Simulation Setup',
          mode: 'Simulation Mode',
          modeFull: 'Full Mock Test (40 questions · 70 min)',
          modePrac: 'Untimed Practice',
          modeCust: 'Custom Simulation',
          pkg: 'Question Package',
          allPkg: 'All Question Packages',
          qCount: 'Question Count',
          duration: 'Duration (Minutes)',
          optionsHeading: 'Ordering & Timer',
          randomQ: 'Shuffle question order',
          shuffleOpt: 'Shuffle answer choices (A, B, C)',
          untimed: 'Disable countdown timer',
          candidateHeading: 'Candidate Details (Optional)',
          candName: 'Candidate Name',
          candPhoto: 'Candidate Photo (Print Report)',
          pickerTitle: 'Select Specific Questions (Optional)',
          pickerReset: 'Reset Selection',
          startBtn: 'Start Exam',
          unitSoal: 'questions',
          unitMin: 'min',
          noLimit: 'No time limit',
          maxPts: `Max ${maxPoints} pts`
        }
      : {
          kicker: 'SIMULASI CBT · SSW PM',
          title: 'Konfigurasi Simulasi',
          mode: 'Mode Simulasi',
          modeFull: 'Mock Test Penuh (40 soal · 70 menit)',
          modePrac: 'Latihan Tanpa Timer',
          modeCust: 'Simulasi Kustom',
          pkg: 'Paket Soal',
          allPkg: 'Semua Paket Soal',
          qCount: 'Jumlah Soal',
          duration: 'Durasi (Menit)',
          optionsHeading: 'Pengaturan Urutan & Waktu',
          randomQ: 'Acak urutan nomor soal',
          shuffleOpt: 'Acak urutan pilihan jawaban (A, B, C)',
          untimed: 'Nonaktifkan batas waktu',
          candidateHeading: 'Identitas Peserta (Opsional)',
          candName: 'Nama Peserta',
          candPhoto: 'Foto Laporan Cetak',
          pickerTitle: 'Pilih Soal Spesifik (Opsional)',
          pickerReset: 'Reset Pilihan',
          startBtn: 'Mulai Ujian',
          unitSoal: 'soal',
          unitMin: 'menit',
          noLimit: 'Tanpa batas waktu',
          maxPts: `Maks ${maxPoints} poin`
        };

  const packageOptions = [
    ...packages.map(p => {
      const cleanName = formatHomePackageTitle(p).primary;
      return `<option value="${esc(p.id)}" ${s.setId === p.id ? 'selected' : ''}>${esc(cleanName)} (${p.active} ${esc(L.unitSoal)})</option>`;
    }),
    `<option value="all" ${s.setId === 'all' ? 'selected' : ''}>${esc(L.allPkg)} (${activeQuestions().length} ${esc(L.unitSoal)})</option>`
  ].join('');

  view.innerHTML = `
    <div class="zen-page zen-setup-page">
      <header class="zen-page-head">
        <div>
          <span class="zen-kicker">${esc(L.kicker || t('setupKicker'))}</span>
          <h1 class="zen-page-title">${esc(L.title)}</h1>
          <p class="zen-page-meta">
            <span class="summary-big">${actual}<span> / ${count} ${esc(L.unitSoal)}</span></span>
            <span>·</span>
            <span>${s.practice ? esc(L.noLimit) : `${Math.max(1, Number(s.duration) || 70)} ${esc(L.unitMin)}`}</span>
            <span>·</span>
            <span>${esc(L.maxPts)}</span>
          </p>
        </div>
      </header>

      <form id="setup-form" class="zen-form">
        <div class="zen-field-grid">
          <label class="field">
            <span>${esc(L.mode)}</span>
            <select name="mode">
              <option value="full" ${s.mode === 'full' ? 'selected' : ''}>${esc(L.modeFull)}</option>
              <option value="practice" ${s.mode === 'practice' ? 'selected' : ''}>${esc(L.modePrac)}</option>
              <option value="custom" ${s.mode === 'custom' ? 'selected' : ''}>${esc(L.modeCust)}</option>
            </select>
          </label>

          <label class="field">
            <span>${esc(L.pkg)}</span>
            <select name="setId">${packageOptions}</select>
          </label>
        </div>

        <div class="zen-field-grid">
          <label class="field">
            <span>${esc(L.qCount)}</span>
            <input name="count" type="number" min="1" max="500" value="${esc(s.mode === 'full' ? (pool.length || 40) : s.count)}" ${s.mode === 'full' ? 'readonly' : ''} required>
          </label>
          <label class="field">
            <span>${esc(L.duration)}</span>
            <input name="duration" type="number" min="1" max="300" value="${esc(s.duration)}" required ${s.practice ? 'disabled' : ''}>
          </label>
        </div>

        ${s.mode === 'custom' ? `
          <div class="custom-question-picker zen-picker">
            <div class="custom-picker-head">
              <strong>${esc(L.pickerTitle)}</strong>
              <button type="button" class="hd-text-link" data-action="clear-custom-selection">${esc(L.pickerReset)}</button>
            </div>
            <div class="custom-question-list">
              ${getCustomCandidates(s).length ? getCustomCandidates(s).map(q => `
                <label class="custom-question-row">
                  <input type="checkbox" name="questionIds" value="${esc(q.id)}" ${state.setupCustomIds.has(q.id) ? 'checked' : ''}>
                  <span class="custom-question-main">
                    <strong>#${q.questionNumber || '1'} · ${esc(richPlainText(q.prompt || '(tanpa teks)').slice(0, 110))}</strong>
                  </span>
                </label>
              `).join('') : `<div class="custom-picker-empty">${esc(t('setupPickerEmpty'))}</div>`}
            </div>
            <div class="custom-picker-footer">${state.setupCustomIds.size ? `${state.setupCustomIds.size} ${esc(t('setupPickerSelected'))}` : esc(t('setupPickerDefault'))}</div>
          </div>
        ` : ''}

        <div class="zen-toggle-group">
          <h2 class="zen-subhead">${esc(L.optionsHeading)}</h2>
          <label class="toggle-row">
            <span><strong>${esc(L.randomQ)}</strong></span>
            <input name="random" type="checkbox" ${s.random ? 'checked' : ''}>
            <span class="toggle-ui"></span>
          </label>
          <label class="toggle-row">
            <span><strong>${esc(L.shuffleOpt)}</strong></span>
            <input name="shuffleOptions" type="checkbox" ${s.shuffleOptions ? 'checked' : ''}>
            <span class="toggle-ui"></span>
          </label>
          <label class="toggle-row">
            <span><strong>${esc(L.untimed)}</strong></span>
            <input name="practice" type="checkbox" ${s.practice ? 'checked' : ''}>
            <span class="toggle-ui"></span>
          </label>
        </div>

        <div class="zen-candidate-group">
          <h2 class="zen-subhead">${esc(L.candidateHeading)}</h2>
          <div class="zen-field-grid">
            <label class="field">
              <span>${esc(L.candName)}</span>
              <input name="candidateName" type="text" maxlength="80" placeholder="Faiz" value="${esc(s.candidateName || '')}">
            </label>
            <label class="field">
              <span>${esc(L.candPhoto)}</span>
              <input name="candidatePhoto" id="candidate-photo-upload" type="file" accept="image/*">
            </label>
          </div>
        </div>

        <div class="zen-form-actions">
          <button class="hd-btn hd-btn-primary zen-submit-btn" type="submit" ${pool.length === 0 ? 'disabled' : ''}>
            ${esc(L.startBtn)}
          </button>
        </div>
        ${pool.length === 0 ? `<p class="hd-empty-line">${esc(t('setupPickerEmpty'))}</p>` : ''}
      </form>
    </div>`;
}

function updateCustomSetupSummary() {
  const pool = getSetupPool(state.setup);
  const count = state.setup.mode === 'full' ? (pool.length || 40) : Math.max(1, Number(state.setup.count) || 40);
  const actual = Math.min(count, pool.length);
  const big = $('.summary-big');
  if (big) big.innerHTML = `${actual}<span> / ${count} ${esc(t('pkgUnit'))}</span>`;
  const progress = $('.summary-progress span');
  if (progress) progress.style.width = `${count ? Math.min(100, (actual / count) * 100) : 0}%`;
  const submit = $('#setup-form button[type="submit"]');
  if (submit) submit.disabled = pool.length === 0;
  const durationInput = $('#setup-form input[name="duration"]');
  if (durationInput) durationInput.disabled = state.setup.practice;
  const footer = $('.custom-picker-footer');
  if (footer) footer.textContent = state.setupCustomIds.size ? `${state.setupCustomIds.size} ${t('setupPickerSelected')}` : t('setupPickerDefault');
}

function fastCleanText(html = '') {
  return String(html || '')
    .replace(/<rt[\s\S]*?<\/rt>/gi, '')
    .replace(/<rp[\s\S]*?<\/rp>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBankQuestionSearchText(q) {
  if (q._bankSearchText) return q._bankSearchText;
  const promptText = q.questionText || fastCleanText(q.prompt);
  const instrText = fastCleanText(q.instructions);
  const optText = (q.options || []).map(o => fastCleanText(o.text)).join(' ');
  const explText = fastCleanText(q.explanation);
  const pkgName = q.setName || '';
  const numText = q.questionNumber ? `soal ${q.questionNumber}` : '';
  const text = `${promptText} ${instrText} ${optText} ${explText} ${pkgName} ${q.sourcePdf || ''} ${numText}`.toLowerCase();
  q._bankSearchText = text;
  return text;
}

function generatePaginationPages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = [1];
  if (currentPage > 3) {
    pages.push('…');
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) {
    pages.push('…');
  }
  pages.push(totalPages);
  return pages;
}

function renderBank() {
  const f = state.bankFilter;
  const packages = getAvailablePackages();
  const lang = state.lang || 'id';

  let qs = [];
  let totalItems = 0;
  let pageSize = state.bankPageSize || 50;
  let totalPages = 1;
  let currentPage = 1;
  let startIdx = 0;
  let endIdx = 0;
  let pageItems = [];
  let selectedCount = 0;
  let allVisibleSelected = false;

  if (state.bankListExpanded) {
    qs = [...state.questions];

    if (f.search) {
      const term = f.search.toLowerCase().trim();
      qs = qs.filter(q => getBankQuestionSearchText(q).includes(term));
    }
    if (f.setId !== 'all') qs = qs.filter(q => q.setId === f.setId);
    if (f.media === 'with-image') qs = qs.filter(q => Boolean(q.imageMediaId || q.questionImage || q.options?.some(o => o.mediaId || o.optionImage)));
    if (f.media === 'text-only') qs = qs.filter(q => !(q.imageMediaId || q.questionImage || q.options?.some(o => o.mediaId || o.optionImage)));
    if (f.status === 'active') qs = qs.filter(q => q.active !== false);
    if (f.status === 'inactive') qs = qs.filter(q => q.active === false);

    qs.sort((a, b) => {
      if (a.setId !== b.setId) return String(a.setId).localeCompare(String(b.setId));
      if (a.questionNumber != null && b.questionNumber != null) return a.questionNumber - b.questionNumber;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    state.bankVisibleIds = qs.map(q => q.id);
    selectedCount = [...state.bankSelectedIds].filter(id => state.questions.some(q => q.id === id)).length;
    allVisibleSelected = qs.length > 0 && qs.every(q => state.bankSelectedIds.has(q.id));

    totalItems = qs.length;
    totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (state.bankPage > totalPages) state.bankPage = totalPages;
    if (state.bankPage < 1) state.bankPage = 1;
    currentPage = state.bankPage;
    startIdx = (currentPage - 1) * pageSize;
    endIdx = Math.min(startIdx + pageSize, totalItems);
    pageItems = qs.slice(startIdx, endIdx);
  } else {
    state.bankVisibleIds = [];
  }

  const kunciPackages = packages.filter(p => String(p.id).startsWith('ssw-pm-kunci-ujian-'));
  const bonusPackages = packages.filter(p => !String(p.id).startsWith('ssw-pm-kunci-ujian-'));
  const activeFilter = ['all', 'kunci', 'bonus'].includes(state.homePkgFilter) ? state.homePkgFilter : 'all';
  const visiblePackages = activeFilter === 'kunci'
    ? kunciPackages
    : activeFilter === 'bonus'
      ? bonusPackages
      : packages;

  const activePkgObj = f.setId !== 'all' ? packages.find(p => p.id === f.setId) : null;
  const activePkgIndex = activePkgObj ? packages.indexOf(activePkgObj) : 0;

  const B = lang === 'ja'
    ? {
        kicker: '問題ライブラリ＆エディタ',
        title: '問題バンク',
        meta: `全${activeQuestions().length}問 · ${packages.length}パッケージ`,
        addBtn: '問題を追加',
        importCsv: 'CSV読込',
        importJson: 'JSON読込',
        csvTpl: 'CSVテンプレート',
        exportJson: 'JSON出力',
        reloadBtn: '初期データを再読込',
        catalogTitle: 'パッケージ一覧',
        filterAll: 'すべて',
        filterKunci: '本試験キー',
        filterBonus: '追加演習',
        btnOpenQ: '問題を見る',
        btnStart: '開始',
        allPkgsBtn: 'すべてのパッケージ',
        questionsTitle: '問題バンク（個別問題）',
        soalAvailable: '問が利用可能',
        btnShowQuestions: '問題一覧を表示',
        btnHideQuestions: '問題一覧を折りたたむ',
        btnPrev: '前へ',
        btnNext: '次へ',
        pageShowing: (start, end, total) => `${total}問中 ${start}–${end}問を表示`,
        shownMeta: `${totalItems}問を表示中`,
        searchPlaceholder: '問題番号・漢字・キーワードで検索…',
        allPkgsOpt: `すべてのパッケージ (${state.questions.length})`,
        mediaAll: 'すべての形式',
        mediaImg: '図解あり',
        mediaTxt: 'テキストのみ',
        statusAll: 'すべての状態',
        statusActive: '有効',
        statusInactive: '無効',
        selectAll: 'すべて選択',
        clearSel: '選択解除',
        addSelStudy: '学習リストに追加',
        deleteSel: `選択を削除 (${selectedCount})`,
        keyLabel: '正解',
        imgTag: '図解',
        inactiveTag: '無効',
        editBtn: '編集',
        dupBtn: '複製',
        delBtn: '削除',
        emptyMsg: '条件に一致する問題がありません。',
        unitSoal: '問',
        unitImg: '図解'
      }
    : lang === 'en'
      ? {
          kicker: 'QUESTION LIBRARY & EDITOR',
          title: 'Question Bank',
          meta: `${activeQuestions().length} questions · ${packages.length} packages`,
          addBtn: 'Add Question',
          importCsv: 'Import CSV',
          importJson: 'Import JSON',
          csvTpl: 'CSV Template',
          exportJson: 'Export JSON',
          reloadBtn: 'Reload Built-in Sets',
          catalogTitle: 'Package Directory',
          filterAll: 'All',
          filterKunci: 'Exam Keys',
          filterBonus: 'Bonus Sets',
          btnOpenQ: 'Questions',
          btnStart: 'Start',
          allPkgsBtn: 'All Packages',
          questionsTitle: 'Individual Question Bank',
          soalAvailable: 'questions available',
          btnShowQuestions: 'Show question list',
          btnHideQuestions: 'Hide question list',
          btnPrev: 'Previous',
          btnNext: 'Next',
          pageShowing: (start, end, total) => `Showing ${start}–${end} of ${total}`,
          shownMeta: `${totalItems} shown`,
          searchPlaceholder: 'Search question number, kanji, or text…',
          allPkgsOpt: `All Packages (${state.questions.length})`,
          mediaAll: 'All Media',
          mediaImg: 'Illustrated',
          mediaTxt: 'Text Only',
          statusAll: 'All Status',
          statusActive: 'Active',
          statusInactive: 'Inactive',
          selectAll: 'Select all',
          clearSel: 'Clear',
          addSelStudy: 'Add to Study List',
          deleteSel: `Delete (${selectedCount})`,
          keyLabel: 'Key',
          imgTag: 'Illustrated',
          inactiveTag: 'Inactive',
          editBtn: 'Edit',
          dupBtn: 'Duplicate',
          delBtn: 'Delete',
          emptyMsg: 'No questions match the current filter.',
          unitSoal: 'questions',
          unitImg: 'illustrated'
        }
      : {
          kicker: 'PUSTAKA & EDITOR SOAL',
          title: 'Bank Soal',
          meta: `${activeQuestions().length} soal · ${packages.length} paket`,
          addBtn: 'Tambah Soal',
          importCsv: 'Impor CSV',
          importJson: 'Impor JSON',
          csvTpl: 'Template CSV',
          exportJson: 'Ekspor JSON',
          reloadBtn: 'Muat Ulang Paket',
          catalogTitle: 'Katalog Paket',
          filterAll: 'Semua',
          filterKunci: 'Kunci Ujian',
          filterBonus: 'Bonus',
          btnOpenQ: 'Daftar Soal',
          btnStart: 'Mulai',
          allPkgsBtn: 'Semua Paket',
          questionsTitle: 'Bank Soal Individual',
          soalAvailable: 'soal tersedia',
          btnShowQuestions: 'Tampilkan daftar soal',
          btnHideQuestions: 'Sembunyikan daftar soal',
          btnPrev: 'Sebelumnya',
          btnNext: 'Berikutnya',
          pageShowing: (start, end, total) => `Menampilkan soal ${start}–${end} dari ${total}`,
          shownMeta: `${totalItems} soal`,
          searchPlaceholder: 'Cari nomor soal, kanji, furigana, atau isi pilihan…',
          allPkgsOpt: `Semua Paket (${state.questions.length})`,
          mediaAll: 'Semua Media',
          mediaImg: 'Dengan Ilustrasi',
          mediaTxt: 'Teks Saja',
          statusAll: 'Semua Status',
          statusActive: 'Aktif',
          statusInactive: 'Nonaktif',
          selectAll: 'Pilih semua',
          clearSel: 'Batal Pilih',
          addSelStudy: 'Tambah ke Study List',
          deleteSel: `Hapus (${selectedCount})`,
          keyLabel: 'Kunci',
          imgTag: 'Ilustrasi',
          inactiveTag: 'Nonaktif',
          editBtn: 'Edit',
          dupBtn: 'Duplikat',
          delBtn: 'Hapus',
          emptyMsg: 'Tidak ada soal yang cocok dengan filter saat ini.',
          unitSoal: 'soal',
          unitImg: 'ilustrasi'
        };

  view.innerHTML = `
    <div class="zen-page zen-bank-page">
      <input id="csv-import-file" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" hidden>
      <input id="json-set-import-file" type="file" accept=".json,application/json" hidden>

      <header class="zen-page-head">
        <div>
          <span class="zen-kicker">${esc(B.kicker || t('bankKicker'))}</span>
          <h1 class="zen-page-title">${esc(B.title)}</h1>
          <p class="zen-page-meta">${esc(B.meta)}</p>
        </div>
        <div class="zen-head-actions">
          <button type="button" class="hd-btn hd-btn-primary hd-btn-compact" data-action="new-question">${esc(B.addBtn)}</button>
          <button type="button" class="hd-row-btn" data-action="import-csv">${esc(B.importCsv)}</button>
          <button type="button" class="hd-row-btn" data-action="import-json-set">${esc(B.importJson)}</button>
          <button type="button" class="hd-row-btn" data-action="download-csv-template">${esc(B.csvTpl)}</button>
          <button type="button" class="hd-row-btn" data-action="export-json">${esc(B.exportJson)}</button>
          <button type="button" class="hd-row-btn" data-action="reload-all-builtin">${esc(B.reloadBtn)}</button>
        </div>
      </header>

      ${activePkgObj ? `
        <section class="zen-active-pkg-bar" aria-label="${esc(B.catalogTitle)}">
          <div class="zen-active-pkg-info">
            <span class="hd-pkg-code">${esc(getHomePackageCode(activePkgObj, activePkgIndex))}</span>
            <strong class="hd-pkg-name">${esc(formatHomePackageTitle(activePkgObj).primary)}</strong>
            <span class="hd-section-meta">${activePkgObj.active} ${esc(B.unitSoal)}</span>
          </div>
          <div class="hd-pkg-actions">
            <button type="button" class="hd-row-btn" data-action="filter-package" data-id="all">${esc(B.allPkgsBtn)}</button>
            <button type="button" class="hd-row-btn hd-row-btn-primary" data-action="quick-package" data-id="${esc(activePkgObj.id)}">${esc(B.btnStart)}</button>
          </div>
        </section>
      ` : `
        <section class="hd-section zen-catalog-section" aria-labelledby="zen-catalog-heading">
          <div class="hd-section-head">
            <div class="hd-section-title-group">
              <h2 id="zen-catalog-heading" class="hd-section-title">${esc(B.catalogTitle)}</h2>
            </div>
            <div class="hd-filter-tabs" role="group" aria-label="${esc(B.catalogTitle)}">
              <button type="button" class="hd-filter-tab ${activeFilter === 'all' ? 'is-active' : ''}" data-action="set-home-pkg-filter" data-id="all" aria-pressed="${activeFilter === 'all'}">
                <span>${esc(B.filterAll)}</span>
                <span class="hd-filter-count">${packages.length}</span>
              </button>
              <button type="button" class="hd-filter-tab ${activeFilter === 'kunci' ? 'is-active' : ''}" data-action="set-home-pkg-filter" data-id="kunci" aria-pressed="${activeFilter === 'kunci'}">
                <span>${esc(B.filterKunci)}</span>
                <span class="hd-filter-count">${kunciPackages.length}</span>
              </button>
              <button type="button" class="hd-filter-tab ${activeFilter === 'bonus' ? 'is-active' : ''}" data-action="set-home-pkg-filter" data-id="bonus" aria-pressed="${activeFilter === 'bonus'}">
                <span>${esc(B.filterBonus)}</span>
                <span class="hd-filter-count">${bonusPackages.length}</span>
              </button>
            </div>
          </div>
          <div class="hd-pkg-list">
            ${visiblePackages.map((pkg, idx) => {
              const code = getHomePackageCode(pkg, idx);
              const titleObj = formatHomePackageTitle(pkg);
              const metaText = `${pkg.active} ${B.unitSoal}${pkg.withImage > 0 ? ` · ${pkg.withImage} ${B.unitImg}` : ''}`;
              return `
                <div class="hd-pkg-row">
                  <span class="hd-pkg-code" aria-hidden="true">${esc(code)}</span>
                  <div class="hd-pkg-main">
                    <span class="hd-pkg-name">${esc(titleObj.primary)}</span>
                    ${titleObj.edition ? `<span class="hd-pkg-edition">${esc(titleObj.edition)}</span>` : ''}
                  </div>
                  <span class="hd-pkg-meta">${esc(metaText)}</span>
                  <div class="hd-pkg-actions">
                    <button type="button" class="hd-row-btn" data-action="filter-package" data-id="${esc(pkg.id)}">${esc(B.btnOpenQ)}</button>
                    <button type="button" class="hd-row-btn hd-row-btn-primary" data-action="quick-package" data-id="${esc(pkg.id)}">${esc(B.btnStart)}</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      `}

      ${!state.bankListExpanded ? `
        <section class="hd-section zen-questions-section is-collapsed" aria-labelledby="zen-questions-heading">
          <div class="hd-section-head zen-q-collapse-head">
            <div class="hd-section-title-group">
              <h2 id="zen-questions-heading" class="hd-section-title">${esc(B.questionsTitle)}</h2>
              <span class="hd-section-meta">${state.questions.length.toLocaleString('id-ID')} ${esc(B.soalAvailable)}</span>
            </div>
            <button type="button" class="hd-btn hd-btn-secondary zen-toggle-bank-list-btn" data-action="toggle-bank-list" aria-expanded="false">
              <span>${esc(B.btnShowQuestions)}</span>
              <span class="zen-btn-arrow" aria-hidden="true">▼</span>
            </button>
          </div>
        </section>
      ` : `
        <section class="hd-section zen-questions-section is-expanded" aria-labelledby="zen-questions-heading">
          <div class="hd-section-head zen-q-collapse-head">
            <div class="hd-section-title-group">
              <h2 id="zen-questions-heading" class="hd-section-title">${esc(B.questionsTitle)}</h2>
              <span class="hd-section-meta">${esc(B.shownMeta)}</span>
            </div>
            <div class="zen-collapse-head-actions">
              <button type="button" class="hd-btn hd-btn-secondary zen-toggle-bank-list-btn" data-action="toggle-bank-list" aria-expanded="true">
                <span>${esc(B.btnHideQuestions)}</span>
                <span class="zen-btn-arrow" aria-hidden="true">▲</span>
              </button>
            </div>
          </div>

          <div class="zen-bulk-bar">
            <label class="zen-select-all">
              <input id="bank-select-visible" type="checkbox" data-select-visible-questions aria-label="${esc(B.selectAll)}" ${allVisibleSelected ? 'checked' : ''} ${qs.length ? '' : 'disabled'}>
              <span>${esc(B.selectAll)}</span>
            </label>
            <button type="button" class="hd-row-btn" data-action="clear-question-selection" ${selectedCount ? '' : 'disabled'}>${esc(B.clearSel)}</button>
            <button type="button" class="hd-row-btn zen-bulk-study-btn" data-action="bulk-add-study" ${selectedCount ? '' : 'disabled'} title="${esc(B.addSelStudy || 'Tambah ke Study List')}" aria-label="${esc(B.addSelStudy || 'Tambah ke Study List')}">
              <svg class="zen-bulk-plus-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>${esc(B.addSelStudy || 'Tambah ke Study List')}</span>
            </button>
            <button type="button" class="hd-row-btn zen-danger-btn" data-action="delete-selected-questions" ${selectedCount ? '' : 'disabled'}>${esc(B.deleteSel)}</button>
          </div>

          <div class="zen-filter-bar">
            <input id="bank-search" class="zen-search-input" type="search" placeholder="${esc(B.searchPlaceholder)}" value="${esc(f.search)}">
            <select id="bank-package-filter" aria-label="Filter paket soal">
              <option value="all">${esc(B.allPkgsOpt)}</option>
              ${packages.map(p => `<option value="${esc(p.id)}" ${f.setId === p.id ? 'selected' : ''}>${esc(formatHomePackageTitle(p).primary)} (${p.total})</option>`).join('')}
            </select>
            <select id="bank-media-filter" aria-label="Filter media">
              <option value="all" ${f.media === 'all' ? 'selected' : ''}>${esc(B.mediaAll)}</option>
              <option value="with-image" ${f.media === 'with-image' ? 'selected' : ''}>${esc(B.mediaImg)}</option>
              <option value="text-only" ${f.media === 'text-only' ? 'selected' : ''}>${esc(B.mediaTxt)}</option>
            </select>
            <select id="bank-status-filter" aria-label="Filter status">
              <option value="all" ${f.status === 'all' ? 'selected' : ''}>${esc(B.statusAll)}</option>
              <option value="active" ${f.status === 'active' ? 'selected' : ''}>${esc(B.statusActive)}</option>
              <option value="inactive" ${f.status === 'inactive' ? 'selected' : ''}>${esc(B.statusInactive)}</option>
            </select>
          </div>

          <div class="zen-q-list">
            ${pageItems.length ? pageItems.map(q => {
              const img = getQuestionMainMedia(q);
              const hasImg = Boolean(img || q.options?.some(o => o.mediaId || o.optionImage));
              const keyLetter = Number.isInteger(q.correctIndex) ? String.fromCharCode(65 + q.correctIndex) : 'A';
              const pkgLabel = formatHomePackageTitle({ name: packageName(q) }).primary;
              const inStudy = isQuestionInStudy(q);
              return `
                <article class="zen-q-item">
                  <div class="zen-q-top">
                    <div class="zen-q-meta">
                      <input type="checkbox" data-question-select="${esc(q.id)}" aria-label="Pilih soal #${q.questionNumber || ''}" ${state.bankSelectedIds.has(q.id) ? 'checked' : ''}>
                      <strong class="zen-q-num">#${q.questionNumber || '1'}</strong>
                      ${f.setId === 'all' ? `<span class="zen-q-pkg">${esc(pkgLabel)}</span>` : ''}
                      <span class="zen-q-key">${esc(B.keyLabel)} ${esc(keyLetter)}</span>
                      ${hasImg ? `<span class="zen-q-tag">${esc(B.imgTag)}</span>` : ''}
                      ${q.active === false ? `<span class="zen-q-tag">${esc(B.inactiveTag)}</span>` : ''}
                    </div>
                    <div class="zen-q-actions">
                      <button type="button" class="hd-row-btn zen-study-btn ${inStudy ? 'is-active' : ''}" data-action="toggle-bank-study" data-id="${esc(q.id)}" title="${inStudy ? esc(t('studyRemoveTooltip')) : esc(t('studyAddTooltip'))}" aria-label="${inStudy ? esc(t('studyRemoveTooltip')) : esc(t('studyAddTooltip'))}" aria-pressed="${inStudy}">
                        <svg class="zen-study-icon" viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M2 7h10M7 2v10"></path>
                        </svg>
                      </button>
                      <button type="button" class="hd-row-btn" data-action="edit-question" data-id="${esc(q.id)}">${esc(B.editBtn)}</button>
                      <button type="button" class="hd-row-btn" data-action="duplicate-question" data-id="${esc(q.id)}">${esc(B.dupBtn)}</button>
                      <button type="button" class="hd-row-btn zen-danger-btn" data-action="delete-question" data-id="${esc(q.id)}">${esc(B.delBtn)}</button>
                    </div>
                  </div>
                  <div class="zen-q-prompt rich-content" lang="ja">${richHTML(q.prompt || '(pertanyaan kosong)')}</div>
                  <div class="zen-q-options rich-content" lang="ja">
                    ${(q.options || []).map((o, i) => `
                      <div class="zen-q-opt ${i === q.correctIndex ? 'is-key' : ''}">
                        <span class="zen-q-opt-letter">${String.fromCharCode(65 + i)}.</span>
                        <span class="zen-q-opt-text">${richHTML(o.text)}</span>
                      </div>
                    `).join('')}
                  </div>
                </article>
              `;
            }).join('') : `<p class="hd-empty-line">${esc(B.emptyMsg)}</p>`}
          </div>

          <div class="zen-pagination">
            <div class="zen-pagination-info">
              ${totalItems > 0 ? `${esc(B.pageShowing(startIdx + 1, endIdx, totalItems.toLocaleString('id-ID')))}` : esc(B.emptyMsg)}
            </div>
            ${totalPages > 1 ? `
              <nav class="zen-pagination-nav" aria-label="Navigasi halaman soal">
                <button type="button" class="hd-row-btn zen-page-nav-btn" data-action="bank-prev-page" ${currentPage === 1 ? 'disabled aria-disabled="true"' : ''}>
                  ‹ ${esc(B.btnPrev)}
                </button>
                <div class="zen-page-numbers">
                  ${generatePaginationPages(currentPage, totalPages).map(p => {
                    if (p === '…') {
                      return `<span class="zen-page-ellipsis" aria-hidden="true">…</span>`;
                    }
                    const isCurrent = p === currentPage;
                    return `
                      <button type="button" class="zen-page-num-btn ${isCurrent ? 'is-active' : ''}" data-action="bank-go-page" data-page-num="${p}" ${isCurrent ? 'aria-current="page"' : ''}>
                        ${p}
                      </button>
                    `;
                  }).join('')}
                </div>
                <button type="button" class="hd-row-btn zen-page-nav-btn" data-action="bank-next-page" ${currentPage === totalPages ? 'disabled aria-disabled="true"' : ''}>
                  ${esc(B.btnNext)} ›
                </button>
              </nav>
            ` : ''}
          </div>
        </section>
      `}
    </div>`;
}

// CSV Importer for SSW PM
const CSV_MAP_FIELDS = [
  { key: 'setName', label: 'Nama Paket Soal', aliases: ['setname','set name','package','paket','nama paket','sumber'] },
  { key: 'questionNumber', label: 'Nomor Soal', aliases: ['questionnumber','question number','nomor','no','nomor soal','number'] },
  { key: 'prompt', label: 'Pertanyaan Bahasa Jepang', required: true, aliases: ['prompt','question','pertanyaan','soal','question text','teks soal','teks pertanyaan','問題','問題文','jp'] },
  { key: 'instructions', label: 'Instruksi Soal', aliases: ['instructions','instruction','instruksi','petunjuk','perintah','指示'] },
  { key: 'optionA', label: 'Pilihan A', required: true, aliases: ['option a','option_a','optiona','choice a','opsi a','pilihan a','jawaban a','選択肢a','a'] },
  { key: 'optionB', label: 'Pilihan B', required: true, aliases: ['option b','option_b','optionb','choice b','opsi b','pilihan b','jawaban b','選択肢b','b'] },
  { key: 'optionC', label: 'Pilihan C', aliases: ['option c','option_c','optionc','choice c','opsi c','pilihan c','jawaban c','選択肢c','c'] },
  { key: 'correctAnswer', label: 'Kunci Jawaban (A/B/C)', required: true, aliases: ['correctanswer','correct answer','correct_answer','answer key','kunci','kunci jawaban','jawaban benar','answer','正解'] },
  { key: 'explanation', label: 'Pembahasan / Catatan', aliases: ['explanation','pembahasan','penjelasan','catatan','解説'] },
  { key: 'active', label: 'Status Aktif (Opsional)', aliases: ['active','aktif','status','enabled'] }
];

function csvNorm(value) {
  return String(value ?? '').trim().toLocaleLowerCase('id-ID').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[_.\-/]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function countCsvDelimiter(line, delimiter) {
  let count = 0, quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (quoted && line[i+1] === '"') i++; else quoted = !quoted; }
    else if (!quoted && c === delimiter) count++;
  }
  return count;
}
function parseCSVText(text) {
  text = String(text ?? '').replace(/^\uFEFF/, '');
  const sampleLines = text.split(/\r?\n/).filter(line => line.trim()).slice(0, 8);
  const delimiters = [',', ';', '\t'];
  const delimiter = delimiters.map(d => ({ d, score: sampleLines.reduce((n, line) => n + countCsvDelimiter(line, d), 0) }))
    .sort((a,b) => b.score - a.score)[0]?.d || ',';
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i+1] === '"') { field += '"'; i++; }
      else if (quoted) quoted = false;
      else if (!field.length) quoted = true;
      else field += c;
    } else if (c === delimiter && !quoted) { row.push(field); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i+1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); if (row.some(cell => String(cell).trim() !== '')) rows.push(row); }
  if (quoted) throw new Error('Format CSV tidak lengkap: ada tanda kutip yang belum ditutup.');
  if (!rows.length || rows.length < 2) throw new Error('CSV kosong atau hanya memiliki header.');
  const rawHeaders = rows.shift();
  const headers = rawHeaders.map((h, i) => String(h ?? '').trim() || `Kolom ${i+1}`);
  const dataRows = rows.map(r => headers.map((_, i) => String(r[i] ?? '')));
  return { headers, rows: dataRows, delimiter };
}
function suggestCsvHeader(headers, field) {
  const aliases = field.aliases.map(csvNorm);
  const normalized = headers.map(csvNorm);
  let index = normalized.findIndex(h => aliases.includes(h));
  if (index < 0) {
    const specificAliases = aliases.filter(a => a.length >= 6).sort((a,b) => b.length - a.length);
    for (const alias of specificAliases) {
      index = normalized.findIndex(h => h.startsWith(alias + ' ') || h.endsWith(' ' + alias));
      if (index >= 0) break;
    }
  }
  return index >= 0 ? index : null;
}
function csvAnswerIndex(answer, options) {
  const raw = String(answer ?? '').trim(); if (!raw) return null;
  const n = csvNorm(richPlainText(raw));
  let exact = options.findIndex(o => csvNorm(richPlainText(o.text)) === n);
  if (exact >= 0) return exact;
  let m = n.match(/^(?:(?:option|choice|pilihan|opsi|jawaban)\s*)?([a-f])$/i);
  if (m) { const source = m[1].toUpperCase().charCodeAt(0) - 65; return options.findIndex(o => o.sourceSlot === source); }
  m = n.match(/^(?:(?:option|choice|pilihan|opsi)\s*)?([1-6])$/i);
  if (m) return Number(m[1]) - 1 < options.length ? Number(m[1]) - 1 : null;
  return null;
}
function csvFieldValue(row, field) {
  const index = state.csvImport?.mapping?.[field];
  return index == null ? '' : String(row[index] ?? '').trim();
}
function makeCSVQuestion(row, rowNumber) {
  const draft = state.csvImport;
  const errors = [];
  const prompt = sanitizeRichHTML(csvFieldValue(row, 'prompt'));
  if (!richPlainText(prompt) && !/<img\b/i.test(prompt)) errors.push('Pertanyaan kosong.');
  const optionFields = ['optionA','optionB','optionC'];
  const options = optionFields
    .map((field, sourceSlot) => ({ id: String.fromCharCode(65 + sourceSlot), text: sanitizeRichHTML(csvFieldValue(row, field)), mediaId: '', sourceSlot }))
    .filter(o => richPlainText(o.text) !== '' || /<img\b/i.test(o.text));
  if (options.length < 2) errors.push('Minimal dua pilihan terisi (A dan B).');
  const answerRaw = csvFieldValue(row, 'correctAnswer');
  const correctIndex = csvAnswerIndex(answerRaw, options);
  if (correctIndex == null || correctIndex < 0 || correctIndex >= options.length) {
    errors.push(`Kunci jawaban “${answerRaw || '(kosong)'}” tidak cocok. Gunakan A, B, atau C.`);
  }
  const activeRaw = csvFieldValue(row, 'active');
  const active = !['0','false','no','tidak','nonaktif','inactive','off'].includes(csvNorm(activeRaw));
  const rawSetName = csvFieldValue(row, 'setName') || draft.defaults.setName || 'Paket Impor CSV SSW PM';
  const setId = csvNorm(rawSetName).replace(/\s+/g, '-') || 'ssw-pm-csv';
  const qNum = Number.parseInt(csvFieldValue(row, 'questionNumber'), 10) || (rowNumber + 1);
  const q = {
    id: uid('ssw-q'),
    setId,
    setName: rawSetName,
    questionNumber: qNum,
    points: 3.75,
    prompt,
    questionText: richPlainText(prompt),
    instructions: sanitizeRichHTML(csvFieldValue(row, 'instructions')) || '<ruby>正<rt>ただ</rt></ruby>しいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。',
    options: options.map(({ id, text, mediaId }) => ({ id, text, mediaId })),
    correctIndex,
    correctAnswer: correctIndex != null ? String.fromCharCode(65 + correctIndex) : '',
    explanation: sanitizeRichHTML(csvFieldValue(row, 'explanation')),
    imageMediaId: '',
    imageSize: 'medium',
    imageRatio: 'auto',
    imagePosition: 'center',
    media: [],
    active,
    createdAt: Date.now() + rowNumber,
    updatedAt: Date.now() + rowNumber
  };
  errors.push(...validateQuestion(q));
  return { rowNumber, q, errors: [...new Set(errors)] };
}
function csvQuestionKey(q) {
  return `${q.setId || ''}|${richPlainText(q.prompt || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ja-JP')}`;
}
function csvPreviewRows() {
  const draft = state.csvImport; if (!draft) return [];
  const seen = new Set(state.questions.map(csvQuestionKey));
  return draft.rows.map((row, i) => {
    const result = makeCSVQuestion(row, i);
    if (!result.errors.length) {
      const key = csvQuestionKey(result.q);
      const duplicate = seen.has(key);
      result.duplicate = duplicate;
      if (!duplicate || !draft.skipDuplicates) seen.add(key);
    }
    return result;
  });
}
function renderCSVImportModal() {
  const d = state.csvImport; if (!d) return;
  const previews = csvPreviewRows();
  const valid = previews.filter(x => !x.errors.length && !(x.duplicate && d.skipDuplicates));
  const invalid = previews.filter(x => x.errors.length);
  const duplicates = previews.filter(x => x.duplicate && !x.errors.length);
  const mappingHTML = CSV_MAP_FIELDS.map(f => {
    const opts = `<option value="">— Tidak dipetakan —</option>` + d.headers.map((h,i)=>`<option value="${i}" ${d.mapping[f.key] === i ? 'selected' : ''}>Kolom ${i+1} · ${esc(h)}</option>`).join('');
    return `<div class="csv-map-row ${f.required ? 'is-required' : ''}">
      <div class="csv-map-target"><div class="csv-map-target-title"><strong>${esc(f.label)}</strong>${f.required ? '<span class="csv-required-tag">Wajib</span>' : '<span class="csv-optional-tag">Opsional</span>'}</div></div>
      <div class="csv-map-source"><select data-csv-map="${f.key}">${opts}</select></div>
    </div>`;
  }).join('');
  const previewHTML = previews.slice(0, 10).map(x => {
    const status = x.errors.length ? `<span class="status status-warn">Lewati</span>` : x.duplicate && d.skipDuplicates ? `<span class="status status-neutral">Duplikat</span>` : `<span class="status status-on">Siap</span>`;
    return `<tr><td>${x.rowNumber + 2}</td><td><div class="csv-preview-prompt rich-content">${richHTML(x.q.prompt || '(kosong)')}</div></td><td class="csv-preview-options rich-content">${x.q.options.map((o,i)=>`<div><strong>${String.fromCharCode(65+i)}.</strong> ${richHTML(o.text)}</div>`).join('')}</td><td>${esc(x.q.correctAnswer || '—')}</td><td>${status}</td></tr>`;
  }).join('');
  const content = `<div class="csv-import-content">
    <div class="notice notice-neutral csv-import-note"><strong>File: ${esc(d.fileName)}</strong><p>${d.rows.length} baris data terdeteksi. Mendukung HTML <code>&lt;ruby&gt;&lt;rt&gt;</code> untuk furigana.</p></div>
    <div class="csv-map-table"><div class="csv-map-table-head"><span>FIELD DI SSW PM MOCK TEST</span><span>KOLOM SUMBER CSV</span></div><div class="csv-map-list">${mappingHTML}</div></div>
    <div class="csv-import-stats"><span><strong>${valid.length}</strong> siap impor</span><span><strong>${invalid.length}</strong> bermasalah</span><span><strong>${d.skipDuplicates ? duplicates.length : 0}</strong> duplikat dilewati</span></div>
    <div class="table-wrap csv-preview-wrap"><table class="csv-preview-table"><thead><tr><th>Baris</th><th>Pertanyaan</th><th>Pilihan A/B/C</th><th>Kunci</th><th>Status</th></tr></thead><tbody>${previewHTML}</tbody></table></div>
  </div>`;
  modal('Impor Bank Soal SSW PM dari CSV', content, `<button type="button" class="button button-outline" data-action="close-csv-import">Batal</button><button type="button" class="button button-primary" data-action="apply-csv-import" ${valid.length ? '' : 'disabled'}>Impor ${valid.length} Soal</button>`);
}
async function openCSVImport(file) {
  if (!file) return;
  const parsed = parseCSVText(await file.text());
  const mapping = {};
  for (const field of CSV_MAP_FIELDS) mapping[field.key] = suggestCsvHeader(parsed.headers, field);
  state.csvImport = {
    fileName: file.name,
    headers: parsed.headers,
    rows: parsed.rows,
    delimiter: parsed.delimiter,
    mapping,
    defaults: { setName: 'Paket CSV SSW PM' },
    skipDuplicates: true
  };
  renderCSVImportModal();
}
async function applyCSVImport() {
  if (!state.csvImport) return;
  const rows = csvPreviewRows();
  const accepted = rows.filter(x => !x.errors.length && !(x.duplicate && state.csvImport.skipDuplicates));
  if (!accepted.length) { toast('Tidak ada baris valid untuk diimpor.', 'warn'); return; }
  let saved = 0;
  for (const item of accepted) { await put('questions', item.q); saved++; }
  state.csvImport = null;
  closeModal();
  await reloadData();
  state.page = 'bank';
  renderBank();
  toast(`Impor CSV selesai: ${saved} soal ditambahkan ke Bank Soal.`, 'success');
}
function downloadCSVTemplate() {
  const headers = ['setName','questionNumber','prompt','instructions','optionA','optionB','optionC','correctAnswer','explanation','active'];
  const sample = [
    'Paket Latihan SSW PM',
    '1',
    '<ruby>安全<rt>あんぜん</rt></ruby>ではない<ruby>食品<rt>しょくひん</rt></ruby>を<ruby>作<rt>つく</rt></ruby>って、それが<ruby>売<rt>う</rt></ruby>られてしまうとどうなりますか。',
    '<ruby>正<rt>ただ</rt></ruby>しいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。',
    '<ruby>給料<rt>きゅうりょう</rt></ruby>が<ruby>下<rt>さ</rt></ruby>がる',
    '<ruby>会社<rt>かいしゃ</rt></ruby>の<ruby>信用<rt>しんよう</rt></ruby>が<ruby>落<rt>お</rt></ruby>ちる',
    '<ruby>別<rt>べつ</rt></ruby>の<ruby>商品<rt>しょうひん</rt></ruby>が<ruby>売<rt>う</rt></ruby>れる',
    'B',
    'Contoh soal SSW PM dengan furigana HTML ruby',
    'true'
  ];
  const csv = '\uFEFF' + headers.map(h => `"${h}"`).join(',') + '\r\n' + sample.map(v => `"${v.replace(/"/g, '""')}"`).join(',') + '\r\n';
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'ssw-pm-mock-test-template.csv');
  toast('Template CSV SSW PM berhasil diunduh.', 'success');
}

function renderHistory() {
  const hist = [...state.sessions]
    .filter(s => s.status !== 'in_progress')
    .sort((a, b) => (b.endedAt || b.startedAt || 0) - (a.endedAt || a.startedAt || 0));
  const loc = t('locale');

  view.innerHTML = `
    <div class="zen-page zen-history-page">
      <header class="zen-page-head">
        <div>
          <span class="zen-kicker">${esc(t('histKicker'))}</span>
          <h1 class="zen-page-title">${esc(t('navHistory'))}</h1>
        </div>
        <div class="zen-page-head-actions">
          <span class="zen-meta-count">${hist.length} ${esc(t('unitSessions'))}</span>
          <button type="button" class="hd-btn-primary" data-page="setup">${esc(t('topStartExam'))}</button>
        </div>
      </header>

      <section class="zen-history-section">
        ${hist.length ? `
          <div class="hd-history-table-wrap">
            <table class="hd-history-table zen-history-table">
              <thead>
                <tr>
                  <th>${esc(t('thDate'))}</th>
                  <th>${esc(t('thPkg'))}</th>
                  <th>${esc(t('thMode'))}</th>
                  <th>${esc(t('thCorrect'))}</th>
                  <th>${esc(t('thPointScore'))}</th>
                  <th>${esc(t('thAccuracy'))}</th>
                  <th>${esc(t('thTime'))}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${hist.map(s => {
                  const st = rawStats(s);
                  const elapsed = s.elapsedSeconds ?? Math.max(0, Math.floor(((s.endedAt || Date.now()) - s.startedAt) / 1000));
                  const cleanTitle = formatHomeSessionTitle(s);
                  return `<tr>
                    <td class="hd-col-date" data-label="${esc(t('thDate'))}">${fmtDate(s.endedAt || s.startedAt, loc)}</td>
                    <td class="hd-col-pkg" data-label="${esc(t('thPkg'))}">
                      <div>
                        <strong class="hd-session-title">${esc(cleanTitle)}</strong>
                        <span class="zen-table-sub">${esc(s.candidateName || 'Faiz')}</span>
                      </div>
                    </td>
                    <td class="hd-col-mode" data-label="${esc(t('thMode'))}">${s.mode === 'practice' ? esc(t('modePractice')) : esc(t('modeExam'))}</td>
                    <td class="hd-col-score" data-label="${esc(t('thCorrect'))}">${st.correct} / ${st.total}</td>
                    <td class="hd-col-points" data-label="${esc(t('thPointScore'))}"><span>${st.weightedScore} <span class="hd-muted">/ ${st.maxWeightedScore}</span></span></td>
                    <td class="hd-col-pct" data-label="${esc(t('thAccuracy'))}"><strong>${st.percent}%</strong></td>
                    <td class="hd-col-time" data-label="${esc(t('thTime'))}">${fmtDuration(elapsed)}</td>
                    <td class="hd-col-action">
                      <div class="zen-row-actions">
                        <button type="button" class="hd-row-btn" data-action="open-result" data-id="${esc(s.id)}">${esc(t('btnReview'))}</button>
                        <button type="button" class="hd-row-btn zen-danger-btn" data-action="delete-history" data-id="${esc(s.id)}" title="${esc(t('btnDelete'))}">${esc(t('btnDelete'))}</button>
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="zen-empty-block">
            <p class="hd-empty-line">${esc(t('emptyHistTitle'))}</p>
            <button type="button" class="hd-btn-secondary" data-page="setup">${esc(t('topStartExam'))}</button>
          </div>
        `}
      </section>
    </div>`;
}

function renderBackup() {
  const qMB = state.questions.reduce((n, q) => n + (q.media || []).reduce((x, m) => x + (m.blob?.size || (m.dataUrl ? Math.round(m.dataUrl.length * 0.75) : 0)), 0), 0);
  const packages = getAvailablePackages();
  view.innerHTML = `
    <div class="zen-page zen-backup-page">
      <header class="zen-page-head">
        <div>
          <span class="zen-kicker">${esc(t('backupKicker'))}</span>
          <h1 class="zen-page-title">${esc(t('backupTitle'))}</h1>
          <p class="zen-page-meta">${state.questions.length} ${esc(t('unitSoal'))} · ${packages.filter(p => p.total > 0).length} ${esc(t('unitPackages'))} · ${state.sessions.length} ${esc(t('unitSessions'))} · ${(qMB / 1024 / 1024).toFixed(1)} MB</p>
        </div>
      </header>

      <section class="zen-section-block">
        <div class="zen-section-head">
          <h2 class="hd-section-title">${esc(t('backupSecBackup'))}</h2>
        </div>
        <div class="zen-backup-grid">
          <div class="zen-backup-col">
            <h3 class="zen-subhead">${esc(t('backupExportTitle'))}</h3>
            <p class="zen-copy">${esc(t('backupExportDesc'))}</p>
            <div class="zen-btn-row">
              <button type="button" class="hd-btn-primary" data-action="export-zip">${esc(t('backupBtnZip'))}</button>
              <button type="button" class="hd-btn-secondary" data-action="export-json">${esc(t('backupBtnJson'))}</button>
            </div>
          </div>

          <div class="zen-backup-col">
            <h3 class="zen-subhead">${esc(t('backupRestoreTitle'))}</h3>
            <p class="zen-copy">${esc(t('backupRestoreDesc'))}</p>
            <div class="zen-file-row">
              <label class="hd-btn-secondary zen-file-trigger" for="backup-file">
                ${esc(t('backupBtnChooseFile'))}
                <input id="backup-file" type="file" accept=".zip,.json,application/json,application/zip" hidden>
              </label>
              <span id="import-status" class="zen-file-status">${esc(t('backupStatusNoFile'))}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="zen-section-block">
        <div class="zen-section-head">
          <h2 class="hd-section-title">${esc(t('backupSecPrefs'))}</h2>
        </div>
        <form id="settings-form" class="zen-form">
          <div class="zen-field-grid zen-field-grid-2">
            <label class="zen-field">
              <span class="zen-label">${esc(t('backupFieldDuration'))}</span>
              <input name="standardDuration" type="number" min="1" max="300" value="${state.settings.standardDuration}">
            </label>
            <label class="zen-field">
              <span class="zen-label">${esc(t('backupFieldCount'))}</span>
              <input name="standardCount" type="number" min="1" max="500" value="${state.settings.standardCount}">
            </label>
          </div>

          <div class="zen-toggle-group">
            <label class="zen-check-row">
              <input name="resumeInterrupted" type="checkbox" ${state.settings.resumeInterrupted ? 'checked' : ''}>
              <span>${esc(t('backupToggleResume'))}</span>
            </label>
            <label class="zen-check-row">
              <input name="defaultShowFurigana" type="checkbox" ${state.examPrefs.showFurigana ? 'checked' : ''}>
              <span>${esc(t('backupToggleFurigana'))}</span>
            </label>
          </div>

          <div class="zen-form-footer zen-form-footer-split">
            <button class="hd-btn-primary" type="submit">${esc(t('backupBtnSave'))}</button>
            <button type="button" class="hd-text-btn hd-text-danger" data-action="clear-all-data">${esc(t('backupBtnReset'))}</button>
          </div>
        </form>
      </section>
    </div>`;
}

function defaultQuestion(prefill = {}) {
  return {
    id: uid('ssw-q'),
    setId: 'ssw-pm-kunci-ujian-1',
    setName: 'Soal Ujian 1 — CBTP Gino1',
    questionNumber: state.questions.filter(q => q.setId === (prefill.setId || 'ssw-pm-kunci-ujian-1')).length + 1,
    sourcePdf: 'Kunci Soal Ujian 1.pdf',
    sourcePage: 1,
    points: 3.75,
    prompt: '',
    promptTranslation: '',
    questionText: '',
    instructions: '<ruby>正<rt>ただ</rt></ruby>しいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。',
    options: [
      { id: 'A', text: '', translation: '', mediaId: '' },
      { id: 'B', text: '', translation: '', mediaId: '' },
      { id: 'C', text: '', translation: '', mediaId: '' }
    ],
    correctIndex: 0,
    correctAnswer: 'A',
    explanation: '',
    imageMediaId: '',
    questionImage: '',
    imageSize: 'medium',
    imageRatio: 'auto',
    imagePosition: 'center',
    media: [],
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...prefill
  };
}

function mediaControl(q, kind, mediaId, accept, label) {
  const m = getQuestionMainMedia(q);
  const url = m ? mediaURL(m) : '';
  return `<div class="media-control">
    <div class="media-preview">${m && url ? `<img src="${url}" alt="Preview ilustrasi soal">` : `<div class="media-empty">▧<span>Belum ada ilustrasi gambar</span></div>`}</div>
    <div class="media-control-meta">
      <div>
        <strong>${m ? esc(m.name) : label}</strong>
        <small>${m?.blob ? `${(m.blob.size / 1024).toFixed(0)} KB · ${esc(m.blob.type || 'image')}` : (m?.path ? `Path: ${esc(m.path)}` : accept)}</small>
      </div>
      <div class="media-actions">
        <label class="button button-small button-outline file-button">${m ? 'Ganti Gambar' : 'Pilih Gambar'}<input type="file" data-media-kind="${kind}" accept="${accept}" hidden></label>
        ${m ? `<button type="button" class="text-button danger-text" data-action="remove-media" data-kind="${kind}">Hapus</button>` : ''}
      </div>
    </div>
  </div>`;
}

function richToolbarHTML(compact = false) {
  const tools = compact
    ? [
        ['bold','B','Tebal'], ['italic','I','Miring'], ['underline','U','Garis bawah'],
        ['foreColor','A','Warna teks', '#c0392b'], ['backColor','▰','Sorot teks', '#fff0a8']
      ]
    : [
        ['bold','B','Tebal'], ['italic','I','Miring'], ['underline','U','Garis bawah'], ['strikeThrough','S','Coret'],
        ['foreColor','A','Warna teks', '#c0392b'], ['backColor','▰','Sorot teks', '#fff0a8'],
        ['insertUnorderedList','• List','Daftar poin'], ['insertOrderedList','1. List','Daftar angka'], ['removeFormat','Tx','Hapus format']
      ];
  return `<div class="rich-editor-toolbar ${compact ? 'is-compact' : ''}" role="toolbar" aria-label="Pemformatan teks">${tools.map(([cmd,label,title,value]) => `<button type="button" data-rich-command="${cmd}" ${value ? `data-rich-value="${value}"` : ''} title="${title}" aria-label="${title}">${label === 'B' ? '<b>B</b>' : label === 'I' ? '<i>I</i>' : label === 'U' ? '<u>U</u>' : label === 'S' ? '<s>S</s>' : label}</button>`).join('')}<span class="rich-toolbar-tip">Mendukung &lt;ruby&gt;漢字&lt;rt&gt;かんじ&lt;/rt&gt;&lt;/ruby&gt;</span></div>`;
}

function richEditorControl(name, value, placeholder = 'Ketik atau tempel di sini…', options = {}) {
  const disabled = options.disabled ? 'contenteditable="false" aria-readonly="true"' : 'contenteditable="true"';
  const size = options.size || 'medium';
  return `<div class="rich-editor-shell ${options.compact ? 'rich-editor-compact' : ''}">${richToolbarHTML(Boolean(options.compact))}<div class="rich-editor-input rich-content rich-editor-${size}" data-rich-field="${esc(name)}" ${disabled} role="textbox" aria-multiline="true" aria-label="${esc(options.label || name)}" data-placeholder="${esc(placeholder)}">${richHTML(value || '')}</div></div>`;
}

function richEditorField(name, label, value, placeholder = 'Ketik atau tempel di sini…', options = {}) {
  return `<div class="field rich-field"><span>${label}</span>${richEditorControl(name, value, placeholder, { ...options, label })}${options.help ? `<small>${options.help}</small>` : ''}</div>`;
}

function renderQuestionPreviewMarkup(q) {
  const mainImage = getQuestionMainMedia(q);
  return `<section class="question-author-preview">
    <div class="question-author-preview-head"><strong>Preview Soal SSW PM</strong><span>Tampilan beserta furigana dan ilustrasi</span></div>
    <div class="question-author-preview-card">
      <div class="question-author-preview-instructions rich-content">${richHTML(q.instructions || '')}</div>
      <div class="question-author-preview-prompt rich-content" lang="ja">${richHTML(q.prompt || '<span class="muted">Pertanyaan belum diisi.</span>')}</div>
      ${mainImage ? `<img class="question-author-preview-image" src="${mediaURL(mainImage)}" alt="Ilustrasi soal">` : ''}
      <div class="question-author-preview-options">
        ${(q.options || []).map((o,i) => {
          const media = getOptionMedia(q,o,i);
          return `<div class="question-author-preview-option ${i===q.correctIndex?'is-correct':''}">
            <span class="question-author-preview-letter">${String.fromCharCode(65+i)}</span>
            <div class="rich-content" lang="ja">${richHTML(o.text || '(opsi kosong)')}</div>
            ${media ? `<img src="${mediaURL(media)}" alt="Gambar opsi">` : ''}
            ${i===q.correctIndex ? '<small>Kunci Benar</small>' : ''}
          </div>`;
        }).join('')}
      </div>
    </div>
  </section>`;
}

function renderQuestionEditor() {
  const q = state.editor.q;
  const modalTitle = state.editor.isNew ? 'Tambah Soal Baru' : `Edit Soal #${q.questionNumber || ''}`;
  const packages = getAvailablePackages();
  const content = `<form id="question-editor" class="form-stack editor-form zen-editor-form">
    ${state.editor.previewVisible ? renderQuestionPreviewMarkup(q) : ''}
    <div class="three-fields">
      <label class="field">
        <span>Paket Soal</span>
        <select name="setId">
          ${packages.map(p => `<option value="${esc(p.id)}" ${q.setId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
        </select>
      </label>
      <label class="field">
        <span>Nomor Soal</span>
        <input name="questionNumber" type="number" min="1" max="500" value="${esc(q.questionNumber || 1)}">
      </label>
      <label class="field">
        <span>Halaman Sumber</span>
        <input name="sourcePage" type="number" min="1" max="200" value="${esc(q.sourcePage || q.pdfPage || 1)}">
      </label>
    </div>
    ${richEditorField('prompt','Pertanyaan Bahasa Jepang',q.prompt,'Tulis pertanyaan bahasa Jepang…',{size:'large'})}
    ${richEditorField('promptTranslation','Terjemahan Pertanyaan (Bahasa Indonesia · Ditampilkan Setelah Finish Exam)',q.promptTranslation || q.translation || '','Tulis terjemahan Bahasa Indonesia untuk pertanyaan ini…',{size:'small'})}
    ${richEditorField('instructions','Instruksi Soal',q.instructions,'Instruksi soal',{size:'small'})}
    <div class="field">
      <span>Ilustrasi Soal (Opsional)</span>
      ${mediaControl(q,'image',q.imageMediaId,'image/jpeg,image/png,image/webp','Pilih ilustrasi JPG, PNG, atau WebP')}
      <div class="three-fields">
        <label class="field"><span>Ukuran</span><select name="imageSize">${[['compact','Kompak'],['medium','Sedang'],['large','Lebar']].map(([v,l])=>`<option value="${v}" ${q.imageSize===v?'selected':''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Rasio</span><select name="imageRatio">${[['auto','Asli'],['landscape','16:9'],['square','1:1'],['portrait','3:4']].map(([v,l])=>`<option value="${v}" ${q.imageRatio===v?'selected':''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Posisi</span><select name="imagePosition">${[['left','Kiri'],['center','Tengah'],['right','Kanan']].map(([v,l])=>`<option value="${v}" ${q.imagePosition===v?'selected':''}>${l}</option>`).join('')}</select></label>
      </div>
    </div>
    <div class="editor-section-title">
      <div><h3>Pilihan Jawaban</h3></div>
      <button type="button" class="hd-btn-secondary" data-action="add-option" ${q.options.length >= 6 ? 'disabled' : ''}>Tambah Opsi</button>
    </div>
    <div class="option-editor-list">
      ${q.options.map((o, i) => `
        <div class="option-editor" data-option-row="${i}">
          <div class="option-editor-index">${String.fromCharCode(65+i)}</div>
          <div class="field option-text-field">
            <span>Pilihan ${String.fromCharCode(65+i)} (Jepang)</span>
            ${richEditorControl(`optionText${i}`,o.text,'Isi pilihan jawaban…',{size:'small',compact:true,label:`Pilihan ${String.fromCharCode(65+i)}`})}
            <input type="text" name="optionTranslation${i}" value="${esc(o.translation || o.textId || '')}" placeholder="Terjemahan Bahasa Indonesia Opsi ${String.fromCharCode(65+i)} (opsional)…" aria-label="Terjemahan Opsi ${String.fromCharCode(65+i)}">
          </div>
          <div class="option-correct">
            <input type="radio" name="correctIndex" value="${i}" ${q.correctIndex === i ? 'checked' : ''} aria-label="Jadikan opsi ${String.fromCharCode(65+i)} kunci benar">
            <span>Kunci</span>
          </div>
          <div class="option-image-wrap">
            ${getOptionMedia(q,o,i) ? `<img class="option-preview-img" src="${mediaURL(getOptionMedia(q,o,i))}" alt="Preview opsi"><span class="option-image-label">${esc(getOptionMedia(q,o,i)?.name || 'file')}</span>` : ''}
            <label class="text-button file-link">${getOptionMedia(q,o,i) ? 'Ganti gambar' : '+ Gambar'}<input type="file" data-option-image="${i}" accept="image/jpeg,image/png,image/webp" hidden></label>
            ${getOptionMedia(q,o,i) ? `<button type="button" class="text-button danger-text" data-action="remove-option-image" data-index="${i}">Hapus</button>` : ''}
          </div>
          ${q.options.length > 2 ? `<button type="button" class="icon-button danger-icon option-delete" data-action="remove-option" data-index="${i}" title="Hapus opsi">×</button>` : ''}
        </div>
      `).join('')}
    </div>
    ${richEditorField('explanation','Catatan Sumber / Pembahasan',q.explanation,'Catatan sumber halaman PDF atau pembahasan…',{size:'small'})}
    <div class="two-fields">
      <label class="field"><span>Status</span><select name="active"><option value="true" ${q.active !== false ? 'selected' : ''}>Aktif</option><option value="false" ${q.active === false ? 'selected' : ''}>Nonaktif</option></select></label>
      <label class="field"><span>Bobot Poin</span><input name="points" type="number" step="0.05" min="0.5" max="100" value="${esc(q.points || 3.75)}"></label>
    </div>
    <div id="editor-errors" class="notice notice-warn" hidden></div>
  </form>`;
  modal(
    modalTitle,
    content,
    `<button type="button" class="hd-btn-secondary" data-action="close-modal">Batal</button><button type="button" class="hd-btn-secondary" data-action="toggle-question-preview">${state.editor.previewVisible ? 'Tutup Preview' : 'Preview Soal'}</button><button type="button" class="hd-btn-primary" data-action="save-question">Simpan Soal</button>`
  );
}

function syncQuestionDraft() {
  const form = $('#question-editor'); if (!form || !state.editor) return;
  const q = state.editor.q;
  const fd = new FormData(form);
  const setId = String(fd.get('setId') || q.setId || 'ssw-pm-kunci-ujian-1');
  q.setId = setId;
  q.setName = packageName(setId, q.setName || 'Bank Soal SSW PM');
  q.questionNumber = Number.parseInt(fd.get('questionNumber'), 10) || q.questionNumber || 1;
  q.sourcePage = Number.parseInt(fd.get('sourcePage'), 10) || q.sourcePage || 1;
  q.pdfPage = q.sourcePage;
  q.points = Number.parseFloat(fd.get('points')) || 3.75;

  for (const key of ['prompt','promptTranslation','instructions','explanation']) {
    const rich = form.querySelector(`[data-rich-field="${key}"]`);
    if (rich) q[key] = normalizedRichEditorValue(rich.innerHTML);
  }
  q.questionText = richPlainText(q.prompt);
  q.active = fd.get('active') === 'true';
  const answerKey = fd.get('correctIndex');
  q.correctIndex = answerKey === null ? null : Number(answerKey);
  q.correctAnswer = Number.isInteger(q.correctIndex) ? String.fromCharCode(65 + q.correctIndex) : '';
  q.options = q.options.map((o, i) => {
    const rich = form.querySelector(`[data-rich-field="optionText${i}"]`);
    const transInput = form.querySelector(`input[name="optionTranslation${i}"]`);
    return {
      ...o,
      id: String.fromCharCode(65 + i),
      text: normalizedRichEditorValue(rich ? rich.innerHTML : o.text),
      translation: transInput ? String(transInput.value || '').trim() : String(o.translation || o.textId || '').trim()
    };
  });
  q.imageSize = fd.get('imageSize') || q.imageSize || 'medium';
  q.imageRatio = fd.get('imageRatio') || q.imageRatio || 'auto';
  q.imagePosition = fd.get('imagePosition') || q.imagePosition || 'center';
}

function buildExamQuestions(setup) {
  const pool = getSetupPool(setup);
  const count = setup.mode === 'full' ? pool.length : Math.max(1, Math.floor(Number(setup.count) || pool.length || 40));
  let selected = pool.slice();
  if (setup.random) selected = shuffle(selected);
  else selected.sort((a, b) => (a.questionNumber || 999) - (b.questionNumber || 999));
  selected = selected.slice(0, count);
  return selected.map(orig => {
    const q = structuredClone(orig);
    if (setup.shuffleOptions && Array.isArray(q.options) && q.options.length > 1) {
      const tagged = q.options.map((opt, idx) => ({
        opt: structuredClone(opt),
        isCorrect: idx === q.correctIndex
      }));
      const shuffled = shuffle(tagged);
      q.options = shuffled.map((item, newIdx) => ({
        ...item.opt,
        originalId: (item.opt.originalId != null && String(item.opt.originalId).trim())
          ? String(item.opt.originalId).trim()
          : (item.opt.id != null && String(item.opt.id).trim() ? String(item.opt.id).trim() : null),
        id: String.fromCharCode(65 + newIdx)
      }));
      const newCorrect = shuffled.findIndex(item => item.isCorrect);
      if (newCorrect >= 0) {
        q.correctIndex = newCorrect;
        q.correctAnswer = String.fromCharCode(65 + newCorrect);
      }
    }
    return q;
  });
}

function getExamPackageDisplayName(session, currentQ = null) {
  const rawSetId = session?.setId && session.setId !== 'all' ? session.setId : (currentQ?.setId || session?.setId || '');
  const rawName = (session?.setId && session.setId !== 'all' && session?.setName)
    ? session.setName
    : (rawSetId ? packageName(rawSetId, session?.setName || '') : (session?.setName || ''));
  if (!rawName) return formatHomeSessionTitle(session) || 'Soal Ujian 1';
  const stripped = String(rawName)
    .replace(/^(Mock Test Penuh|Latihan|Simulasi Kustom)\s*—\s*/i, '')
    .trim();
  const parts = stripped.split(/\s*—\s*/);
  return (parts[0] || stripped).trim();
}

async function startExam() {
  const setup = state.setup;
  let qs = buildExamQuestions(setup);
  if (!qs.length) {
    await ensureAllBuiltinSetsLoaded(false);
    qs = buildExamQuestions(setup);
  }
  if (!qs.length) {
    toast('Belum ada soal aktif yang sesuai dengan konfigurasi.', 'warn');
    return;
  }
  if (state.sessions.some(s => s.status === 'in_progress')) {
    const active = state.sessions.find(s => s.status === 'in_progress');
    const yes = await confirmModal(
      'Sesi ujian sebelumnya belum selesai',
      'Memulai sesi Mock Test baru akan mengakhiri sesi yang sedang berjalan. Lanjutkan?',
      'Mulai Ujian Baru'
    );
    if (!yes) return;
    if (active && active.selectiveState) delete active.selectiveState;
    if (state.activeSession && state.activeSession.selectiveState) delete state.activeSession.selectiveState;
    active.status = 'interrupted';
    active.endedAt = Date.now();
    await put('sessions', active);
  }
  const isPractice = setup.mode === 'practice' || Boolean(setup.practice);
  const minutes = Math.max(1, Number(setup.duration) || 70);
  const startedAt = Date.now();
  const pkgTitle = packageName(setup.setId, 'Semua Paket SSW PM');
  const modeLabel = setup.mode === 'full' ? 'Mock Test Penuh' : setup.mode === 'practice' ? 'Latihan' : 'Simulasi Kustom';
  const session = {
    id: uid('exam'),
    candidateName: String(setup.candidateName || '').trim() || 'Faiz',
    candidatePhoto: setup.candidatePhoto || '',
    title: `${modeLabel} — ${pkgTitle}`,
    setId: setup.setId,
    setName: pkgTitle,
    startedAt,
    deadline: isPractice ? null : startedAt + minutes * 60000,
    timed: !isPractice,
    durationMinutes: minutes,
    status: 'in_progress',
    mode: isPractice ? 'practice' : 'exam',
    questions: qs,
    answers: {},
    currentIndex: 0,
    flaggedQuestions: [],
    setup: { ...setup }
  };
  await put('sessions', session);
  state.activeSession = session;
  if (isPractice) {
    initSelectiveState(session);
    ensureKotobaDataLoaded();
  }
  state.practiceTranslationOpen = false;
  state.practiceRevealAnswer = false;
  lastExamMapSessionId = null;
  state.resultId = null;
  state.finalizing = false;
  state.examSettingsOpen = false;
  state.examFillScreen = false;
  activeExamPointers.clear();
  wasMultiTouch = false;
  multiTouchCooldownUntil = 0;
  window.scrollTo(0, 0);
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
  await go('exam');
  window.scrollTo(0, 0);
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
  syncExamViewportAfterResume();
  startExamTicker();
}

async function launchRetryIncorrectQuestions(parentSession) {
  const t0 = performance.now();
  if (!parentSession) return;
  const allQuestions = parentSession.questions || [];
  const wrongQuestions = allQuestions.filter(q => {
    const userAns = parentSession.answers ? parentSession.answers[q.id] : undefined;
    return userAns != null && userAns !== q.correctIndex;
  });

  if (!wrongQuestions.length) {
    toast('Tidak ada jawaban salah untuk diulangi', 'info');
    return;
  }

  const clonedQuestions = wrongQuestions.map(q => {
    const origIndex = allQuestions.findIndex(pq => pq.id === q.id);
    const clone = JSON.parse(JSON.stringify(q));
    clone.originQuestionNumber = origIndex >= 0 ? origIndex + 1 : undefined;
    return clone;
  });

  const retrySession = {
    id: uid('exam'),
    candidateName: String(parentSession.candidateName || '').trim() || 'Faiz',
    candidatePhoto: parentSession.candidatePhoto || '',
    title: `Latihan Ulang Jawaban Salah — ${parentSession.packageTitle || parentSession.setName || 'Ujian Utama'}`,
    setId: parentSession.setId || parentSession.packageId || 'custom',
    setName: parentSession.setName || parentSession.packageTitle || 'Paket Ujian',
    packageId: parentSession.packageId || parentSession.setId || 'custom',
    packageTitle: parentSession.packageTitle || parentSession.setName || 'Paket Ujian',
    originSessionId: parentSession.id,
    originExamTitle: formatHomeSessionTitle(parentSession) || parentSession.packageTitle || parentSession.setName || 'Sesi Ujian Utama',
    questions: clonedQuestions,
    answers: {},
    flaggedQuestions: [],
    currentIndex: 0,
    startedAt: Date.now(),
    deadline: null,
    timed: false,
    durationMinutes: 0,
    status: 'in_progress',
    mode: 'practice',
    setup: {
      setId: parentSession.setId || 'custom',
      mode: 'practice',
      practice: true,
      duration: 0
    }
  };

  ensureKotobaDataLoaded();
  initSelectiveState(retrySession);
  await put('sessions', retrySession);
  state.activeSession = retrySession;
  state.practiceTranslationOpen = false;
  state.practiceRevealAnswer = false;
  lastExamMapSessionId = null;
  state.resultId = null;
  state.finalizing = false;
  state.examSettingsOpen = false;
  state.examFillScreen = false;
  activeExamPointers.clear();
  wasMultiTouch = false;
  multiTouchCooldownUntil = 0;

  await go('exam');
  startExamTicker();

  const t1 = performance.now();
  console.log(`[Performance] launchRetryIncorrectQuestions completed in ${(t1 - t0).toFixed(2)} ms`);
}

function activeExam() { return state.activeSession; }
function currentExamQuestion(session = activeExam()) { return session?.questions?.[session.currentIndex] || null; }
function getExamDisplayedOptions(s = activeExam(), q = currentExamQuestion(s)) {
  if (!q || !Array.isArray(q.options)) return [];
  return q.options.map((opt, i) => ({
    ...opt,
    visualIndex: i,
    key: getOptionKey(q.id, opt)
  }));
}
function answeredCount(session = activeExam()) { return (session?.questions || []).filter(q => session.answers[q.id] != null).length; }

/* ==========================================================================
   FEATURE 008: Session-Scoped Selective State (Task T009)
   ========================================================================== */
function initSelectiveState(s) {
  if (!s || s.mode !== 'practice') return null;
  const stateObj = { questions: {} };
  Object.defineProperty(s, 'selectiveState', {
    value: stateObj,
    writable: true,
    enumerable: false,
    configurable: true
  });
  return stateObj;
}

function getSelectiveState(s = activeExam()) {
  if (!s || s.mode !== 'practice') return null;
  if (!s.selectiveState) {
    initSelectiveState(s);
  }
  return s.selectiveState;
}

function getSelectiveQuestionState(s = activeExam(), qId, create = false) {
  const selState = getSelectiveState(s);
  if (!selState || !qId) return null;
  if (!selState.questions[qId]) {
    if (!create) return null;
    selState.questions[qId] = {
      translation: null,
      kotoba: false,
      options: {}
    };
  }
  return selState.questions[qId];
}

function getSelectiveOptionState(s = activeExam(), qId, origOptId, create = false) {
  const qState = getSelectiveQuestionState(s, qId, create);
  if (!qState || !origOptId) return null;
  let optId = origOptId;
  if (typeof origOptId === 'object' && origOptId !== null) {
    optId = (origOptId.originalId != null && String(origOptId.originalId).trim())
      ? String(origOptId.originalId).trim()
      : (origOptId.id != null && String(origOptId.id).trim() ? String(origOptId.id).trim() : "");
  } else if (typeof origOptId === 'string' && origOptId.includes('::')) {
    const parts = origOptId.split('::');
    optId = parts[parts.length - 1];
  }
  if (!optId) return null;
  optId = String(optId).trim();
  if (!optId) return null;
  if (!qState.options[optId]) {
    if (!create) return null;
    qState.options[optId] = {
      translation: null,
      kotoba: false
    };
  }
  return qState.options[optId];
}

/* ==========================================================================
   FEATURE 008: Stable Composite Option Key (Task T010)
   ========================================================================== */
function getOptionKey(qId, opt) {
  if (qId == null) return null;
  const cleanQId = String(qId).trim();
  if (!cleanQId) return null;
  if (!opt || typeof opt !== 'object') return null;

  let rawOptId = '';
  if ('originalId' in opt) {
    if (opt.originalId != null && String(opt.originalId).trim()) {
      rawOptId = String(opt.originalId).trim();
    }
  } else if (opt.id != null && String(opt.id).trim()) {
    rawOptId = String(opt.id).trim();
  }

  if (!rawOptId) return null;

  return `${cleanQId}::${rawOptId}`;
}

/* ==========================================================================
   FEATURE 008: Selective Translation Toggle Handler (Task T013)
   ========================================================================== */
function toggleSelectiveTrans(s = activeExam(), qId, optKey = null) {
  if (!s || s.mode !== 'practice') return null;
  if (!qId) return null;

  if (optKey) {
    const optState = getSelectiveOptionState(s, qId, optKey, true);
    if (!optState) return null;
    const currentEffective = (optState.translation !== null && optState.translation !== undefined)
      ? Boolean(optState.translation)
      : Boolean(state.practiceTranslationOpen);
    optState.translation = !currentEffective;
    return optState.translation;
  }

  const qState = getSelectiveQuestionState(s, qId, true);
  if (!qState) return null;
  const currentEffective = (qState.translation !== null && qState.translation !== undefined)
    ? Boolean(qState.translation)
    : Boolean(state.practiceTranslationOpen);
  qState.translation = !currentEffective;
  return qState.translation;
}

/* ==========================================================================
   FEATURE 008: Global Toolbar Globe Reset Handler (Task T014)
   ========================================================================== */
function resetSelectiveTranslationOverrides(s = activeExam()) {
  if (!s || !s.selectiveState || !s.selectiveState.questions) return;
  for (const qId of Object.keys(s.selectiveState.questions)) {
    const qState = s.selectiveState.questions[qId];
    if (!qState) continue;
    qState.translation = null;
    if (qState.options) {
      for (const optKey of Object.keys(qState.options)) {
        const optState = qState.options[optKey];
        if (optState) {
          optState.translation = null;
        }
      }
    }
  }
}

/* ==========================================================================
   FEATURE 008: Selective Kotoba Toggle Handler (Task T018)
   ========================================================================== */
function toggleSelectiveKotoba(s = activeExam(), qId, optKey = null) {
  if (!s || s.mode !== 'practice' || s.deadline || s.timed) return null;
  if (!qId) return null;

  if (optKey !== null && optKey !== undefined) {
    if (typeof optKey === 'string' && !optKey.trim()) return null;
    const optState = getSelectiveOptionState(s, qId, optKey, true);
    if (!optState) return null;
    optState.kotoba = !Boolean(optState.kotoba);
    return optState.kotoba;
  }

  const qState = getSelectiveQuestionState(s, qId, true);
  if (!qState) return null;
  qState.kotoba = !Boolean(qState.kotoba);
  return qState.kotoba;
}

/* ==========================================================================
   FEATURE 008: Production Kotoba Data Loader, Resolver & Viewer (Task T017)
   ========================================================================== */
let kotobaMappingCache = null;
let kotobaDictionaryCache = null;
let kotobaLoadingPromise = null;

function setKotobaData(mappingData = null, dictData = null) {
  if (mappingData && typeof mappingData === 'object') {
    kotobaMappingCache = mappingData;
  }
  if (dictData && typeof dictData === 'object') {
    kotobaDictionaryCache = dictData;
  }
}

async function ensureKotobaDataLoaded() {
  if (kotobaMappingCache && kotobaDictionaryCache) {
    return { mapping: kotobaMappingCache, dictionary: kotobaDictionaryCache };
  }
  if (kotobaLoadingPromise) return kotobaLoadingPromise;

  kotobaLoadingPromise = (async () => {
    try {
      const [mappingData, dictData] = await Promise.all([
        fetchBuiltinJson('kotobaMapping.json'),
        fetchBuiltinJson('sharedKotobaDictionary.json')
      ]);
      if (mappingData && mappingData.questions) {
        kotobaMappingCache = mappingData;
      }
      if (dictData && dictData.terms) {
        kotobaDictionaryCache = dictData;
      }
    } catch (err) {
      console.warn('Gagal memuat dataset Kotoba:', err);
    } finally {
      kotobaLoadingPromise = null;
    }
    return { mapping: kotobaMappingCache, dictionary: kotobaDictionaryCache };
  })();

  return kotobaLoadingPromise;
}

/**
 * Resolves verified Kotoba entries from shared dictionary and mapping.
 *
 * @param {string|string[]} target - Question ID string OR array of term ID strings
 * @param {object|string|null} [optOrKey=null] - Option object, composite key, original option ID, or null
 * @param {object|null} [dictOverride=null] - Optional dictionary override
 * @param {object|null} [mappingOverride=null] - Optional mapping override
 * @returns {Array<{id: string, kanji: string, furigana: string, arti: string, status: string}>}
 */
const kotobaDiagnosticLogged = new Set();

function resolveKotobaEntries(target, optOrKey = null, dictOverride = null, mappingOverride = null) {
  const dict = dictOverride || (typeof window !== 'undefined' && window.sharedKotobaDictionary) || kotobaDictionaryCache;
  if (!dict || !dict.terms || typeof dict.terms !== 'object') return [];

  let termIds = [];
  let activeMapping = mappingOverride || (typeof window !== 'undefined' && window.kotobaMapping) || kotobaMappingCache;

  if (Array.isArray(target)) {
    termIds = target;
  } else if (typeof target === 'string' && target.trim()) {
    const qId = target.trim();
    const mapping = activeMapping;
    if (!mapping) return [];

    const dictSchema = dict._meta?.schemaVersion || dict._meta?.datasetVersion || null;
    const mapSchema = mapping._meta?.schemaVersion || mapping._meta?.datasetVersion || null;
    const dictDataVer = dict._meta?.dataVersion || dict._meta?.datasetVersion || null;
    const mapDataVer = mapping._meta?.dataVersion || mapping._meta?.datasetVersion || null;
    if ((dictSchema && mapSchema && dictSchema !== mapSchema) || (dictDataVer && mapDataVer && dictDataVer !== mapDataVer)) {
      const verKey = `ver:${dictSchema}:${mapSchema}:${dictDataVer}:${mapDataVer}`;
      if (!kotobaDiagnosticLogged.has(verKey)) {
        kotobaDiagnosticLogged.add(verKey);
        console.error('[Kotoba] Version mismatch between dictionary and mapping:', {
          dictSchema,
          mapSchema,
          dictDataVer,
          mapDataVer
        });
      }
    }

    if (!optOrKey) {
      // Prompt context
      termIds = Array.isArray(mapping.questions?.[qId]) ? mapping.questions[qId] : [];
    } else {
      // Option context
      let origOptId = null;
      if (typeof optOrKey === 'object' && optOrKey !== null) {
        origOptId = (optOrKey.originalId != null && String(optOrKey.originalId).trim())
          ? String(optOrKey.originalId).trim()
          : (optOrKey.id != null && String(optOrKey.id).trim() ? String(optOrKey.id).trim() : null);
      } else if (typeof optOrKey === 'string' && optOrKey.trim()) {
        const cleanStr = optOrKey.trim();
        origOptId = cleanStr.includes('::') ? cleanStr.split('::').pop() : cleanStr;
      }

      if (!origOptId) return [];

      const compositeKey = `${qId}::${origOptId}`;
      termIds = Array.isArray(mapping.byCompositeKey?.[compositeKey])
        ? mapping.byCompositeKey[compositeKey]
        : (Array.isArray(mapping.options?.[qId]?.[origOptId]) ? mapping.options[qId][origOptId] : []);
    }
  } else {
    return [];
  }

  if (!Array.isArray(termIds) || !termIds.length) return [];

  const seenIds = new Set();
  const results = [];

  for (const id of termIds) {
    if (!id || typeof id !== 'string') continue;
    const cleanId = id.trim();
    if (!cleanId || seenIds.has(cleanId)) continue;

    const entry = dict.terms[cleanId];
    if (!entry) {
      const missKey = `miss:${cleanId}`;
      if (!kotobaDiagnosticLogged.has(missKey)) {
        kotobaDiagnosticLogged.add(missKey);
        console.error('[Kotoba] Missing term ID:', cleanId, typeof target === 'string' ? target : 'array');
      }
      continue;
    }
    if (entry.status === 'verified') {
      seenIds.add(cleanId);
      results.push({
        id: String(entry.id || cleanId),
        kanji: String(entry.kanji || ''),
        furigana: String(entry.furigana || ''),
        arti: String(entry.arti || ''),
        status: entry.status
      });
    }
  }

  return results;
}

/**
 * Renders verified Kotoba entries into a minimal vertical list markup.
 * Term is wrapped in <ruby class="kotoba-ruby">${kanji}<rt>${furigana}</rt></ruby>
 * for zero-DOM-churn toolbar F synchronization.
 *
 * @param {Array<{id: string, kanji: string, furigana: string, arti: string}>} kotobaEntries
 * @returns {string} HTML string
 */
function renderKotobaList(kotobaEntries) {
  if (!Array.isArray(kotobaEntries) || !kotobaEntries.length) return '';
  return kotobaEntries.map(entry => `
    <div class="practice-kotoba-item" data-term-id="${esc(entry.id)}">
      <span class="kotoba-term-wrap">
        <ruby class="kotoba-ruby">${esc(entry.kanji)}<rt>${esc(entry.furigana || '')}</rt></ruby>
      </span>
      <span class="kotoba-separator" aria-hidden="true">—</span>
      <span class="kotoba-meaning" lang="id">${esc(entry.arti || '')}</span>
    </div>
  `).join('');
}

function renderExamShortcutsSection() {
  const bindings = state.examShortcuts || DEFAULT_EXAM_SHORTCUTS;
  const captureAction = state.shortcutCaptureAction;
  const conflictMsg = state.shortcutConflictMessage || '';
  return `
        <div id="exam-shortcuts-section" class="exam-setting-row exam-shortcuts-section">
          <div class="exam-shortcuts-head">
            <strong>Keyboard Shortcuts</strong>
            <button type="button" class="button button-small button-outline" data-action="reset-exam-shortcuts">Reset Shortcuts</button>
          </div>
          <p class="exam-shortcuts-hint">Klik tombol key lalu tekan tombol baru. Tekan Esc untuk batal. Tombol F tetap untuk Layar Penuh.</p>
          <div class="exam-shortcuts-status" role="status" aria-live="polite">${esc(conflictMsg)}</div>
          <div class="exam-shortcuts-list">
            ${EXAM_SHORTCUT_ACTIONS.map(item => {
              const isCapturing = captureAction === item.id;
              const currentKey = bindings[item.id] ?? DEFAULT_EXAM_SHORTCUTS[item.id];
              const badgeText = isCapturing ? 'Press a key...' : formatShortcutKeyLabel(currentKey);
              return `
                <div class="exam-shortcut-row">
                  <span class="exam-shortcut-label">${esc(item.label)}</span>
                  <button
                    type="button"
                    class="exam-shortcut-key-btn ${isCapturing ? 'is-capturing' : ''}"
                    data-action="capture-exam-shortcut"
                    data-shortcut-action="${esc(item.id)}"
                    aria-pressed="${isCapturing ? 'true' : 'false'}"
                    aria-label="${esc(item.label)}: ${esc(badgeText)}"
                  >${esc(badgeText)}</button>
                </div>`;
            }).join('')}
          </div>
        </div>`;
}

function refreshExamShortcutsUI() {
  const existing = $('#exam-shortcuts-section');
  if (!existing) return;
  const body = existing.closest('.exam-settings-body');
  const prevScroll = body ? body.scrollTop : 0;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderExamShortcutsSection().trim();
  const nextSection = wrapper.firstElementChild;
  if (nextSection) {
    existing.replaceWith(nextSection);
    if (body) body.scrollTop = prevScroll;
    if (state.shortcutCaptureAction) {
      nextSection.querySelector(`[data-shortcut-action="${state.shortcutCaptureAction}"]`)?.focus();
    }
  }
}

function renderExamSettingsPopover() {
  const prefs = state.examPrefs;
  const fsActive = isFullscreenActive();
  return `
    <aside id="exam-settings-popover" class="exam-settings-popover ${state.examSettingsOpen ? 'is-open' : ''}" role="dialog" aria-label="${esc(t('setPopoverTitle'))}" ${state.examSettingsOpen ? '' : 'hidden'}>
      <div class="exam-settings-head">
        <div>
          <strong>${esc(t('setPopoverTitle'))}</strong>
          <span>SSW PM Mock Test by Faiz</span>
        </div>
        <button type="button" class="icon-button" data-action="close-exam-settings" aria-label="Close">×</button>
      </div>
      <div class="exam-settings-body">
        <label class="exam-setting-row exam-setting-toggle">
          <div>
            <strong>${esc(t('setFuriganaTitle'))}</strong>
            <small>${esc(t('setFuriganaSub'))}</small>
          </div>
          <input id="exam-pref-furigana" type="checkbox" ${prefs.showFurigana ? 'checked' : ''}>
          <span class="toggle-ui"></span>
        </label>

        <div class="exam-setting-row">
          <div class="exam-slider-head">
            <label for="exam-pref-lang"><strong>${esc(t('setLangTitle'))}</strong></label>
          </div>
          <select id="exam-pref-lang" aria-label="${esc(t('setLangTitle'))}">
            <option value="id" ${state.lang === 'id' ? 'selected' : ''}>🇮🇩 ID</option>
            <option value="en" ${state.lang === 'en' ? 'selected' : ''}>🇬🇧 EN</option>
            <option value="ja" ${state.lang === 'ja' ? 'selected' : ''}>🇯🇵 JA</option>
          </select>
        </div>

        <div class="exam-setting-row">
          <div class="exam-slider-head">
            <label for="exam-pref-q-font"><strong>${esc(t('setQFontTitle'))}</strong></label>
            <span id="exam-pref-q-font-val" class="exam-slider-val">${prefs.questionFontSize} px</span>
          </div>
          <input id="exam-pref-q-font" type="range" min="18" max="36" step="1" value="${prefs.questionFontSize}">
          <div class="exam-slider-scale"><span>18 px</span><span>Default 22 px</span><span>36 px</span></div>
        </div>

        <div class="exam-setting-row">
          <div class="exam-slider-head">
            <label for="exam-pref-a-font"><strong>${esc(t('setAFontTitle'))}</strong></label>
            <span id="exam-pref-a-font-val" class="exam-slider-val">${prefs.answerFontSize} px</span>
          </div>
          <input id="exam-pref-a-font" type="range" min="16" max="30" step="1" value="${prefs.answerFontSize}">
          <div class="exam-slider-scale"><span>16 px</span><span>Default 17 px</span><span>30 px</span></div>
        </div>

        <div class="exam-setting-row exam-fullscreen-info">
          <div class="exam-slider-head">
            <strong>${esc(t('setFsTitle'))}</strong>
            <span id="exam-settings-fs-status" class="status ${fsActive ? 'status-on' : 'status-neutral'}">${esc(fsActive ? t('setFsActive') : t('setFsInactive'))}</span>
          </div>
          <p class="exam-fs-hint">${esc(t('setFsHint'))}</p>
          <button type="button" class="button button-small button-outline button-wide" data-action="toggle-fullscreen" aria-pressed="${String(fsActive)}">
            <span class="fs-icon">${fsActive ? '🗗' : '⛶'}</span>
            <span class="fs-label">${esc(fsActive ? t('setFsActive') : t('setFsTitle'))}</span>
          </button>
        </div>

        ${renderExamShortcutsSection()}

        <div class="exam-setting-row exam-attribution-section">
          <div class="exam-slider-head">
            <strong>Data Sources &amp; Licenses</strong>
          </div>
          <div class="exam-attribution-body">
            <p class="exam-attribution-lead">
              This application uses data from the <strong>JMdict</strong> dictionary file. The JMdict data is the property of the <strong>Electronic Dictionary Research and Development Group (EDRDG)</strong> and is used in accordance with the Group's <a href="https://www.edrdg.org/edrdg/licence.html" target="_blank" rel="noopener noreferrer">licence</a>.
            </p>
            <p class="exam-attribution-detail">
              The vocabulary dataset is derived from the <a href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project" target="_blank" rel="noopener noreferrer">JMdict Project</a>, matched to SSW Food Processing (飲食料品製造業) requirements, and enriched with in-house curated Indonesian definitions released under <a href="https://creativecommons.org/licenses/by-sa/4.0/legalcode" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. The application software, CBT scoring engine, and platform code remain separate proprietary works.
            </p>
          </div>
        </div>
      </div>
      <div class="exam-settings-foot">
        <button type="button" class="button button-small button-outline" data-action="reset-exam-prefs">${esc(t('setResetBtn'))}</button>
        <button type="button" class="button button-small button-primary" data-action="close-exam-settings">${esc(t('setDoneBtn'))}</button>
      </div>
    </aside>`;
}

let lastExamMapSessionId = null;

function renderExam() {
  const options = arguments[0] || {};
  const s = activeExam();
  if (!s) { state.page = 'home'; renderHome(); return; }
  if (s.deadline && Date.now() >= s.deadline) { finishExam(true); return; }
  const q = currentExamQuestion(s);
  if (!q) { finishExam(false); return; }
  s.flaggedQuestions = Array.isArray(s.flaggedQuestions) ? s.flaggedQuestions : [];
  const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);

  const prevMap = (typeof view !== 'undefined' && view?.querySelector?.('.exam-question-map')) || (typeof document !== 'undefined' ? document?.querySelector?.('.exam-question-map') : null);
  const prevMapScrollTop = prevMap ? prevMap.scrollTop : 0;

  const getWorkspace = () => {
    if (typeof view !== 'undefined' && view && typeof view.querySelector === 'function') {
      return view.querySelector('.exam-workspace');
    }
    if (typeof document !== 'undefined' && document && typeof document.querySelector === 'function') {
      return document.querySelector('.exam-workspace');
    }
    return null;
  };
  const prevWorkspace = getWorkspace();
  const prevScrollTop = prevWorkspace ? prevWorkspace.scrollTop : 0;
  const shouldPreserveScroll = Boolean(options && (options.preserveScroll || options.scrollTarget));
  const scrollTarget = options && options.scrollTarget ? options.scrollTarget : null;

  function findExamTargetSentenceElement(workspace, target) {
    if (!workspace || !target) return null;

    if (target.targetType === 'prompt') {
      return workspace.querySelector('.practice-prompt-row') ||
             workspace.querySelector('.question-card') ||
             workspace.querySelector('.question-prompt');
    }

    if (target.targetType === 'option') {
      if (target.optKey) {
        const escapedKey = (typeof CSS !== 'undefined' && CSS.escape)
          ? CSS.escape(target.optKey)
          : String(target.optKey).replace(/(["\\])/g, '\\$1');
        const btn = workspace.querySelector(`.practice-row-ctrl[data-opt-key="${escapedKey}"]`);
        if (btn) {
          return btn.closest('.practice-option-row') || btn.closest('.answer-choice');
        }
      }
      if (typeof target.index === 'number' && !isNaN(target.index)) {
        const choice = workspace.querySelector(`.answer-choice[data-index="${target.index}"]`);
        if (choice) {
          return choice.closest('.practice-option-row') || choice;
        }
      }
    }

    return null;
  }

  function scrollSentenceIntoView(workspace, targetEl, { behavior = 'smooth' } = {}) {
    if (!workspace || !targetEl) return;

    const wsRect = workspace.getBoundingClientRect();
    const elRect = targetEl.getBoundingClientRect();

    // Position of target relative to workspace scroll content
    const targetTop = (elRect.top - wsRect.top) + workspace.scrollTop;
    const targetHeight = elRect.height;
    const viewportHeight = workspace.clientHeight;
    const maxScroll = Math.max(0, workspace.scrollHeight - viewportHeight);

    // Generous margin for comfortable reading context
    const MARGIN = 20;
    const currentVisibleTop = workspace.scrollTop;
    const currentVisibleBottom = currentVisibleTop + viewportHeight;

    // Check if target is already comfortably and fully in view:
    const isComfortablyVisible = (targetTop >= currentVisibleTop + MARGIN) &&
                                (targetTop + targetHeight <= currentVisibleBottom - MARGIN);

    if (isComfortablyVisible) {
      return;
    }

    let idealScroll;
    if (targetHeight + MARGIN * 2 <= viewportHeight) {
      // Center the sentence card cleanly in the workspace viewport
      const targetMiddle = targetTop + targetHeight / 2;
      idealScroll = targetMiddle - viewportHeight / 2;
    } else {
      // If card is taller than viewport (e.g. mobile or extensive kotoba list), align with top margin
      idealScroll = targetTop - MARGIN;
    }

    idealScroll = Math.max(0, Math.min(idealScroll, maxScroll));

    if (Math.abs(workspace.scrollTop - idealScroll) > 2) {
      if (typeof workspace.scrollTo === 'function') {
        try {
          workspace.scrollTo({ top: idealScroll, behavior });
        } catch (err) {
          workspace.scrollTop = idealScroll;
        }
      } else {
        workspace.scrollTop = idealScroll;
      }
    }
  }

  const totalQ = s.questions.length;
  const questionNo = s.currentIndex + 1;
  const answered = answeredCount(s);
  const progressPct = totalQ ? Math.round((answered / totalQ) * 100) : 0;
  const remaining = s.deadline
    ? Math.max(0, Math.ceil((s.deadline - Date.now()) / 1000))
    : Math.max(0, Math.floor((Date.now() - s.startedAt) / 1000));
  const fsActive = isFullscreenActive();

  const optHTML = (q.options || []).map((o, i) => {
    const selected = s.answers[q.id] === i;
    const optTrans = String(o.translation || '').trim();
    const m = getOptionMedia(q, o, i);
    const letter = String.fromCharCode(65 + i);
    const optKey = isUntimedPractice ? getOptionKey(q.id, o) : '';
    const optSelState = isUntimedPractice ? getSelectiveOptionState(s, q.id, optKey, false) : null;
    const isOptKotobaOpen = isUntimedPractice ? Boolean(optSelState?.kotoba) : false;
    const resolvedOptKotoba = (isUntimedPractice && isOptKotobaOpen)
      ? resolveKotobaEntries(q.id, optKey || o)
      : [];
    const isOptTransOpen = isUntimedPractice
      ? (optSelState?.translation !== null && optSelState?.translation !== undefined
          ? Boolean(optSelState.translation)
          : Boolean(state.practiceTranslationOpen))
      : false;

    const showCorrectKey = Boolean(
      isUntimedPractice &&
      state.practiceRevealAnswer &&
      Number.isInteger(q.correctIndex) &&
      i === q.correctIndex
    );

    const answerChoiceHTML = `
      <div role="radio" tabindex="0" class="answer-choice ${selected ? 'selected' : ''}" data-action="answer" data-index="${i}" aria-checked="${selected}" aria-pressed="${selected}">
        <span class="answer-letter">${letter}</span>
        <div class="answer-content">
          ${o.text ? `<div class="answer-text rich-content" lang="ja">${richHTML(o.text)}</div>` : ''}
          ${isOptTransOpen && optTrans ? `<span class="practice-option-translation" lang="id">${richHTML(optTrans)}</span>` : ''}
          ${isOptKotobaOpen && resolvedOptKotoba.length ? `
          <div class="practice-kotoba-list practice-option-kotoba" lang="ja">
            ${renderKotobaList(resolvedOptKotoba)}
          </div>` : ''}
          ${m ? `<img class="answer-image" src="${mediaURL(m)}" alt="Option ${letter}">` : ''}
        </div>
        ${showCorrectKey ? `<span class="practice-answer-key-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>` : ''}
        <span class="answer-radio" aria-hidden="true"></span>
      </div>`;

    if (!isUntimedPractice) {
      return answerChoiceHTML;
    }

    return `
      <div class="practice-option-row">
        <button type="button"
                class="practice-row-ctrl practice-ctrl-trans ${isOptTransOpen ? 'is-active' : ''}"
                data-action="toggle-selective-trans"
                data-target-type="option"
                data-opt-key="${esc(optKey)}"
                aria-expanded="${Boolean(isOptTransOpen)}"
                aria-label="Terjemahan Opsi ${letter}"
                title="${isOptTransOpen ? 'Sembunyikan terjemahan opsi' : 'Tampilkan terjemahan opsi'}"></button>
        ${answerChoiceHTML}
        <button type="button"
                class="practice-row-ctrl practice-ctrl-kotoba ${isOptKotobaOpen ? 'is-active' : ''}"
                data-action="toggle-selective-kotoba"
                data-target-type="option"
                data-opt-key="${esc(optKey)}"
                aria-expanded="${Boolean(isOptKotobaOpen)}"
                aria-label="Kosakata Opsi ${letter}"
                title="${isOptKotobaOpen ? 'Sembunyikan kosakata opsi' : 'Tampilkan kosakata opsi'}"></button>
      </div>`;
  }).join('');

  const cleanExamPrompt = rawPrompt => {
    let out = String(rawPrompt || '');
    out = out.replace(/(?:<ruby>最<rt>もっと<\/rt><\/ruby>も)?(?:<ruby>正<rt>ただ<\/rt><\/ruby>しい|<ruby>間違<rt>まちが<\/rt><\/ruby>っている)ものを<ruby>一<rt>ひと<\/rt><\/ruby>つ<ruby>選<rt>えら<\/rt><\/ruby>びなさい[。．.]?\s*$/i, '').trim();
    return out || rawPrompt;
  };

  const leftNav = `
    <div class="exam-progress-rail" title="${answered}/${totalQ}">
      <span class="exam-progress-rail-label">食品</span>
      <div class="exam-progress-rail-track">
        <div class="exam-progress-rail-fill" style="height:${Math.max(12, progressPct)}%"></div>
      </div>
    </div>
    <aside class="exam-question-map" aria-label="Question list 1 to ${totalQ}">
      <div class="question-map-grid">
        ${s.questions.map((item, idx) => {
          const isCurrent = idx === s.currentIndex;
          const isAnswered = s.answers[item.id] != null;
          const isFlagged = s.flaggedQuestions.includes(item.id);
          const isInStudy = isQuestionInStudy(item);
          return `<button type="button" class="question-map-item ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''} ${isFlagged ? 'flagged' : ''} ${isInStudy ? 'in-study' : ''}" data-action="jump-question" data-index="${idx}" title="No. ${idx + 1}">${idx + 1}</button>`;
        }).join('')}
      </div>
    </aside>`;

  const img = getQuestionMainMedia(q);
  const inStudy = isQuestionInStudy(q);
  const promptTrans = String(q.promptTranslation || '').trim();
  const qSelState = isUntimedPractice ? getSelectiveQuestionState(s, q.id, false) : null;
  const isPromptKotobaOpen = isUntimedPractice ? Boolean(qSelState?.kotoba) : false;
  const resolvedPromptKotoba = (isUntimedPractice && isPromptKotobaOpen)
    ? resolveKotobaEntries(q.id, null)
    : [];
  const isPromptTransOpen = isUntimedPractice
    ? (qSelState?.translation !== null && qSelState?.translation !== undefined
        ? Boolean(qSelState.translation)
        : Boolean(state.practiceTranslationOpen))
    : false;
  const imageClass = `image-size-${q.imageSize || 'medium'} image-ratio-${q.imageRatio || 'auto'} image-pos-${q.imagePosition || 'center'}`;
  const answerPrev = questionNo > 1
    ? `<button type="button" class="button button-outline" data-action="exam-prev" aria-label="${esc(t('examBackBtn'))}"><span aria-hidden="true">‹</span> ${esc(t('examBackBtn'))}</button>`
    : `<button type="button" class="button button-outline" disabled aria-label="${esc(t('examBackBtn'))}"><span aria-hidden="true">‹</span> ${esc(t('examBackBtn'))}</button>`;
  const answerNext = questionNo < totalQ
    ? `<button type="button" class="button button-primary" data-action="exam-next">${esc(t('examNextBtn'))} <span aria-hidden="true">›</span></button>`
    : `<button type="button" class="button button-primary" data-action="exam-finish">${esc(t('examNextBtn'))} <span aria-hidden="true">›</span></button>`;

  const activePkgName = getExamPackageDisplayName(s, q);

  view.innerHTML = `
    <div class="exam-shell ${s.flaggedQuestions.includes(q.id) ? 'question-flagged' : ''} ${state.mapHidden ? 'map-hidden' : ''}">
      ${s.originSessionId ? `
      <nav class="exam-retry-breadcrumb no-print" aria-label="Navigasi Sesi Ulang">
        <div class="breadcrumb-container">
          <span class="breadcrumb-item breadcrumb-parent">${esc(s.originExamTitle || 'Sesi Ujian Utama')}</span>
          <span class="breadcrumb-separator" aria-hidden="true">›</span>
          <span class="breadcrumb-item breadcrumb-current">Latihan Ulang Jawaban Salah</span>
          <button type="button"
                  class="button button-subtle button-small breadcrumb-return-btn"
                  data-action="return-to-parent-results"
                  data-parent-id="${esc(s.originSessionId)}"
                  aria-label="Kembali ke Hasil Ujian Utama">
            ‹ Kembali ke Hasil Utama
          </button>
        </div>
      </nav>` : ''}
      <header class="exam-header">
        <div class="exam-header-left">
          <div class="exam-title-group">
            <div class="exam-name">${esc(t('examQuestionLabel'))}: ${questionNo}${q.originQuestionNumber ? ` <span class="exam-question-origin-badge" title="Nomor soal pada ujian utama">Asal: Soal #${q.originQuestionNumber}</span>` : ''}</div>
            <div class="exam-section-title">${esc(t('examSectionLabel'))}: ${esc(activePkgName)}</div>
          </div>
        </div>

        <div class="exam-header-center">
          <div class="exam-clock ${s.deadline && remaining < 300 ? 'timer-warning' : ''}">
            <span class="exam-clock-symbol" aria-hidden="true"></span>
            <div class="exam-timer-wrap ${s.deadline && remaining < 300 ? 'timer-warning' : ''}">
              <span class="timer-label">${esc(s.deadline ? t('examTimeRemaining') : t('examPracticeTime'))}</span>
              <strong id="exam-timer">${fmtDurationHMS(remaining)}</strong>
            </div>
          </div>
        </div>

        <div class="exam-header-right">
          <button type="button" class="exam-header-finish" data-action="exam-finish">${esc(t('examFinishBtn'))}</button>
        </div>
      </header>

      <div class="exam-meta-strip">
        <span><b>${esc(t('examTestLabel'))}:</b> SSW PM Mock Test</span>
        <span class="candidate-label"><b>${esc(t('examCandidateLabel'))}:</b> <strong>${esc(s.candidateName || 'Faiz')}</strong></span>
      </div>

      ${renderExamSettingsPopover()}

      <div class="exam-main">
        ${leftNav}
        <section class="exam-workspace" aria-label="Question ${questionNo}">
          <div class="question-card">
            <div class="question-instruction rich-content" lang="ja">${richHTML(q.instructions || '<ruby>正<rt>ただ</rt></ruby>しいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。')}</div>
            ${isUntimedPractice ? `
            <div class="practice-prompt-row">
              <button type="button"
                      class="practice-row-ctrl practice-ctrl-trans ${isPromptTransOpen ? 'is-active' : ''}"
                      data-action="toggle-selective-trans"
                      data-target-type="prompt"
                      aria-expanded="${Boolean(isPromptTransOpen)}"
                      aria-label="Terjemahan Kalimat Soal"
                      title="${isPromptTransOpen ? 'Sembunyikan terjemahan soal' : 'Tampilkan terjemahan soal'}"></button>
              <div class="practice-prompt-center">
                <div class="question-prompt rich-content" lang="ja">${richHTML(cleanExamPrompt(q.prompt))}</div>
                ${isPromptTransOpen && promptTrans ? `<div class="practice-question-translation" lang="id">${richHTML(promptTrans)}</div>` : ''}
                ${isPromptKotobaOpen && resolvedPromptKotoba.length ? `
                <div class="practice-kotoba-list practice-question-kotoba" lang="ja">
                  ${renderKotobaList(resolvedPromptKotoba)}
                </div>` : ''}
              </div>
              <button type="button"
                      class="practice-row-ctrl practice-ctrl-kotoba ${isPromptKotobaOpen ? 'is-active' : ''}"
                      data-action="toggle-selective-kotoba"
                      data-target-type="prompt"
                      aria-expanded="${Boolean(isPromptKotobaOpen)}"
                      aria-label="Kosakata Soal"
                      title="${isPromptKotobaOpen ? 'Sembunyikan kosakata soal' : 'Tampilkan kosakata soal'}"></button>
            </div>` : `
            <div class="question-prompt rich-content" lang="ja">${richHTML(cleanExamPrompt(q.prompt))}</div>
            ${isUntimedPractice && state.practiceTranslationOpen && promptTrans ? `<div class="practice-question-translation" lang="id">${richHTML(promptTrans)}</div>` : ''}`}
            ${img ? `<div class="question-image-frame ${imageClass}"><img class="question-display-image" src="${mediaURL(img)}" alt="Illustration Question ${questionNo}"></div>` : ''}
          </div>
          <div class="answer-list" role="radiogroup" aria-label="Answer choices question ${questionNo}">
            ${optHTML}
          </div>
        </section>
      </div>

      <footer class="exam-bottom">
        <div class="exam-bottom-tools">
  <button type="button" class="exam-tool-button ${state.examSettingsOpen ? 'is-active' : ''}" data-action="exam-settings" title="${esc(t('examSettingsTitle'))}" aria-label="${esc(t('examSettingsTitle'))}">⚙</button>

  <button type="button" class="exam-tool-button ${!state.mapHidden ? 'is-active' : ''}" data-action="toggle-question-map" title="${esc(t('examToggleMapTitle'))}" aria-label="${esc(t('examToggleMapTitle'))}" aria-pressed="${!state.mapHidden}">▦</button>

<button type="button" class="exam-tool-button ${fsActive ? 'is-active' : ''}" data-action="toggle-fullscreen" title="${esc(t('examFullscreenTitle'))}" aria-label="${esc(t('examFullscreenTitle'))}" aria-pressed="${fsActive}"><span class="fs-icon">${fsActive ? '🗗' : '⛶'}</span></button>
<button type="button" class="exam-tool-button study-list-quick-button ${inStudy ? 'is-active' : ''}" data-action="toggle-study-list" data-id="${esc(q.id)}" title="${inStudy ? esc(t('studyRemoveTooltip')) : esc(t('studyAddTooltip'))}" aria-label="${inStudy ? esc(t('studyRemoveTooltip')) : esc(t('studyAddTooltip'))}" aria-pressed="${inStudy}">${inStudy ? '✓' : '+'}</button>
${isUntimedPractice ? `
<button type="button"
  class="exam-tool-button practice-trans-btn ${state.practiceTranslationOpen ? 'is-active' : ''}"
  data-action="toggle-practice-translation"
  title="${state.practiceTranslationOpen ? 'Sembunyikan Terjemahan' : 'Tampilkan Terjemahan'}"
  aria-label="Toggle Terjemahan Indonesia"
  aria-expanded="${Boolean(state.practiceTranslationOpen)}"
  aria-pressed="${Boolean(state.practiceTranslationOpen)}">
  <svg class="practice-globe-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5"/>
    <path d="M1.5 8h13"/>
    <ellipse cx="8" cy="8" rx="3.2" ry="6.5"/>
  </svg>
</button>
<button type="button"
  class="exam-tool-button practice-reveal-btn ${state.practiceRevealAnswer ? 'is-active' : ''}"
  data-action="toggle-practice-reveal-answer"
  title="${state.practiceRevealAnswer ? 'Sembunyikan Kunci Jawaban' : 'Tampilkan Kunci Jawaban'}"
  aria-label="Toggle Kunci Jawaban"
  aria-pressed="${Boolean(state.practiceRevealAnswer)}">
  <svg class="practice-eye-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
</button>` : ''}
<button type="button" class="exam-tool-button furigana-quick-button ${state.examPrefs.showFurigana ? 'is-active' : ''}" data-action="toggle-furigana-quick" title="${esc(t('setFuriganaTitle'))}" aria-label="Toggle Furigana" aria-pressed="${Boolean(state.examPrefs.showFurigana)}">F</button>
</div>
        <div class="exam-nav-buttons">
          <button type="button" class="exam-flag-button ${s.flaggedQuestions.includes(q.id) ? 'is-flagged' : ''}" data-action="toggle-flag" title="${esc(t('examFlagTitle'))}" aria-label="${esc(t('examFlagTitle'))}">⚑</button>
          ${answerPrev}
          ${answerNext}
        </div>
      </footer>
    </div>`;
  if (document.body) document.body.classList.add('exam-mode');
  if (document.documentElement) document.documentElement.classList.add('in-exam');

  const newMap = (typeof view !== 'undefined' && view?.querySelector?.('.exam-question-map')) || (typeof document !== 'undefined' ? document?.querySelector?.('.exam-question-map') : null);
  if (newMap && isUntimedPractice && s.id === lastExamMapSessionId) {
    newMap.scrollTop = prevMapScrollTop;
  }
  lastExamMapSessionId = s.id;

  const newWorkspace = getWorkspace();

  if (shouldPreserveScroll && newWorkspace) {
    // Instantly restore previous scroll position to eliminate jump/reset to top
    newWorkspace.scrollTop = prevScrollTop;
  } else {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }
    if (typeof document !== 'undefined' && document) {
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
  }

  applyExamPrefs();
  syncExamViewportAfterResume();

  if (scrollTarget && newWorkspace) {
    const runScroll = () => {
      const targetEl = findExamTargetSentenceElement(newWorkspace, scrollTarget);
      if (targetEl) {
        scrollSentenceIntoView(newWorkspace, targetEl, { behavior: 'smooth' });
      }
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(runScroll);
    } else {
      runScroll();
    }
  }
}

let examTicker = null;
function startExamTicker() {
  if (examTicker) clearInterval(examTicker);
  examTicker = setInterval(() => {
    const s = activeExam();
    if (!s || state.page !== 'exam') return;
    const timed = Boolean(s.deadline);
    const rem = timed
      ? Math.max(0, Math.ceil((s.deadline - Date.now()) / 1000))
      : Math.max(0, Math.floor((Date.now() - s.startedAt) / 1000));
    const el = $('#exam-timer');
    if (el) {
      el.textContent = fmtDurationHMS(rem);
      el.parentElement?.classList.toggle('timer-warning', timed && rem < 300);
      el.closest('.exam-clock')?.classList.toggle('timer-warning', timed && rem < 300);
    }
    if (timed && rem <= 0) finishExam(true);
  }, 300);
}

async function persistExam() {
  if (state.activeSession) await put('sessions', state.activeSession);
}

async function setExamAnswer(index) {
  const s = activeExam(), q = currentExamQuestion();
  if (!s || !q) return;
  s.answers[q.id] = Number(index);
  await persistExam();
  $$('.answer-choice', view).forEach((el, i) => {
    const active = i === Number(index);
    el.classList.toggle('selected', active);
    el.setAttribute('aria-pressed', String(active));
    el.setAttribute('aria-checked', String(active));
  });
  const answered = answeredCount(s);
  const totalQ = s.questions.length;
  const railFill = $('.exam-progress-rail-fill', view);
  if (railFill) railFill.style.height = `${totalQ ? Math.round((answered / totalQ) * 100) : 0}%`;
  const mapButton = $(`.question-map-item[data-index="${s.currentIndex}"]`, view);
  if (mapButton) mapButton.classList.add('answered');
}

async function moveExamTo(index) {
  const s = activeExam();
  if (!s) return;
  if (index < 0 || index >= s.questions.length) return;
  s.currentIndex = index;
  await persistExam();
  renderExam();
}

async function finishExam(timeUp = false, manualConfirmed = false) {
  const s = activeExam();
  if (!s || state.finalizing) return;
  if (!timeUp && !manualConfirmed && state.page === 'exam') {
    const total = s.questions.length;
    const answered = answeredCount(s);
    const blank = total - answered;
    const summaryHTML = `
      <div class="finish-confirm-summary">
        <p class="modal-copy">${esc(t('finishConfirmIntro'))}</p>
        <div class="finish-confirm-grid">
          <div class="finish-confirm-box"><span>${esc(t('finishTotalQ'))}</span><strong>${total}</strong></div>
          <div class="finish-confirm-box is-answered"><span>${esc(t('finishAnswered'))}</span><strong>${answered}</strong></div>
          <div class="finish-confirm-box ${blank > 0 ? 'is-blank' : ''}"><span>${esc(t('finishBlank'))}</span><strong>${blank}</strong></div>
        </div>
        ${blank > 0 ? `<p class="finish-confirm-warn"><strong>${blank}</strong> ${esc(t('finishWarnBlank'))}</p>` : `<p class="finish-confirm-ok">${esc(t('finishAllDone'))}</p>`}
      </div>`;
    const yes = await confirmModal(t('finishConfirmTitle'), summaryHTML, t('examFinishBtn'), false, true);
    if (!yes) return;
    return finishExam(false, true);
  }
  state.finalizing = true;
  state.practiceTranslationOpen = false;
  state.examSettingsOpen = false;
  if (s && s.selectiveState) {
    delete s.selectiveState;
  }
  if (examTicker) { clearInterval(examTicker); examTicker = null; }
  s.endedAt = Date.now();
  s.status = timeUp ? 'time-up' : 'completed';
  s.finishReason = timeUp ? 'time-limit' : 'manual-or-complete';
  s.elapsedSeconds = s.deadline
    ? Math.max(0, Math.min(s.durationMinutes * 60, Math.floor((s.endedAt - s.startedAt) / 1000)))
    : Math.max(0, Math.floor((s.endedAt - s.startedAt) / 1000));
  await put('sessions', s);
  state.resultId = s.id;
  state.activeSession = null;
  state.finalizing = false;
  await reloadData();
  state.page = 'result';
  state.practiceRevealAnswer = false;
  lastExamMapSessionId = null;
  document.body.classList.remove('exam-mode');
  document.documentElement.classList.remove('in-exam');
  cleanupFullscreen();
  render();
}

function getResultSession() {
  return state.sessions.find(s => s.id === state.resultId) || state.sessions.filter(s => s.status !== 'in_progress')[0];
}

function buildReviewCardsHTML(s, filter = 'all') {
  const qs = (s.questions || []).filter(q =>
    filter === 'all' ||
    (filter === 'wrong' && s.answers[q.id] != null && s.answers[q.id] !== q.correctIndex) ||
    (filter === 'blank' && s.answers[q.id] == null) ||
    (filter === 'correct' && s.answers[q.id] === q.correctIndex)
  );
  if (!qs.length) {
    return `<div class="zen-empty-block"><p class="hd-empty-line">${esc(t('reviewNoMatchFilter'))}</p></div>`;
  }
  const stripTrailingInstruction = rawPrompt => {
    const out = String(rawPrompt || '').replace(/(?:<ruby>最<rt>もっと<\/rt><\/ruby>も)?(?:<ruby>正<rt>ただ<\/rt><\/ruby>しい|<ruby>間違<rt>まちが<\/rt><\/ruby>っている)ものを<ruby>一<rt>ひと<\/rt><\/ruby>つ<ruby>選<rt>えら<\/rt><\/ruby>びなさい[。．.]?\s*$/i, '').trim();
    return out || rawPrompt;
  };
  return qs.map(q => {
    const liveQ = state.questions.find(x => x.id === q.id) || q;
    const qIdx = s.questions.findIndex(x => x.id === q.id) + 1;
    const answer = s.answers[q.id];
    const correct = answer === q.correctIndex;
    const blank = answer == null;
    const tag = blank ? t('reviewTagBlank') : correct ? t('reviewTagCorrect') : t('reviewTagWrong');
    const img = getQuestionMainMedia(q);
    const isTransOpen = Boolean(state.showAllTranslations || state.openTranslationIds?.has(q.id));
    const cardFuriOn = state.cardFurigana?.has(q.id) ? Boolean(state.cardFurigana.get(q.id)) : Boolean(state.examPrefs.showFurigana);
    const inStudy = isQuestionInStudy(q);

    const resolveLiveOption = (opt, idx) => {
      if (!opt || !Array.isArray(liveQ?.options)) return {};
      const origId = String(opt.originalId || '').trim().toUpperCase();
      if (origId) {
        const byOrig = liveQ.options.find(lo => String(lo.id || '').trim().toUpperCase() === origId);
        if (byOrig) return byOrig;
      }
      const optPlain = richPlainText(opt.text || '');
      if (optPlain && !/^[ABC]$/i.test(optPlain)) {
        const byText = liveQ.options.find(lo => richPlainText(lo.text || '') === optPlain);
        if (byText) return byText;
      }
      const curId = String(opt.id || '').trim().toUpperCase();
      if (curId) {
        const byId = liveQ.options.find(lo => String(lo.id || '').trim().toUpperCase() === curId);
        if (byId) return byId;
      }
      return liveQ.options[idx] || {};
    };

    const resolveOptTrans = (opt, idx) => {
      if (!opt) return '';
      const liveOpt = resolveLiveOption(opt, idx);
      return String(
        opt.translation || opt.textId || opt.optionTranslation || opt.terjemahan ||
        liveOpt.translation || liveOpt.textId || liveOpt.optionTranslation || liveOpt.terjemahan || ''
      ).trim();
    };

    const promptTrans = String(
      q.promptTranslation || liveQ.promptTranslation ||
      q.translation || liveQ.translation ||
      q.promptId || liveQ.promptId ||
      q.terjemahan || liveQ.terjemahan || ''
    ).trim();

    const userLetter = blank ? null : String.fromCharCode(65 + answer);
    const userOpt = blank ? null : (q.options?.[answer] || null);
    const userOptTrans = userOpt ? resolveOptTrans(userOpt, answer) : '';
    const userOptJa = userOpt ? richPlainText(userOpt.text || '') : '';

    const keyLetter = Number.isInteger(q.correctIndex) ? String.fromCharCode(65 + q.correctIndex) : 'A';
    const keyOpt = Number.isInteger(q.correctIndex) ? (q.options?.[q.correctIndex] || null) : null;
    const keyOptTrans = keyOpt ? resolveOptTrans(keyOpt, q.correctIndex) : '';
    const keyOptJa = keyOpt ? richPlainText(keyOpt.text || '') : '';

    const transOptionsHTML = (q.options || []).map((o, i) => {
      const letter = String.fromCharCode(65 + i);
      const optTrans = resolveOptTrans(o, i);
      const isKey = i === q.correctIndex;
      const isUser = i === answer;
      const badgeMark = isKey && isUser
        ? (state.lang === 'ja' ? '✓ あなたの回答・正解' : state.lang === 'en' ? '✓ Selected & Key' : '✓ Pilihan & Kunci')
        : isKey
        ? (state.lang === 'ja' ? '✓ 正解' : state.lang === 'en' ? '✓ Key' : '✓ Kunci')
        : isUser
        ? (state.lang === 'ja' ? '✕ あなたの回答' : state.lang === 'en' ? '✕ Your Choice' : '✕ Pilihan Anda')
        : '';
      return `
        <div class="zen-trans-opt ${isKey ? 'is-key' : ''} ${isUser && !correct ? 'is-wrong' : ''}">
          <span class="zen-trans-opt-letter">${letter}</span>
          <div class="zen-trans-opt-body">
            ${optTrans
              ? `<span class="zen-trans-opt-text rich-content">${richHTML(optTrans)}</span>`
              : `<span class="zen-trans-missing-inline">—</span>`}
          </div>
          ${badgeMark ? `<span class="zen-trans-badge ${isKey ? 'is-key' : 'is-user-wrong'}">${esc(badgeMark)}</span>` : ''}
        </div>`;
    }).join('');

    return `
      <article class="review-card zen-review-item ${blank ? 'is-blank' : correct ? 'is-correct' : 'is-wrong'} ${cardFuriOn ? 'furigana-on' : 'furigana-off'}" data-review-id="${esc(q.id)}">
        <div class="zen-review-top">
          <div class="zen-review-top-left">
            <span class="zen-q-num">${String(qIdx).padStart(2, '0')}</span>
            <span class="zen-review-tag ${blank ? 'is-blank' : correct ? 'is-correct' : 'is-wrong'}">${esc(tag)}</span>
          </div>
          <div class="zen-review-top-right">
            <button type="button" class="zen-icon-toggle zen-furi-card-btn ${cardFuriOn ? 'is-active' : ''}" data-action="toggle-card-furigana" data-id="${esc(q.id)}" aria-pressed="${cardFuriOn}" title="${cardFuriOn ? esc(t('furiHideTitle')) : esc(t('furiShowTitle'))}" aria-label="Furigana ${qIdx}">
              <span class="zen-icon-glyph" aria-hidden="true">F</span>
            </button>
            <button type="button" class="zen-icon-toggle zen-trans-card-btn ${isTransOpen ? 'is-active' : ''}" data-action="toggle-card-translation" data-id="${esc(q.id)}" aria-expanded="${isTransOpen}" title="${isTransOpen ? esc(t('transHideTitle')) : esc(t('transShowTitle'))}" aria-label="Translation ${qIdx}">
              <span class="zen-icon-glyph" aria-hidden="true">文A</span>
            </button>
            <button type="button" class="zen-icon-toggle zen-study-card-btn ${inStudy ? 'is-active' : ''}" data-action="toggle-review-study" data-id="${esc(q.id)}" aria-pressed="${inStudy}" title="${inStudy ? esc(t('studyRemoveTooltip')) : esc(t('studyAddTooltip'))}" aria-label="${inStudy ? esc(t('studyRemoveTooltip')) : esc(t('studyAddTooltip'))}">
              <span class="zen-icon-glyph" aria-hidden="true">${inStudy ? '✓' : '+'}</span>
            </button>
          </div>
        </div>
        ${q.instructions ? `<div class="zen-review-instruction rich-content" lang="ja">${richHTML(q.instructions)}</div>` : ''}
        <h3 class="zen-review-prompt rich-content" lang="ja">${richHTML(q.instructions ? stripTrailingInstruction(q.prompt) : q.prompt)}</h3>
        ${img ? `<img class="zen-review-image" src="${mediaURL(img)}" alt="Ilustrasi ${qIdx}">` : ''}
        <div class="zen-review-options">
          ${(q.options || []).map((o, i) => {
            const m = getOptionMedia(q, o, i);
            const isKey = i === q.correctIndex;
            const isUserWrong = i === answer && !correct;
            const isUserCorrect = i === answer && correct;
            const markLabel = isUserCorrect
              ? '✓'
              : isKey
              ? '✓'
              : isUserWrong
              ? '✕'
              : '';
            return `
              <div class="zen-review-opt ${isKey ? 'is-correct' : ''} ${isUserWrong ? 'is-wrong' : ''}">
                <span class="zen-opt-letter">${String.fromCharCode(65 + i)}</span>
                <div class="zen-opt-body">
                  <span class="rich-content" lang="ja">${richHTML(o.text)}</span>
                  ${m ? `<img src="${mediaURL(m)}" alt="Gambar opsi">` : ''}
                </div>
                ${markLabel ? `<span class="zen-review-mark" aria-hidden="true">${esc(markLabel)}</span>` : ''}
              </div>`;
          }).join('')}
        </div>
        <div class="zen-translation-panel ${isTransOpen ? 'is-open' : ''}" ${isTransOpen ? '' : 'hidden'} lang="id">
          ${promptTrans
            ? `<div class="zen-trans-prompt rich-content">${richHTML(promptTrans)}</div>`
            : `<div class="zen-trans-missing">${esc(t('reviewTransMissing'))}</div>`}
          <div class="zen-trans-options-list">
            ${transOptionsHTML}
          </div>
          <div class="zen-trans-eval-bar">
            <span class="zen-trans-eval-chip ${blank ? 'is-blank' : correct ? 'is-correct' : 'is-wrong'}">
              ${esc(t('reviewSelectedLabel'))} <strong>${blank ? '—' : `${esc(userLetter)}${userOptTrans ? ` · ${esc(richPlainText(userOptTrans))}` : (userOptJa ? ` (${esc(userOptJa)})` : '')}`}</strong>
            </span>
            <span class="zen-trans-eval-chip is-correct">
              ${esc(t('reviewKeyLabel'))} <strong>${esc(keyLetter)}${keyOptTrans ? ` · ${esc(richPlainText(keyOptTrans))}` : (keyOptJa ? ` (${esc(keyOptJa)})` : '')}</strong>
            </span>
          </div>
          ${q.explanation ? `
            <div class="zen-trans-explanation" style="margin-top: 6px; padding-top: 8px; border-top: 1px dashed var(--zen-line); font-size: 13.5px; line-height: 1.6; color: var(--zen-ink);">
              <strong style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--zen-muted); margin-bottom: 4px;">Pembahasan & Konsep</strong>
              <div class="rich-content" style="white-space: pre-wrap;">${richHTML(q.explanation)}</div>
            </div>` : ''}
        </div>
      </article>`;
  }).join('');
}

function renderResult() {
  const s = getResultSession();
  if (!s) {
    view.innerHTML = `<div class="zen-page"><div class="zen-empty-block"><p class="hd-empty-line">${esc(t('resultNotFound'))}</p><button class="hd-btn-secondary" data-page="history">${esc(t('navHistory'))}</button></div></div>`;
    return;
  }
  const st = rawStats(s);
  const elapsed = s.elapsedSeconds ?? Math.max(0, Math.floor(((s.endedAt || Date.now()) - s.startedAt) / 1000));
  const f = state.reviewFilter || 'all';
  const loc = t('locale');
  const statusLabel = s.status === 'time-up' ? t('statusTimeUp') : t('statusCompleted');
  const cleanTitle = formatHomeSessionTitle(s);
  const dObj = new Date(s.endedAt || s.startedAt || Date.now());
  const prometricDate = `${dObj.getFullYear()}/${String(dObj.getMonth() + 1).padStart(2, '0')}/${String(dObj.getDate()).padStart(2, '0')}`;
  const modeReportLabel = s.mode === 'practice'
    ? 'Practice Mode (Untimed)'
    : `CBT Mock Test (${s.durationMinutes || 70} Mins)`;

  const configuredPassingScore = Number(s.passingScore ?? state.settings?.passingScore) > 0
    ? Number(s.passingScore ?? state.settings?.passingScore)
    : null;
  const isPassed = configuredPassingScore != null ? st.weightedScore >= configuredPassingScore : null;
  const examResultText = configuredPassingScore != null
    ? (isPassed ? '合格 / PASS' : '不合格 / FAIL')
    : `${s.status === 'time-up' ? '時間切れ完了 / Completed (Time Up)' : '完了（自己評価） / Completed (Self-Evaluation)'} — ${st.correct} / ${st.total} Correct`;
  const examResultStateClass = configuredPassingScore != null
    ? (isPassed ? 'is-pass' : 'is-fail')
    : 'is-completed';
  const passingScoreText = configuredPassingScore != null
    ? `${configuredPassingScore} / ${st.maxWeightedScore}`
    : `未設定（自己評価・${st.maxWeightedScore}点満点） / Not Set in Mock Test Config`;

  view.innerHTML = `
    <div class="zen-page zen-result-page">
      ${s.originSessionId ? `
      <nav class="exam-retry-breadcrumb no-print" aria-label="Navigasi Sesi Ulang">
        <div class="breadcrumb-container">
          <span class="breadcrumb-item breadcrumb-parent">${esc(s.originExamTitle || 'Sesi Ujian Utama')}</span>
          <span class="breadcrumb-separator" aria-hidden="true">›</span>
          <span class="breadcrumb-item breadcrumb-current">Latihan Ulang Jawaban Salah</span>
          <button type="button"
                  class="button button-subtle button-small breadcrumb-return-btn"
                  data-action="return-to-parent-results"
                  data-parent-id="${esc(s.originSessionId)}"
                  aria-label="Kembali ke Hasil Ujian Utama">
            ‹ Kembali ke Hasil Utama
          </button>
        </div>
      </nav>` : ''}
      <header class="zen-page-head no-print">
        <div>
          <span class="zen-kicker">${esc(t('resultKicker'))} · ${esc(statusLabel).toUpperCase()}</span>
          <h1 class="zen-page-title">${esc(cleanTitle)}</h1>
          <p class="zen-page-meta">${esc(s.candidateName || 'Faiz')} · ${fmtDate(s.endedAt || s.startedAt, loc)} · ${s.mode === 'practice' ? esc(t('modePractice')) : esc(t('modeExam'))}</p>
        </div>
        <div class="zen-page-head-actions">
          <button type="button" class="hd-btn-secondary" data-action="print-result">Print / Save as PDF</button>
          <button type="button" class="hd-btn-secondary" data-action="export-result" data-id="${esc(s.id)}">${esc(t('btnExportJson'))}</button>
          <button type="button" class="hd-btn-primary" data-page="setup">${esc(cleanHomeText(t('btnNextExam')))}</button>
        </div>
      </header>

      <section class="prometric-report print-report" aria-label="Mock Test Result Notification">
        <div class="pr-sheet-top">
          <div class="pr-issuer-brand">
            <img class="pr-issuer-icon" src="./favicon.png?v=ssw18" alt="SSW PM Mock Test Icon" width="38" height="38">
            <div class="pr-issuer-text">
              <strong>SSW PM MOCK TEST</strong>
              <span>特定技能1号・飲食料品製造業 · SIMULATOR EVALUASI MANDIRI</span>
            </div>
          </div>
          <span class="pr-mock-badge">MOCK TEST / NOT OFFICIAL</span>
        </div>

        <div class="pr-title-block">
          <h2 class="pr-title-jp" lang="ja">模擬試験結果通知書</h2>
          <p class="pr-title-en">Mock Test Result Notification</p>
        </div>

        <div class="pr-candidate-section ${s.candidatePhoto ? 'has-photo' : ''}">
          <div class="pr-meta-columns">
            <div class="pr-meta-col">
              <div class="pr-meta-row">
                <div class="pr-meta-label">
                  <span class="pr-lbl-jp" lang="ja">受験者名</span>
                  <span class="pr-lbl-en">Candidate Name</span>
                </div>
                <div class="pr-meta-val">: <strong>${esc(s.candidateName || 'Faiz')}</strong></div>
              </div>
              <div class="pr-meta-row">
                <div class="pr-meta-label">
                  <span class="pr-lbl-jp" lang="ja">セッションID</span>
                  <span class="pr-lbl-en">Session ID</span>
                </div>
                <div class="pr-meta-val">: <span>${esc(s.id)}</span></div>
              </div>
              <div class="pr-meta-row">
                <div class="pr-meta-label">
                  <span class="pr-lbl-jp" lang="ja">問題パッケージ</span>
                  <span class="pr-lbl-en">Question Package</span>
                </div>
                <div class="pr-meta-val">: <strong>${esc(cleanTitle)}</strong></div>
              </div>
            </div>

            <div class="pr-meta-col">
              <div class="pr-meta-row">
                <div class="pr-meta-label">
                  <span class="pr-lbl-jp" lang="ja">試験日</span>
                  <span class="pr-lbl-en">Test Date</span>
                </div>
                <div class="pr-meta-val">: <span>${esc(prometricDate)}</span></div>
              </div>
              <div class="pr-meta-row">
                <div class="pr-meta-label">
                  <span class="pr-lbl-jp" lang="ja">試験モード</span>
                  <span class="pr-lbl-en">Exam Mode</span>
                </div>
                <div class="pr-meta-val">: <span>${esc(modeReportLabel)}</span></div>
              </div>
              <div class="pr-meta-row">
                <div class="pr-meta-label">
                  <span class="pr-lbl-jp" lang="ja">所要時間</span>
                  <span class="pr-lbl-en">Duration</span>
                </div>
                <div class="pr-meta-val">: <span>${esc(fmtDuration(elapsed))}</span></div>
              </div>
            </div>
          </div>

          ${s.candidatePhoto ? `
            <div class="pr-photo-frame">
              <img class="pr-candidate-photo" src="${s.candidatePhoto}" alt="Candidate photo">
            </div>
          ` : ''}
        </div>

        <div class="pr-results-section">
          <div class="pr-results-intro">
            <p class="pr-intro-jp" lang="ja">試験の結果は以下の通りです。</p>
            <p class="pr-intro-en">Your test results are as follows.</p>
          </div>

          <div class="pr-results-table">
            <div class="pr-result-row">
              <div class="pr-result-label">
                <span class="pr-lbl-jp" lang="ja">試験名</span>
                <span class="pr-lbl-en">Exam Name</span>
              </div>
              <div class="pr-result-val">
                <div class="pr-exam-name-jp" lang="ja">: 飲食料品製造業特定技能1号技能測定試験（模擬試験）</div>
                <div class="pr-exam-name-en">Food and Beverage Manufacturing Specified Skilled Worker (i) Skills Evaluation Test — ${esc(cleanTitle)}</div>
              </div>
            </div>

            <div class="pr-result-row">
              <div class="pr-result-label">
                <span class="pr-lbl-jp" lang="ja">得点</span>
                <span class="pr-lbl-en">Score</span>
              </div>
              <div class="pr-result-val pr-score-val">
                : <strong>${st.weightedScore}</strong> <span class="pr-score-max">/ ${st.maxWeightedScore}</span> <span class="pr-score-pct">(${st.percent}%)</span>
              </div>
            </div>

            <div class="pr-result-row">
              <div class="pr-result-label">
                <span class="pr-lbl-jp" lang="ja">試験結果</span>
                <span class="pr-lbl-en">Exam Result</span>
              </div>
              <div class="pr-result-val">
                : <strong class="pr-exam-status ${examResultStateClass}">${esc(examResultText)}</strong>
              </div>
            </div>

            <div class="pr-result-row">
              <div class="pr-result-label">
                <span class="pr-lbl-jp" lang="ja">合格基準点</span>
                <span class="pr-lbl-en">Passing Score</span>
              </div>
              <div class="pr-result-val">
                : <span>${esc(passingScoreText)}</span>
              </div>
            </div>
          </div>

          <div class="pr-breakdown-grid" aria-label="Score Breakdown">
            <div class="pr-breakdown-cell">
              <span class="pr-bd-label">正解数 / Correct</span>
              <strong class="pr-bd-val is-correct">${st.correct} <small>/ ${st.total}</small></strong>
            </div>
            <div class="pr-breakdown-cell">
              <span class="pr-bd-label">不正解数 / Wrong</span>
              <strong class="pr-bd-val ${st.wrong > 0 ? 'is-wrong' : ''}">${st.wrong}</strong>
            </div>
            <div class="pr-breakdown-cell">
              <span class="pr-bd-label">未回答 / Unanswered</span>
              <strong class="pr-bd-val">${st.unanswered}</strong>
            </div>
            <div class="pr-breakdown-cell">
              <span class="pr-bd-label">正答率 / Accuracy</span>
              <strong class="pr-bd-val">${st.percent}%</strong>
            </div>
            <div class="pr-breakdown-cell">
              <span class="pr-bd-label">所要時間 / Duration</span>
              <strong class="pr-bd-val">${esc(fmtDuration(elapsed))}</strong>
            </div>
          </div>
        </div>

        <footer class="pr-sheet-footer">
          <p class="pr-disclaimer">This document is a practice test result generated by SSW PM Mock Test. It is not an official OTAFF or Prometric examination certificate.</p>
        </footer>
      </section>

      <div class="zen-result-photo-row no-print">
        <label class="hd-text-btn" for="result-photo-upload">${s.candidatePhoto ? esc(t('reviewPhotoChange')) : esc(t('reviewPhotoAdd'))}</label>
        <input type="file" id="result-photo-upload" accept="image/*" hidden>
      </div>

      <section class="zen-review-section no-print">
        <div class="zen-review-bar">
          <div class="zen-review-bar-left">
            <h2 class="hd-section-title">${esc(t('reviewSectionTitle'))}</h2>
            <select id="review-filter" aria-label="${esc(t('revFilterLabel'))}">
              <option value="all" ${f==='all'?'selected':''}>${esc(t('revFilterAll'))} (${s.questions.length})</option>
              <option value="wrong" ${f==='wrong'?'selected':''}>${esc(t('revFilterWrong'))} (${st.wrong})</option>
              <option value="blank" ${f==='blank'?'selected':''}>${esc(t('revFilterBlank'))} (${st.unanswered})</option>
              <option value="correct" ${f==='correct'?'selected':''}>${esc(t('revFilterCorrect'))} (${st.correct})</option>
            </select>
            <button type="button"
                    class="button button-primary button-small retry-incorrect-btn"
                    data-action="retry-incorrect-questions"
                    data-session-id="${esc(s.id)}"
                    aria-label="Ulangi Jawaban Salah (${st.wrong})">
              Ulangi Jawaban Salah (${st.wrong})
            </button>
          </div>
          <div class="zen-review-bar-actions">
            <button type="button" class="zen-icon-toggle zen-trans-global-btn ${state.showAllTranslations ? 'is-active' : ''}" data-action="toggle-all-translations" aria-pressed="${Boolean(state.showAllTranslations)}" title="${state.showAllTranslations ? esc(t('transHideTitle')) : esc(t('transShowTitle'))}" aria-label="Tampilkan atau sembunyikan semua terjemahan bahasa Indonesia">
              <span class="zen-icon-glyph" aria-hidden="true">文A</span>
            </button>
            <button type="button" class="zen-icon-toggle ${state.examPrefs.showFurigana ? 'is-active' : ''}" data-action="toggle-furigana-quick" aria-pressed="${Boolean(state.examPrefs.showFurigana)}" title="${state.examPrefs.showFurigana ? esc(t('furiHideTitle')) : esc(t('furiShowTitle'))}" aria-label="Tampilkan atau sembunyikan furigana">
              <span class="zen-icon-glyph" aria-hidden="true">F</span>
            </button>
          </div>
        </div>
        <div class="review-list zen-review-list">
          ${buildReviewCardsHTML(s, f)}
        </div>
      </section>
    </div>`;
}


function updateStudyBadge() {
  const count = Array.isArray(state.studyList) ? state.studyList.length : 0;
  const badge = $('#nav-study-badge');
  if (badge) {
    badge.textContent = String(count);
    badge.classList.toggle('is-zero', count === 0);
  }
}

function getStudyKey(q) {
  if (!q) return '';
  const liveQ = (state.questions || []).find(x => x.id === q.id) || q;
  const setId = liveQ.setId || q.setId || 'ssw-pm-kunci-ujian-1';
  return `${setId}::${q.id}`;
}

function isQuestionInStudy(q) {
  if (!q) return false;
  const liveQ = (state.questions || []).find(x => x.id === q.id) || q;
  const setId = liveQ.setId || q.setId || 'ssw-pm-kunci-ujian-1';
  const studyId = `${setId}::${q.id}`;
  return (state.studyList || []).some(
    item => item.id === studyId || item.id === q.id || (item.questionId === q.id && (item.setId === setId || item.packageId === setId))
  );
}

function makeStudyItem(q) {
  const liveQ = (state.questions || []).find(x => x.id === q.id) || q;
  const setId = liveQ.setId || q.setId || 'ssw-pm-kunci-ujian-1';
  const studyId = `${setId}::${q.id}`;
  const setName = packageName(setId, liveQ.setName || q.setName || setId);
  return {
    id: studyId,
    compositeId: studyId,
    packageId: setId,
    setId: setId,
    setName: setName,
    questionId: q.id,
    questionNumber: liveQ.questionNumber ?? q.questionNumber ?? 1,
    prompt: liveQ.prompt || q.prompt || '',
    questionText: liveQ.prompt || q.prompt || '',
    instructions: liveQ.instructions || q.instructions || '',
    options: structuredClone(liveQ.options || q.options || []),
    correctIndex: liveQ.correctIndex ?? q.correctIndex ?? 0,
    correctAnswer: liveQ.correctAnswer || q.correctAnswer || 'A',
    explanation: liveQ.explanation || q.explanation || '',
    promptTranslation: liveQ.promptTranslation || q.promptTranslation || '',
    imageMediaId: liveQ.imageMediaId || q.imageMediaId || null,
    questionImage: liveQ.questionImage || q.questionImage || null,
    imageSize: liveQ.imageSize || q.imageSize || 'medium',
    imageRatio: liveQ.imageRatio || q.imageRatio || 'auto',
    imagePosition: liveQ.imagePosition || q.imagePosition || 'center',
    media: liveQ.media || q.media || null,
    addedAt: new Date().toISOString()
  };
}

async function toggleStudyItem(q) {
  if (!q) return false;
  const liveQ = (state.questions || []).find(x => x.id === q.id) || q;
  const setId = liveQ.setId || q.setId || 'ssw-pm-kunci-ujian-1';
  const studyId = `${setId}::${q.id}`;
  if (!Array.isArray(state.studyList)) state.studyList = [];
  
  const existingIdx = state.studyList.findIndex(
    item => item.id === studyId || item.id === q.id || (item.questionId === q.id && (item.setId === setId || item.packageId === setId))
  );

  if (existingIdx >= 0) {
    const existing = state.studyList[existingIdx];
    state.studyList.splice(existingIdx, 1);
    try {
      await del('studyList', existing.id);
    } catch (e) {
      console.warn('Gagal menghapus dari IndexedDB studyList:', e);
    }
    updateStudyBadge();
    toast(t('studyRemovedToast'), 'info');
    return false;
  } else {
    const newItem = makeStudyItem(q);
    state.studyList.unshift(newItem);
    try {
      await put('studyList', newItem);
    } catch (e) {
      console.warn('Gagal menyimpan ke IndexedDB studyList:', e);
    }
    updateStudyBadge();
    toast(t('studyAddedToast'), 'success');
    return true;
  }
}

async function removeStudyItem(studyId) {
  if (!studyId || !Array.isArray(state.studyList)) return;
  const idx = state.studyList.findIndex(item => item.id === studyId || item.questionId === studyId);
  if (idx >= 0) {
    const item = state.studyList[idx];
    state.studyList.splice(idx, 1);
    try {
      await del('studyList', item.id);
    } catch (e) {
      console.warn('Gagal menghapus studyList:', e);
    }
    updateStudyBadge();
    toast(t('studyRemovedToast'), 'info');
  }
}

function openStudyDetail(item) {
  if (!item) return;
  const img = getQuestionMainMedia(item);
  const content = `
    <div class="zen-study-modal-wrap">
      <div class="zen-study-card-meta">
        <span class="zen-study-pkg-pill">${esc(item.setName || packageName(item.setId))}</span>
        <span class="zen-study-qnum-pill">No. ${item.questionNumber}</span>
        <span class="zen-study-date">${esc(t('studyAddedDate'))} ${fmtDate(item.addedAt, t('locale'))}</span>
      </div>

      ${item.instructions ? `<div class="zen-review-instruction rich-content" lang="ja">${richHTML(item.instructions)}</div>` : ''}
      <h3 class="zen-study-prompt rich-content" lang="ja" style="margin: 8px 0 12px;">${richHTML(item.prompt)}</h3>

      ${img ? `<img class="zen-study-image" src="${mediaURL(img)}" alt="Ilustrasi">` : ''}

      <div class="zen-study-options">
        ${(item.options || []).map((o, i) => {
          const isCorrect = i === item.correctIndex;
          const letter = String.fromCharCode(65 + i);
          const optTrans = o.translation || o.textId || '';
          return `
            <div class="zen-study-opt ${isCorrect ? 'is-correct' : ''}">
              <span class="zen-study-opt-letter">${letter}</span>
              <div class="zen-study-opt-body">
                <span class="rich-content" lang="ja">${richHTML(o.text)}</span>
                ${optTrans ? `<div class="zen-trans-opt-text" style="color:#566a7f;font-size:12.5px;margin-top:2px;">${richHTML(optTrans)}</div>` : ''}
              </div>
              ${isCorrect ? `<span class="zen-study-correct-badge">${esc(t('studyCorrectKey'))}</span>` : ''}
            </div>
          `;
        }).join('')}
      </div>

      ${item.promptTranslation ? `
        <div class="zen-study-translation-panel">
          <strong style="color: #1a2228;">${esc(t('studyPromptTransLabel'))}</strong>
          <div class="rich-content" lang="id">${richHTML(item.promptTranslation)}</div>
        </div>
      ` : ''}

      ${item.explanation ? `
        <div class="zen-study-explanation">
          <strong>${esc(t('studyExplanationLabel'))}</strong>
          <div class="rich-content">${richHTML(item.explanation)}</div>
        </div>
      ` : ''}
    </div>
  `;
  const footer = `
    <button type="button" class="button button-outline" data-action="close-modal">${esc(t('btnClose'))}</button>
    <button type="button" class="button button-danger" data-action="remove-study-item" data-id="${esc(item.id)}" onclick="closeModal()">${esc(t('studyRemoveBtn'))}</button>
  `;
  modal(`${esc(item.setName || 'Soal')} — No. ${item.questionNumber}`, content, footer);
}

function renderStudy() {
  const items = Array.isArray(state.studyList) ? state.studyList : [];
  const totalCount = items.length;

  if (totalCount === 0) {
    view.innerHTML = `
      <div class="zen-page zen-study-page">
        <header class="zen-page-head">
          <div>
            <span class="zen-kicker">${esc(t('studyKicker'))}</span>
            <h1 class="zen-page-title">${esc(t('navStudy'))}</h1>
            <p class="zen-page-desc">${esc(t('studyPageDesc'))}</p>
          </div>
          <div class="zen-page-head-actions">
            <span class="zen-meta-count" id="study-total-count">0 ${esc(t('studyMetaCount'))}</span>
            <button type="button" class="hd-btn-primary" data-page="setup">${esc(t('topStartExam'))}</button>
          </div>
        </header>

        <div class="zen-empty-block">
          <div class="zen-empty-icon" style="font-size: 48px; margin-bottom: 12px;">🔖</div>
          <h3 class="hd-empty-title">${esc(t('studyEmptyTitle'))}</h3>
          <p class="hd-empty-line" style="max-width: 440px; margin: 0 auto 20px; line-height: 1.6; color: var(--zen-muted);">
            ${esc(t('studyEmptyDesc'))}
          </p>
          <button type="button" class="hd-btn-primary" data-page="setup">${esc(t('topStartExam'))}</button>
        </div>
      </div>
    `;
    return;
  }

  // Count per package
  const pkgMap = new Map();
  for (const item of items) {
    const pkgId = item.setId || item.packageId || 'unknown';
    const pkgName = item.setName || packageName(pkgId, pkgId);
    if (!pkgMap.has(pkgId)) {
      pkgMap.set(pkgId, { id: pkgId, name: pkgName, count: 0 });
    }
    pkgMap.get(pkgId).count++;
  }
  const packages = Array.from(pkgMap.values()).sort((a, b) => b.count - a.count);

  // Filter
  const qSearch = (state.studySearch || '').toLowerCase().trim();
  const pkgFilter = state.studyPackageFilter || 'all';

  let filtered = items.filter(item => {
    if (pkgFilter !== 'all' && item.setId !== pkgFilter && item.packageId !== pkgFilter) {
      return false;
    }
    if (qSearch) {
      const pText = (item.prompt || '').toLowerCase();
      const pTrans = (item.promptTranslation || '').toLowerCase();
      const optText = (item.options || []).map(o => (o.text || '') + ' ' + (o.translation || '')).join(' ').toLowerCase();
      const matches = pText.includes(qSearch) || pTrans.includes(qSearch) || optText.includes(qSearch);
      if (!matches) return false;
    }
    return true;
  });

  // Sort
  const sortMode = state.studySort || 'recent';
  if (sortMode === 'recent') {
    filtered.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
  } else if (sortMode === 'oldest') {
    filtered.sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0));
  } else if (sortMode === 'number') {
    filtered.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
  }

  view.innerHTML = `
    <div class="zen-page zen-study-page">
      <header class="zen-page-head">
        <div>
          <span class="zen-kicker">${esc(t('studyKicker'))}</span>
          <h1 class="zen-page-title">${esc(t('navStudy'))}</h1>
          <p class="zen-page-desc">${esc(t('studyPageDesc'))}</p>
        </div>
        <div class="zen-page-head-actions">
          <span class="zen-meta-count" id="study-total-count">${totalCount} ${esc(t('studyMetaCount'))}</span>
          <button type="button" class="hd-btn-primary" data-page="setup">${esc(t('topStartExam'))}</button>
        </div>
      </header>

      <section class="zen-study-filter-bar">
        <div class="zen-study-filter-left">
          <div class="zen-study-search-wrap">
            <input type="search" id="study-search-input" placeholder="${esc(t('studySearchPlaceholder'))}" value="${esc(state.studySearch || '')}">
          </div>
          <select class="hd-select" id="study-pkg-select">
            <option value="all">${esc(t('studyFilterAll'))} (${totalCount})</option>
            ${packages.map(p => `
              <option value="${esc(p.id)}" ${pkgFilter === p.id ? 'selected' : ''}>${esc(p.name)} (${p.count})</option>
            `).join('')}
          </select>
        </div>
        <div class="zen-study-filter-right">
          <select class="hd-select" id="study-sort-select">
            <option value="recent" ${sortMode === 'recent' ? 'selected' : ''}>${esc(t('studySortRecent'))}</option>
            <option value="oldest" ${sortMode === 'oldest' ? 'selected' : ''}>${esc(t('studySortOldest'))}</option>
            <option value="number" ${sortMode === 'number' ? 'selected' : ''}>${esc(t('studySortNumber'))}</option>
          </select>
        </div>
      </section>

      <section class="zen-study-list">
        ${filtered.length === 0 ? `
          <div class="zen-empty-block" style="padding: 36px 20px;">
            <p class="hd-empty-line">${esc(t('studyNoMatchFilter'))}</p>
            <button type="button" class="hd-btn-ghost" id="study-reset-filter-btn">${esc(t('studyResetFilterBtn'))}</button>
          </div>
        ` : filtered.map(item => {
          const img = getQuestionMainMedia(item);
          const furiOn = state.studyCardFurigana?.has(item.id)
            ? Boolean(state.studyCardFurigana.get(item.id))
            : Boolean(state.examPrefs.showFurigana);
          const transOpen = state.studyCardTrans?.has(item.id) ?? true;
          return `
            <article class="zen-study-card ${furiOn ? 'furigana-on' : 'furigana-off'}" data-study-id="${esc(item.id)}">
              <div class="zen-study-card-top">
                <div class="zen-study-card-meta">
                  <span class="zen-study-pkg-pill">${esc(item.setName || packageName(item.setId))}</span>
                  <span class="zen-study-qnum-pill">No. ${item.questionNumber}</span>
                  <span class="zen-study-date">${esc(t('studyAddedDate'))} ${fmtDate(item.addedAt, t('locale'))}</span>
                </div>
                <div class="zen-study-card-actions">
                  <button type="button" class="zen-icon-toggle ${furiOn ? 'is-active' : ''}" data-action="toggle-study-card-furigana" data-id="${esc(item.id)}" title="Toggle Furigana" aria-pressed="${furiOn}">F</button>
                  <button type="button" class="zen-icon-toggle ${transOpen ? 'is-active' : ''}" data-action="toggle-study-card-translation" data-id="${esc(item.id)}" title="Toggle Terjemahan" aria-pressed="${transOpen}">文A</button>
                  <button type="button" class="zen-action-btn" data-action="open-study-detail" data-id="${esc(item.id)}" title="${esc(t('studyDetail'))}">🔍 Detail</button>
                  <button type="button" class="zen-action-btn is-danger" data-action="remove-study-item" data-id="${esc(item.id)}" title="${esc(t('studyRemoveBtn'))}">✕</button>
                </div>
              </div>

              ${item.instructions ? `<div class="zen-review-instruction rich-content" lang="ja">${richHTML(item.instructions)}</div>` : ''}
              <h3 class="zen-study-prompt rich-content" lang="ja">${richHTML(item.prompt)}</h3>

              ${img ? `<img class="zen-study-image" src="${mediaURL(img)}" alt="Ilustrasi Soal ${item.questionNumber}">` : ''}

              <div class="zen-study-options">
                ${(item.options || []).map((o, idx) => {
                  const isCorrect = idx === item.correctIndex;
                  const letter = String.fromCharCode(65 + idx);
                  return `
                    <div class="zen-study-opt ${isCorrect ? 'is-correct' : ''}">
                      <span class="zen-study-opt-letter">${letter}</span>
                      <div class="zen-study-opt-body">
                        <span class="rich-content" lang="ja">${richHTML(o.text)}</span>
                      </div>
                      ${isCorrect ? `<span class="zen-study-correct-badge">${esc(t('studyCorrectKey'))}</span>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              <div class="zen-study-translation-panel ${transOpen ? '' : 'is-hidden'}" lang="id">
                ${item.promptTranslation ? `
                  <div style="font-weight:600;margin-bottom:4px;">${richHTML(item.promptTranslation)}</div>
                ` : `<div style="color:var(--zen-muted);font-style:italic;">${esc(t('studyTransMissing'))}</div>`}
                <div style="display:flex;flex-direction:column;gap:3px;margin-top:6px;font-size:13px;">
                  ${(item.options || []).map((o, idx) => {
                    const isKey = idx === item.correctIndex;
                    const letter = String.fromCharCode(65 + idx);
                    const optTrans = o.translation || o.textId || '';
                    return `
                      <div style="display:flex;gap:6px;align-items:baseline;${isKey ? 'font-weight:600;color:#2e5c1e;' : ''}">
                        <span>${letter}.</span>
                        <span>${optTrans ? richHTML(optTrans) : '—'}</span>
                        ${isKey ? `<span style="font-size:11px;background:#9ecb65;color:#1a3311;padding:1px 5px;border-radius:3px;">${esc(t('studyCorrectKey'))}</span>` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              ${item.explanation ? `
                <div class="zen-study-explanation">
                  <strong>Pembahasan:</strong>
                  <div class="rich-content">${richHTML(item.explanation)}</div>
                </div>
              ` : ''}
            </article>
          `;
        }).join('')}
      </section>
    </div>
  `;

  // Attach listeners
  const sInput = $('#study-search-input');
  if (sInput) {
    sInput.addEventListener('input', (e) => {
      state.studySearch = e.target.value;
      renderStudy();
      const nextInput = $('#study-search-input');
      if (nextInput) {
        nextInput.focus();
        nextInput.selectionStart = nextInput.selectionEnd = nextInput.value.length;
      }
    });
  }

  const pkgSelect = $('#study-pkg-select');
  if (pkgSelect) {
    pkgSelect.addEventListener('change', (e) => {
      state.studyPackageFilter = e.target.value;
      renderStudy();
    });
  }

  const sortSelect = $('#study-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.studySort = e.target.value;
      renderStudy();
    });
  }

  const resetBtn = $('#study-reset-filter-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.studySearch = '';
      state.studyPackageFilter = 'all';
      renderStudy();
    });
  }
}

function renderReview() {
  renderResult();
}

async function saveQuestion() {
  syncQuestionDraft();
  const q = state.editor.q;
  q.updatedAt = Date.now();
  const errors = validateQuestion(q);
  if (errors.length) {
    const el = $('#editor-errors');
    el.hidden = false;
    el.innerHTML = `<strong>Periksa kembali data soal</strong><ul>${errors.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    el.scrollIntoView({ block: 'nearest' });
    return;
  }
  const used = new Set([q.imageMediaId, ...q.options.map(o => o.mediaId)].filter(Boolean));
  q.media = (q.media || []).filter(m => used.has(m.id));
  if (!q.createdAt) q.createdAt = Date.now();
  await put('questions', q);
  closeModal();
  await reloadData();
  renderBank();
  toast('Soal SSW PM berhasil disimpan ke database lokal.', 'success');
}

function newQuestion(prefill = {}) {
  state.editor = { isNew: true, q: defaultQuestion(prefill), previewVisible: false };
  renderQuestionEditor();
}

function editQuestion(id) {
  const q = state.questions.find(x => x.id === id);
  if (!q) return;
  state.editor = { isNew: false, q: structuredClone(q), previewVisible: false };
  renderQuestionEditor();
}

async function deleteQuestion(id) {
  const q = state.questions.find(x => x.id === id);
  if (!q) return;
  const yes = await confirmModal(
    'Hapus soal ini?',
    `Soal #${q.questionNumber || ''} "${richPlainText(q.prompt || 'tanpa teks').slice(0, 90)}" akan dihapus dari Bank Soal.`,
    'Hapus Soal'
  );
  if (!yes) return;
  await del('questions', id);
  await reloadData();
  renderBank();
  toast('Soal telah dihapus.', 'success');
}

async function deleteSelectedQuestions() {
  const ids = [...state.bankSelectedIds].filter(id => state.questions.some(q => q.id === id));
  if (!ids.length) { toast('Pilih setidaknya satu soal terlebih dahulu.', 'warn'); return; }
  const yes = await confirmModal(
    'Hapus soal terpilih?',
    `Sebanyak ${ids.length} soal yang dipilih akan dihapus dari Bank Soal. Riwayat ujian yang sudah selesai tetap menyimpan salinan soal.`,
    `Hapus ${ids.length} Soal`
  );
  if (!yes) return;
  let deleted = 0;
  for (const id of ids) { await del('questions', id); deleted++; }
  state.bankSelectedIds.clear();
  await reloadData();
  renderBank();
  toast(`${deleted} soal berhasil dihapus.`, 'success');
}

async function exportBackupJSON() {
  try {
    const data = await serializeDatabase(await snapshot());
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      `ssw-pm-mock-test-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    toast('Ekspor database JSON lengkap berhasil dibuat.', 'success');
  } catch (e) {
    toast(`Ekspor gagal: ${e.message}`, 'error');
  }
}

async function exportBackupZIP() {
  try {
    toast('Menyiapkan arsip ZIP backup beserta media…');
    const data = await serializeDatabase(await snapshot());
    const backupBytes = new TextEncoder().encode(JSON.stringify(data));
    const readme = new TextEncoder().encode(
      'SSW PM MOCK TEST BY FAIZ — Backup Database Lengkap\n\nFile backup.json berisi seluruh bank soal SSW PM (特定技能1号・飲食料品製造業), furigana, ilustrasi gambar dalam format data URL, serta riwayat hasil ujian.\nPulihkan melalui menu Backup & Data di aplikasi.\n'
    );
    const zip = makeZip([
      { name: 'backup.json', bytes: backupBytes },
      { name: 'README.txt', bytes: readme }
    ]);
    downloadBlob(zip, `ssw-pm-mock-test-backup-${new Date().toISOString().slice(0, 10)}.zip`);
    toast(`ZIP backup lengkap siap (${(zip.size / 1024 / 1024).toFixed(1)} MB).`, 'success');
  } catch (e) {
    toast(`Ekspor ZIP gagal: ${e.message}`, 'error');
  }
}

function normalizeExternalQuestion(raw, idx = 0, defaultSetId = 'ssw-pm-kunci-ujian-1', defaultSetName = 'Soal Ujian 1 — CBTP Gino1') {
  if (!raw || typeof raw !== 'object') return null;
  const num = Number.isInteger(raw.questionNumber) ? raw.questionNumber : (idx + 1);
  const setId = String(raw.setId || defaultSetId).trim();
  const setName = String(raw.setName || packageName(setId, defaultSetName)).replace(/^Kunci Soal Ujian\b/, 'Soal Ujian').trim();
  const id = String(raw.id || `${setId}-q${String(num).padStart(3, '0')}`).trim();
  const questionImage = String(raw.questionImage || '').trim();
  const prompt = String(raw.prompt || raw.questionText || `Soal ${num}`).trim();
  const questionText = String(raw.questionText || richPlainText(prompt)).trim();
  const mainMediaId = raw.imageMediaId || (questionImage ? `media-${id}` : '');
  const media = Array.isArray(raw.media) ? structuredClone(raw.media) : [];
  if (questionImage && !media.some(m => m.id === mainMediaId)) {
    media.push({
      id: mainMediaId,
      name: questionImage.split('/').pop() || `${id}.png`,
      type: 'image/png',
      path: questionImage
    });
  }
  const rawOptions = Array.isArray(raw.options) ? raw.options : [];
  const options = rawOptions.map((o, i) => {
    const optLetter = String(o?.id || String.fromCharCode(65 + i)).trim().toUpperCase();
    const optImg = String(o?.optionImage || o?.image || '').trim();
    const optMediaId = o?.mediaId || (optImg ? `media-${id}-${optLetter.toLowerCase()}` : '');
    if (optImg && !media.some(m => m.id === optMediaId)) {
      media.push({
        id: optMediaId,
        name: optImg.split('/').pop() || `${id}_${optLetter.toLowerCase()}.png`,
        type: 'image/png',
        path: optImg
      });
    }
    const optTrans = String(o?.translation ?? o?.textId ?? o?.optionTranslation ?? o?.terjemahan ?? '').trim();
    const entry = {
      id: optLetter,
      text: String(o?.text ?? optLetter).trim(),
      translation: optTrans,
      mediaId: optMediaId
    };
    if (optImg) entry.optionImage = optImg;
    return entry;
  });

  const promptTranslation = String(raw.promptTranslation ?? raw.translation ?? raw.promptId ?? raw.terjemahan ?? '').trim();
  let correctIndex = Number.isInteger(raw.correctIndex) ? raw.correctIndex : null;
  const correctAnswer = raw.correctAnswer != null ? String(raw.correctAnswer).trim().toUpperCase() : null;
  if (correctIndex == null && correctAnswer) {
    const byId = options.findIndex(o => String(o.id || '').toUpperCase() === correctAnswer);
    if (byId >= 0) correctIndex = byId;
    else {
      const code = correctAnswer.charCodeAt(0) - 65;
      if (code >= 0 && code < options.length) correctIndex = code;
    }
  }
  const baseTs = (setId === 'ssw-pm-kunci-ujian-1' ? 1762000000000 : 1760961600000) + num;
  return {
    ...defaultQuestion({ setId, setName }),
    ...raw,
    id,
    setId,
    setName,
    questionNumber: num,
    sourcePdf: raw.sourcePdf || (setId === 'ssw-pm-kunci-ujian-1' ? 'Kunci Soal Ujian 1.pdf' : 'SSW NGUYEN 1.pdf'),
    sourcePage: raw.sourcePage || raw.pdfPage || 1,
    pdfPage: raw.sourcePage || raw.pdfPage || 1,
    points: Number(raw.points) > 0 ? Number(raw.points) : 3.75,
    questionImage,
    questionText,
    prompt,
    promptTranslation,
    instructions: raw.instructions || '<ruby>正<rt>ただ</rt></ruby>しいものを<ruby>一<rt>ひと</rt></ruby>つ<ruby>選<rt>えら</rt></ruby>びなさい。',
    options,
    correctIndex,
    correctAnswer: correctAnswer || (correctIndex != null ? String.fromCharCode(65 + correctIndex) : 'A'),
    imageMediaId: mainMediaId,
    imageSize: raw.imageSize || (questionImage ? 'medium' : 'large'),
    imageRatio: raw.imageRatio || 'auto',
    imagePosition: raw.imagePosition || 'center',
    media,
    active: raw.active !== false,
    isDemo: false,
    createdAt: raw.createdAt || baseTs,
    updatedAt: raw.updatedAt || baseTs
  };
}

async function fetchBuiltinJson(filename) {
  const candidates = [`./${filename}`, `./data/${filename}`];
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
  }
  return null;
}

function hasCompleteTranslations(questions) {
  return Array.isArray(questions) && questions.length > 0 && questions.every(q =>
    Boolean(String(q.promptTranslation || '').trim()) &&
    Array.isArray(q.options) &&
    q.options.length > 0 &&
    q.options.every(o => Boolean(String(o.translation || '').trim()))
  );
}

function mergeQuestionTranslations(existing, incoming) {
  if (!existing) return incoming;
  const merged = structuredClone(existing);
  if (!String(merged.promptTranslation || '').trim() && String(incoming.promptTranslation || '').trim()) {
    merged.promptTranslation = String(incoming.promptTranslation).trim();
  }
  if (Array.isArray(merged.options) && Array.isArray(incoming.options)) {
    merged.options = merged.options.map((opt, idx) => {
      if (String(opt?.translation || '').trim()) return opt;
      const optId = String(opt?.id || '').trim().toUpperCase();
      const match = incoming.options.find(io => String(io?.id || '').trim().toUpperCase() === optId) || incoming.options[idx];
      const trans = String(match?.translation || '').trim();
      return trans ? { ...opt, translation: trans } : opt;
    });
  }
  return merged;
}

async function importAdditiveQuestionSet(payload, { silent = false, force = false, defaultSetId = 'ssw-pm-kunci-ujian-1', defaultSetName = 'Soal Ujian 1 — CBTP Gino1', skipReload = false } = {}) {
  const rawList = Array.isArray(payload) ? payload : (Array.isArray(payload?.questions) ? payload.questions : []);
  if (!rawList.length) throw new Error('File JSON tidak berisi daftar soal yang valid.');
  const setId = payload?.setId || defaultSetId;
  const setName = payload?.setName || payload?.title || defaultSetName;
  const byId = new Map(state.questions.map(q => [q.id, q]));
  const batch = [];
  for (let i = 0; i < rawList.length; i++) {
    const normalized = normalizeExternalQuestion(rawList[i], i, setId, setName);
    if (!normalized) continue;
    const errs = validateQuestion(normalized);
    if (errs.length) throw new Error(`Soal ${normalized.id} tidak valid: ${errs.join(', ')}`);
    const existing = byId.get(normalized.id);
    const finalQ = (!force && existing) ? mergeQuestionTranslations(existing, normalized) : normalized;
    byId.set(finalQ.id, finalQ);
    batch.push(finalQ);
  }
  state.questions = [...byId.values()];

  let saved = batch.length;
  try {
    saved = await putMany('questions', batch);
    if (!skipReload) await reloadData();
  } catch (err) {
    console.warn('Penyimpanan IndexedDB penuh/dilewati, menggunakan memori aktif:', err);
  }
  if (!silent) toast(`Berhasil memuat ${saved} soal ke dalam paket "${setName}".`, 'success');
  return saved;
}

async function ensureKunciUjian1Loaded(force = false) {
  try {
    const existingQs = state.questions.filter(q => q.setId === 'ssw-pm-kunci-ujian-1');
    if (!force && existingQs.length >= 40 && hasCompleteTranslations(existingQs)) return false;
    const data = (await fetchBuiltinJson('ssw-pm-kunci-ujian-1.json')) || SEED_KUNCI_UJIAN_1;
    await importAdditiveQuestionSet(data, {
      silent: !force,
      force,
      defaultSetId: 'ssw-pm-kunci-ujian-1',
      defaultSetName: 'Soal Ujian 1 — CBTP Gino1'
    });
    return true;
  } catch (err) {
    console.warn('Auto-seed Kunci Soal Ujian 1 dilewati:', err);
    return false;
  }
}

async function ensureSswPmTipe2Loaded(force = false) {
  try {
    const existingQs = state.questions.filter(q => q.setId === 'ssw-pm-tipe2-nguyen1');
    if (!force && existingQs.length >= 40 && hasCompleteTranslations(existingQs)) return false;
    const data = (await fetchBuiltinJson('ssw-pm-tipe2-nguyen1.json')) || SEED_SSW_TIPE_2;
    await importAdditiveQuestionSet(data, {
      silent: !force,
      force,
      defaultSetId: 'ssw-pm-tipe2-nguyen1',
      defaultSetName: 'Latsol Tipe 2 SSW PM — Đề 7 Thực Phẩm GINO1'
    });
    return true;
  } catch (err) {
    console.warn('Auto-seed Latsol Tipe 2 SSW PM dilewati:', err);
    return false;
  }
}

async function ensureKunciUjian2Loaded(force = false) {
  try {
    const existingQs = state.questions.filter(q => q.setId === 'ssw-pm-kunci-ujian-2');
    if (!force && existingQs.length >= 40 && hasCompleteTranslations(existingQs)) return false;
    const data = await fetchBuiltinJson('ssw-pm-kunci-ujian-2.json');
    if (!data) return false;
    await importAdditiveQuestionSet(data, {
      silent: !force,
      force,
      defaultSetId: 'ssw-pm-kunci-ujian-2',
      defaultSetName: 'Soal Ujian 2 — CBTP Gino1'
    });
    return true;
  } catch (err) {
    console.warn('Auto-seed Kunci Soal Ujian 2 dilewati:', err);
    return false;
  }
}

async function ensureKunciUjian3To13Loaded(force = false) {
  try {
    const targetSets = new Set([
      'ssw-pm-kunci-ujian-3', 'ssw-pm-kunci-ujian-4', 'ssw-pm-kunci-ujian-5',
      'ssw-pm-kunci-ujian-6', 'ssw-pm-kunci-ujian-7', 'ssw-pm-kunci-ujian-8',
      'ssw-pm-kunci-ujian-9', 'ssw-pm-kunci-ujian-10', 'ssw-pm-kunci-ujian-11',
      'ssw-pm-kunci-ujian-12', 'ssw-pm-kunci-ujian-13'
    ]);
    const existingQs = state.questions.filter(q => targetSets.has(q.setId));
    if (!force && existingQs.length >= 440 && hasCompleteTranslations(existingQs)) return false;
    const data = await fetchBuiltinJson('ssw-pm-all-kunci-ujian-3-to-13.json');
    if (!data) return false;
    await importAdditiveQuestionSet(data, {
      silent: !force,
      force,
      defaultSetId: 'ssw-pm-kunci-ujian-3',
      defaultSetName: 'Bundle Soal Ujian 3 s/d 13 (440 Soal)'
    });
    return true;
  } catch (err) {
    console.warn('Auto-seed Kunci Soal Ujian 3-13 dilewati:', err);
    return false;
  }
}

async function ensureBonusSoal1To10Loaded(force = false) {
  try {
    const targetSets = new Set([
      'bonus-soal-1', 'bonus-soal-2', 'bonus-soal-4',
      'bonus-soal-5', 'bonus-soal-6', 'bonus-soal-7',
      'bonus-soal-8', 'bonus-soal-9', 'bonus-soal-10'
    ]);
    const existingQs = state.questions.filter(q => targetSets.has(q.setId));
    if (!force && existingQs.length >= 354 && hasCompleteTranslations(existingQs)) return false;
    const data = await fetchBuiltinJson('ssw-pm-bonus-soal-1-to-10-bundle.json');
    if (!data) return false;
    await importAdditiveQuestionSet(data, {
      silent: !force,
      force,
      defaultSetId: 'bonus-soal-1',
      defaultSetName: 'Bundle Bonus Soal 1 - 10 (9 Paket)'
    });
    return true;
  } catch (err) {
    console.warn('Auto-seed Bonus Soal 1-10 dilewati:', err);
    return false;
  }
}

async function ensureSpecialLabTopicsLoaded(force = false) {
  try {
    const targetSets = new Set([
      'ssw-pm-lab-bakteri',
      'ssw-pm-lab-suhu',
      'ssw-pm-lab-haccp',
      'ssw-pm-lab-alergen'
    ]);
    const existingQs = state.questions.filter(q => targetSets.has(q.setId));
    const needsNameFix = existingQs.some(q => q.setName && q.setName.startsWith('Lab Soal'));
    const needsRubyFix = existingQs.some(q => !q.prompt || !q.prompt.includes('<ruby>'));
    if (!force && !needsNameFix && !needsRubyFix && existingQs.length >= 92 && hasCompleteTranslations(existingQs)) return false;
    const data = await fetchBuiltinJson('ssw-pm-special-lab-bundle.json');
    if (!data) return false;
    await importAdditiveQuestionSet(data, {
      silent: !force && !needsNameFix && !needsRubyFix,
      force: force || needsNameFix || needsRubyFix,
      defaultSetId: 'ssw-pm-lab-bakteri',
      defaultSetName: '細菌・微生物・食中毒 (Bacteria Lab)'
    });
    return true;
  } catch (err) {
    console.warn('Auto-seed Special Lab Topics dilewati:', err);
    return false;
  }
}

async function ensureAllBuiltinSetsLoaded(force = false) {
  await ensureKunciUjian1Loaded(force);
  await ensureSswPmTipe2Loaded(force);
  const results = await Promise.allSettled([
    ensureKunciUjian2Loaded(force),
    ensureKunciUjian3To13Loaded(force),
    ensureBonusSoal1To10Loaded(force),
    ensureSpecialLabTopicsLoaded(force)
  ]);
  const anyLoaded = results.some(r => r.status === 'fulfilled' && r.value === true);
  if (anyLoaded || force) {
    if (state.page !== 'exam') render();
    if (force) toast('Seluruh paket soal bawaan berhasil dimuat ulang.', 'success');
  }
}

async function importBackupFile(file) {
  const label = $('#import-status');
  if (!file) return;
  if (file.size > 300 * 1024 * 1024) {
    if (label) label.textContent = 'File terlalu besar (maks. 300 MB).';
    toast('Impor dibatalkan: ukuran file lebih dari 300 MB.', 'error');
    return;
  }
  if (label) label.textContent = `Membaca ${file.name}…`;
  try {
    let data;
    if (file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip') data = await readZip(file);
    else data = JSON.parse(await file.text());

    if (Array.isArray(data) || (data && !['ssw-pm-backup', 'jft-practice-backup'].includes(data.format) && Array.isArray(data.questions))) {
      const count = await importAdditiveQuestionSet(data, { silent: true });
      if (label) label.textContent = `Berhasil: ${count} soal paket JSON ditambahkan tanpa menghapus data lama.`;
      toast(`Berhasil mengimpor ${count} soal dari ${file.name}.`, 'success');
      render();
      return;
    }
    const errors = validateBackup(data);
    if (errors.length) throw new Error(errors.slice(0, 5).join(' '));
    const qs = data.questions.length, ss = data.sessions.length;
    const yes = await confirmModal(
      'Pulihkan database dari backup?',
      `File backup ini berisi ${qs} soal dan ${ss} riwayat sesi ujian. Data lokal saat ini akan diganti.`,
      'Pulihkan Data'
    );
    if (!yes) { if (label) label.textContent = 'Impor dibatalkan.'; return; }
    const hydrated = hydrateBackup(data);
    await replaceAll(hydrated);
    await reloadData();
    await ensureAllBuiltinSetsLoaded(false);
    state.activeSession = null;
    state.page = 'home';
    await go('home');
    if (label) label.textContent = `Berhasil: ${qs} soal dan ${ss} riwayat dipulihkan.`;
    toast('Database berhasil dipulihkan.', 'success');
  } catch (e) {
    if (label) label.textContent = `Impor gagal: ${e.message}`;
    toast(`Impor gagal: ${e.message}`, 'error');
  }
}

async function exportOneResult(id) {
  const s = state.sessions.find(x => x.id === id);
  if (!s) return;
  try {
    const data = {
      format: 'ssw-pm-mock-test-result',
      version: 2,
      exportedAt: new Date().toISOString(),
      session: await serializeSession(s)
    };
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      `ssw-pm-result-${new Date(s.endedAt || Date.now()).toISOString().slice(0, 10)}.json`
    );
  } catch (e) {
    toast(`Ekspor hasil gagal: ${e.message}`, 'error');
  }
}

async function serializeSession(s) {
  const copy = structuredClone(s);
  for (const q of copy.questions || []) {
    for (const m of q.media || []) {
      if (m.blob instanceof Blob) {
        m.dataUrl = await blobToDataURL(m.blob);
        delete m.blob;
      }
    }
  }
  return copy;
}

async function saveSettings(form) {
  const duration = Math.min(300, Math.max(1, Number(form.elements.standardDuration.value) || 70));
  const count = Math.min(500, Math.max(1, Number(form.elements.standardCount.value) || 40));
  state.settings = {
    ...state.settings,
    standardDuration: duration,
    standardCount: count,
    resumeInterrupted: form.elements.resumeInterrupted.checked
  };
  if (form.elements.defaultShowFurigana) {
    state.examPrefs.showFurigana = form.elements.defaultShowFurigana.checked;
    saveExamPrefs(state.examPrefs);
    applyExamPrefs();
  }
  await put('meta', { key: 'settings', ...state.settings });
  state.setup.duration = duration;
  state.setup.count = count;
  toast('Pengaturan aplikasi berhasil disimpan.', 'success');
  renderBackup();
}

async function clearAllData() {
  const yes = await confirmModal(
    'Reset dan muat ulang paket default?',
    'Seluruh perubahan kustom dan riwayat sesi akan direset, kemudian paket soal default SSW PM (Soal Ujian 1 & Tipe 2) akan dimuat ulang secara bersih.',
    'Reset Data'
  );
  if (!yes) return;
  await replaceAll({ questions: [], themes: [], passages: [], sessions: [], meta: [], audioGroups: [] });
  await initialise();
  await reloadData();
  await ensureKunciUjian1Loaded(true);
  await ensureSswPmTipe2Loaded(true);
  state.activeSession = null;
  state.page = 'home';
  await go('home');
  toast('Database berhasil direset dan paket soal SSW PM telah dimuat ulang.', 'success');
}

function setLanguage(lang) {
  if (!I18N[lang]) return;
  state.lang = lang;
  saveLang(lang);
  updateShellLanguage();
  render();
}

async function handleAction(action, el) {
  const id = el.dataset.id;
  const index = Number(el.dataset.index);
  switch (action) {
    case 'close-modal':
      if (el.classList.contains('modal-backdrop')) return;
      closeModal();
      break;
    case 'confirm-cancel': {
      const fn = state.confirmResolve;
      state.confirmResolve = null;
      modalRoot.innerHTML = '';
      fn?.(false);
      break;
    }
    case 'confirm-ok': {
      const fn = state.confirmResolve;
      state.confirmResolve = null;
      modalRoot.innerHTML = '';
      fn?.(true);
      break;
    }
    case 'import-csv': $('#csv-import-file')?.click(); break;
    case 'import-json-set': $('#json-set-import-file')?.click(); break;
    case 'reload-all-builtin': await ensureAllBuiltinSetsLoaded(true); render(); break;
    case 'reload-kunci1': await ensureKunciUjian1Loaded(true); render(); break;
    case 'reload-ssw-tipe2': await ensureSswPmTipe2Loaded(true); render(); break;
    case 'set-home-pkg-filter': state.homePkgFilter = id || 'all'; renderHome(); break;
    case 'quick-start-kunci1': {
      await ensureKunciUjian1Loaded(false);
      state.setup.mode = 'full';
      state.setup.setId = 'ssw-pm-kunci-ujian-1';
      state.setup.count = 40;
      state.setup.duration = state.settings.standardDuration || 70;
      state.setup.practice = false;
      state.setup.random = false;
      await go('setup');
      break;
    }
    case 'quick-practice-kunci1': {
      await ensureKunciUjian1Loaded(false);
      state.setup.mode = 'practice';
      state.setup.setId = 'ssw-pm-kunci-ujian-1';
      state.setup.count = 40;
      state.setup.practice = true;
      state.setup.random = false;
      await go('setup');
      break;
    }
    case 'quick-custom': {
      state.setup.mode = 'custom';
      state.setup.setId = 'ssw-pm-kunci-ujian-1';
      state.setup.practice = false;
      await go('setup');
      break;
    }
    case 'quick-package': {
      const pkgId = id || 'ssw-pm-kunci-ujian-1';
      const pkg = getAvailablePackages().find(p => p.id === pkgId);
      state.setup.mode = 'full';
      state.setup.setId = pkgId;
      state.setup.count = pkg?.active || 40;
      state.setup.duration = state.settings.standardDuration || 70;
      state.setup.practice = false;
      await go('setup');
      break;
    }
    case 'filter-package': {
      state.bankFilter.setId = id || 'all';
      state.bankListExpanded = true;
      state.bankPage = 1;
      await go('bank');
      break;
    }
    case 'toggle-bank-list': {
      state.bankListExpanded = !state.bankListExpanded;
      if (state.bankListExpanded) {
        state.bankPage = 1;
      }
      renderBank();
      break;
    }
    case 'bank-prev-page': {
      if (state.bankPage > 1) {
        state.bankPage--;
        renderBank();
        const heading = document.getElementById('zen-questions-heading');
        if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      break;
    }
    case 'bank-next-page': {
      state.bankPage++;
      renderBank();
      const heading = document.getElementById('zen-questions-heading');
      if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
    case 'bank-go-page': {
      const pageNum = Number(el?.dataset?.pageNum || el?.dataset?.id || id);
      if (pageNum && pageNum !== state.bankPage) {
        state.bankPage = pageNum;
        renderBank();
        const heading = document.getElementById('zen-questions-heading');
        if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      break;
    }
    case 'download-csv-template': downloadCSVTemplate(); break;
    case 'close-csv-import': state.csvImport = null; closeModal(); break;
    case 'apply-csv-import': await applyCSVImport(); break;
    case 'new-question': newQuestion({ setId: state.bankFilter.setId !== 'all' ? state.bankFilter.setId : 'ssw-pm-kunci-ujian-1' }); break;
    case 'toggle-bank-study':
    case 'add-bank-study': {
      if (!id || el.dataset.pending === '1') break;
      el.dataset.pending = '1';
      try {
        const q = (state.questions || []).find(x => x.id === id);
        if (!q) break;
        const inStudy = await toggleStudyItem(q);
        const allMatchingBtns = document.querySelectorAll(`.zen-study-btn[data-id="${id}"]`);
        const btnsToUpdate = allMatchingBtns.length ? allMatchingBtns : [el];
        btnsToUpdate.forEach(btn => {
          btn.classList.toggle('is-active', inStudy);
          btn.setAttribute('aria-pressed', String(inStudy));
          btn.setAttribute('title', inStudy ? t('studyRemoveTooltip') : t('studyAddTooltip'));
          btn.setAttribute('aria-label', inStudy ? t('studyRemoveTooltip') : t('studyAddTooltip'));
        });
      } finally {
        delete el.dataset.pending;
      }
      break;
    }
    case 'edit-question': editQuestion(id); break;
    case 'save-question': await saveQuestion(); break;
    case 'clear-custom-selection': state.setupCustomIds.clear(); renderSetup(); break;
    case 'delete-question': await deleteQuestion(id); break;
    case 'bulk-add-study': {
      if (!state.bankSelectedIds || state.bankSelectedIds.size === 0 || el.dataset.pending === '1') break;
      el.dataset.pending = '1';
      try {
        let addedCount = 0;
        let skippedCount = 0;
        const toPut = [];
        if (!Array.isArray(state.studyList)) state.studyList = [];

        for (const qId of state.bankSelectedIds) {
          const q = (state.questions || []).find(x => x.id === qId);
          if (!q) continue;
          if (isQuestionInStudy(q)) {
            skippedCount++;
          } else {
            const item = makeStudyItem(q);
            state.studyList.unshift(item);
            toPut.push(item);
            addedCount++;
          }
        }

        if (toPut.length > 0) {
          for (const item of toPut) {
            try {
              await put('studyList', item);
            } catch (err) {
              console.warn('Gagal menyimpan ke IndexedDB studyList:', err);
            }
          }
          updateStudyBadge();
        }

        for (const qId of state.bankSelectedIds) {
          const matchingBtns = document.querySelectorAll(`.zen-study-btn[data-id="${qId}"]`);
          matchingBtns.forEach(cardBtn => {
            cardBtn.classList.add('is-active');
            cardBtn.setAttribute('aria-pressed', 'true');
            cardBtn.setAttribute('title', t('studyRemoveTooltip'));
            cardBtn.setAttribute('aria-label', t('studyRemoveTooltip'));
          });
        }

        const msg = state.lang === 'ja'
          ? `${addedCount}問を追加 · ${skippedCount}問は登録済み`
          : state.lang === 'en'
            ? `${addedCount} question${addedCount === 1 ? '' : 's'} added · ${skippedCount} already in list`
            : `${addedCount} soal ditambahkan · ${skippedCount} sudah ada`;
        toast(msg, addedCount > 0 ? 'success' : 'info');
      } finally {
        delete el.dataset.pending;
      }
      break;
    }
    case 'delete-selected-questions': await deleteSelectedQuestions(); break;
    case 'clear-question-selection': state.bankSelectedIds.clear(); renderBank(); break;
    case 'toggle-question-preview':
      if ($('#question-editor') && state.editor) {
        syncQuestionDraft();
        state.editor.previewVisible = !state.editor.previewVisible;
        renderQuestionEditor();
      }
      break;
    case 'duplicate-question': {
      const q = state.questions.find(x => x.id === id);
      if (q) {
        const copy = structuredClone(q);
        copy.id = uid('ssw-q');
        copy.prompt = `${copy.prompt}`;
        copy.createdAt = Date.now();
        copy.updatedAt = Date.now();
        await put('questions', copy);
        await reloadData();
        renderBank();
        toast('Soal berhasil diduplikasi.', 'success');
      }
      break;
    }
    case 'add-option': {
      syncQuestionDraft();
      if (state.editor.q.options.length < 6) {
        const nextLetter = String.fromCharCode(65 + state.editor.q.options.length);
        state.editor.q.options.push({ id: nextLetter, text: '', mediaId: '' });
        renderQuestionEditor();
      }
      break;
    }
    case 'remove-option': {
      syncQuestionDraft();
      if (state.editor.q.options.length > 2) {
        state.editor.q.options.splice(index, 1);
        if (state.editor.q.correctIndex === index) state.editor.q.correctIndex = 0;
        else if (state.editor.q.correctIndex > index) state.editor.q.correctIndex--;
        renderQuestionEditor();
      }
      break;
    }
    case 'remove-option-image':
      syncQuestionDraft();
      if (state.editor.q.options[index]) {
        state.editor.q.options[index].mediaId = '';
        delete state.editor.q.options[index].optionImage;
      }
      renderQuestionEditor();
      break;
    case 'remove-media':
      syncQuestionDraft();
      if (el.dataset.kind === 'image') {
        state.editor.q.imageMediaId = '';
        state.editor.q.questionImage = '';
      }
      renderQuestionEditor();
      break;
    case 'export-json': await exportBackupJSON(); break;
    case 'export-zip': await exportBackupZIP(); break;
    case 'clear-all-data': await clearAllData(); break;
    case 'resume-session': {
      const s = state.sessions.find(x => x.id === id && x.status === 'in_progress');
      if (s) {
        if (s.deadline && Date.now() >= s.deadline) {
          state.activeSession = s;
          await finishExam(true);
        } else {
          state.activeSession = s;
          if (s.mode === 'practice' && !s.selectiveState) {
            initSelectiveState(s);
          }
          state.page = 'exam';
          await go('exam');
          startExamTicker();
        }
      }
      break;
    }
    case 'answer': await setExamAnswer(index); break;
    case 'jump-question': await moveExamTo(index); break;
    case 'exam-prev': {
      const s = activeExam();
      if (s && s.currentIndex > 0) await moveExamTo(s.currentIndex - 1);
      break;
    }
    case 'exam-next': {
      const s = activeExam();
      if (s && s.currentIndex < s.questions.length - 1) await moveExamTo(s.currentIndex + 1);
      break;
    }
    case 'exam-settings': {
      state.examSettingsOpen = !state.examSettingsOpen;
      if (!state.examSettingsOpen) {
        state.shortcutCaptureAction = null;
        state.shortcutConflictMessage = '';
      }
      const pop = $('#exam-settings-popover');
      if (pop) {
        pop.hidden = !state.examSettingsOpen;
        pop.classList.toggle('is-open', state.examSettingsOpen);
      }
      $$('[data-action="exam-settings"]').forEach(b => b.classList.toggle('is-active', state.examSettingsOpen));
      refreshExamShortcutsUI();
      updateFullscreenUI();
      break;
    }
    case 'close-exam-settings': {
      state.examSettingsOpen = false;
      state.shortcutCaptureAction = null;
      state.shortcutConflictMessage = '';
      const pop = $('#exam-settings-popover');
      if (pop) {
        pop.hidden = true;
        pop.classList.remove('is-open');
      }
      $$('[data-action="exam-settings"]').forEach(b => b.classList.remove('is-active'));
      refreshExamShortcutsUI();
      break;
    }
    case 'capture-exam-shortcut': {
      const actionId = el.dataset.shortcutAction;
      if (!actionId || !Object.prototype.hasOwnProperty.call(DEFAULT_EXAM_SHORTCUTS, actionId)) break;
      if (state.shortcutCaptureAction === actionId) {
        state.shortcutCaptureAction = null;
        state.shortcutConflictMessage = '';
      } else {
        state.shortcutCaptureAction = actionId;
        state.shortcutConflictMessage = '';
      }
      refreshExamShortcutsUI();
      break;
    }
    case 'reset-exam-shortcuts': {
      resetExamShortcuts();
      refreshExamShortcutsUI();
      toast('Shortcut keyboard dikembalikan ke default.', 'info');
      break;
    }
            case 'toggle-review-study': {
      if (!id) break;
      const s = getResultSession();
      const q = (s?.questions || []).find(x => x.id === id) || (state.questions || []).find(x => x.id === id);
      if (!q) break;
      const inStudy = await toggleStudyItem(q);
      el.classList.toggle('is-active', inStudy);
      el.setAttribute('aria-pressed', String(inStudy));
      el.setAttribute('title', inStudy ? t('studyRemoveTooltip') : t('studyAddTooltip'));
      el.setAttribute('aria-label', inStudy ? t('studyRemoveTooltip') : t('studyAddTooltip'));
      const glyph = el.querySelector('.zen-icon-glyph');
      if (glyph) glyph.textContent = inStudy ? '✓' : '+';
      else el.textContent = inStudy ? '✓' : '+';
      break;
    }
    case 'toggle-study-list': {
      const s = state.activeSession;
      if (!s || !Array.isArray(s.questions)) break;
      const q = s.questions[s.currentIndex];
      if (!q) break;
      const inStudy = await toggleStudyItem(q);
      el.classList.toggle('is-active', inStudy);
      el.setAttribute('aria-pressed', String(inStudy));
      el.setAttribute('title', inStudy ? t('studyRemoveTooltip') : t('studyAddTooltip'));
      el.setAttribute('aria-label', inStudy ? t('studyRemoveTooltip') : t('studyAddTooltip'));
      el.textContent = inStudy ? '✓' : '+';
      const mapBtn = document.querySelector(`.question-map-item[data-index="${s.currentIndex}"]`);
      if (mapBtn) {
        mapBtn.classList.toggle('in-study', inStudy);
      }
      break;
    }
    case 'toggle-practice-translation': {
      const s = activeExam();
      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
      if (!isUntimedPractice) break;
      state.practiceTranslationOpen = !state.practiceTranslationOpen;
      resetSelectiveTranslationOverrides(s);
      renderExam({ preserveScroll: true });
      break;
    }
    case 'toggle-practice-reveal-answer': {
      const s = activeExam();
      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
      if (!isUntimedPractice) break;
      state.practiceRevealAnswer = !state.practiceRevealAnswer;
      renderExam({ preserveScroll: true });
      break;
    }
    case 'toggle-selective-trans': {
      const s = activeExam();
      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
      if (!isUntimedPractice) break;
      const q = currentExamQuestion(s);
      if (!q) break;
      const targetType = el.dataset.targetType;
      const optKey = targetType === 'option' ? (el.dataset.optKey || null) : null;
      const row = (el && typeof el.closest === 'function') ? el.closest('.practice-option-row') : null;
      const index = (row && typeof row.querySelector === 'function') ? Number(row.querySelector('.answer-choice')?.dataset?.index) : null;
      toggleSelectiveTrans(s, q.id, optKey);
      renderExam({ scrollTarget: { targetType, optKey, index } });
      break;
    }
    case 'toggle-selective-kotoba': {
      const s = activeExam();
      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
      if (!isUntimedPractice) break;
      const q = currentExamQuestion(s);
      if (!q) break;
      const targetType = el.dataset.targetType;
      const optKey = targetType === 'option' ? (el.dataset.optKey || null) : null;
      if (targetType === 'option' && !optKey) break;
      if (targetType !== 'option' && targetType !== 'prompt') break;

      const row = (el && typeof el.closest === 'function') ? el.closest('.practice-option-row') : null;
      const index = (row && typeof row.querySelector === 'function') ? Number(row.querySelector('.answer-choice')?.dataset?.index) : null;

      toggleSelectiveKotoba(s, q.id, optKey);

      if (typeof ensureKotobaDataLoaded === 'function') {
        try {
          await ensureKotobaDataLoaded();
        } catch (e) {
          // Gracefully continue even if data loading fails
        }
      }
      renderExam({ scrollTarget: { targetType, optKey, index } });
      break;
    }
    case 'remove-study-item': {
      if (!id) break;
      await removeStudyItem(id);
      if (state.page === 'study') renderStudy();
      break;
    }
    case 'open-study-detail': {
      if (!id) break;
      const item = (state.studyList || []).find(x => x.id === id);
      if (item) openStudyDetail(item);
      break;
    }
    case 'toggle-study-card-furigana': {
      if (!id) break;
      const current = state.studyCardFurigana?.has(id) ? Boolean(state.studyCardFurigana.get(id)) : Boolean(state.examPrefs.showFurigana);
      const next = !current;
      if (!state.studyCardFurigana) state.studyCardFurigana = new Map();
      state.studyCardFurigana.set(id, next);
      const card = el.closest('.zen-study-card');
      if (card) {
        card.classList.toggle('furigana-on', next);
        card.classList.toggle('furigana-off', !next);
      }
      el.classList.toggle('is-active', next);
      el.setAttribute('aria-pressed', String(next));
      break;
    }
    case 'toggle-study-card-translation': {
      if (!id) break;
      if (!state.studyCardTrans) state.studyCardTrans = new Set();
      const isOpen = state.studyCardTrans.has(id);
      if (isOpen) state.studyCardTrans.delete(id);
      else state.studyCardTrans.add(id);
      const card = el.closest('.zen-study-card');
      if (card) {
        const panel = card.querySelector('.zen-study-translation-panel');
        if (panel) panel.classList.toggle('is-hidden', isOpen);
      }
      el.classList.toggle('is-active', !isOpen);
      el.setAttribute('aria-expanded', String(!isOpen));
      break;
    }
    case 'toggle-furigana-quick': {
      state.examPrefs.showFurigana = !state.examPrefs.showFurigana;
      saveExamPrefs(state.examPrefs);
      applyExamPrefs();
      state.cardFurigana.clear();
      if (state.page === 'result' || state.page === 'review') renderResult();
      break;
    }
    case 'toggle-card-furigana': {
      if (!id) break;
      const current = state.cardFurigana.has(id) ? Boolean(state.cardFurigana.get(id)) : Boolean(state.examPrefs.showFurigana);
      const next = !current;
      state.cardFurigana.set(id, next);
      const card = el.closest('.zen-review-item');
      if (card) {
        card.classList.toggle('furigana-on', next);
        card.classList.toggle('furigana-off', !next);
      }
      el.classList.toggle('is-active', next);
      el.setAttribute('aria-pressed', String(next));
      el.setAttribute('title', next ? 'Sembunyikan Furigana' : 'Tampilkan Furigana');
      break;
    }
    case 'toggle-all-translations': {
      state.showAllTranslations = !state.showAllTranslations;
      if (!state.showAllTranslations) {
        state.openTranslationIds.clear();
      }
      if (state.page === 'result' || state.page === 'review') renderResult();
      break;
    }
    case 'toggle-card-translation': {
      if (!id) break;
      const s = getResultSession();
      if (state.showAllTranslations) {
        state.showAllTranslations = false;
        state.openTranslationIds = new Set((s?.questions || []).map(q => q.id).filter(qid => qid !== id));
      } else if (state.openTranslationIds.has(id)) {
        state.openTranslationIds.delete(id);
      } else {
        state.openTranslationIds.add(id);
      }
      if (state.page === 'result' || state.page === 'review') renderResult();
      break;
    }
    case 'reset-exam-prefs': {
      state.examPrefs = { ...DEFAULT_EXAM_PREFS };
      saveExamPrefs(state.examPrefs);
      applyExamPrefs();
      const qSlider = $('#exam-pref-q-font');
      if (qSlider) qSlider.value = String(state.examPrefs.questionFontSize);
      const aSlider = $('#exam-pref-a-font');
      if (aSlider) aSlider.value = String(state.examPrefs.answerFontSize);
      toast('Pengaturan ukuran font dan furigana dikembalikan ke default.', 'info');
      break;
    }
    case 'toggle-fullscreen': await toggleFullScreen(); break;
    case 'toggle-question-map': {
      state.mapHidden = !state.mapHidden;
      saveMapHidden(state.mapHidden);
      const shell = $('.exam-shell', view);
      if (shell) shell.classList.toggle('map-hidden', state.mapHidden);
      $$('[data-action="toggle-question-map"]').forEach(btn => {
        btn.classList.toggle('is-active', !state.mapHidden);
        btn.setAttribute('aria-pressed', String(!state.mapHidden));
      });
      break;
    }
    case 'toggle-flag': {
      const ss = activeExam(), cq = currentExamQuestion();
      if (ss && cq) {
        ss.flaggedQuestions = Array.isArray(ss.flaggedQuestions) ? ss.flaggedQuestions : [];
        const ix = ss.flaggedQuestions.indexOf(cq.id);
        if (ix >= 0) ss.flaggedQuestions.splice(ix, 1);
        else ss.flaggedQuestions.push(cq.id);
        await persistExam();
        renderExam({ preserveScroll: true });
      }
      break;
    }
    case 'exam-finish': await finishExam(false); break;
    case 'retry-incorrect-questions': {
      const sessId = el?.getAttribute('data-session-id') || id || state.resultId;
      const parentSession = sessId ? (state.sessions || []).find(x => x.id === sessId) : getResultSession();
      if (!parentSession) {
        toast('Sesi ujian tidak ditemukan.', 'error');
        break;
      }
      await launchRetryIncorrectQuestions(parentSession);
      break;
    }
    case 'return-to-parent-results': {
      const parentId = el?.getAttribute('data-parent-id') || el?.closest('[data-parent-id]')?.getAttribute('data-parent-id');
      if (!parentId) break;

      if (state.page === 'exam') {
        await persistExam();
        if (state.activeSession && state.activeSession.selectiveState) {
          delete state.activeSession.selectiveState;
        }
        cleanupFullscreen();
        document.body.classList.remove('exam-mode', 'is-fill-screen');
        document.documentElement.classList.remove('in-exam');
        if (examTicker) { clearInterval(examTicker); examTicker = null; }
      }

      state.resultId = parentId;
      state.page = 'result';
      state.reviewFilter = 'all';
      await reloadData();
      render();
      break;
    }
    case 'open-result': state.resultId = id; state.reviewFilter = 'all'; state.page = 'result'; render(); break;
    case 'open-review': state.resultId = id; state.reviewFilter = 'all'; state.page = 'review'; render(); break;
    case 'print-result': window.print(); break;
    case 'export-result': await exportOneResult(id); break;
    case 'delete-history': {
      const yes = await confirmModal('Hapus riwayat ujian ini?', 'Rekaman hasil ini akan dihapus dari perangkat. Bank soal tidak terpengaruh.', 'Hapus Riwayat');
      if (yes) {
        await del('sessions', id);
        await reloadData();
        renderHistory();
        toast('Riwayat ujian dihapus.', 'success');
      }
      break;
    }
  }
}

function isInputOrEditable(element) {
  if (!element || typeof element !== 'object') return false;
  try {
    if (element.matches?.('input, textarea, select, [contenteditable="true"]') || element.closest?.('[contenteditable="true"]')) {
      return true;
    }
  } catch {}
  return false;
}

// Single consolidated keyboard listener for Escape, answer choice Enter/Space, shortcut capture, reserved F fullscreen, and custom exam shortcuts
document.addEventListener('keydown', async e => {
  if (e.key === 'Escape') {
    if (state.shortcutCaptureAction) {
      e.preventDefault();
      e.stopPropagation();
      const canceledAction = state.shortcutCaptureAction;
      state.shortcutCaptureAction = null;
      state.shortcutConflictMessage = '';
      refreshExamShortcutsUI();
      $(`#exam-shortcuts-section [data-shortcut-action="${canceledAction}"]`)?.focus();
      return;
    }
    if (state.examSettingsOpen) {
      state.examSettingsOpen = false;
      const pop = $('#exam-settings-popover');
      if (pop) {
        pop.hidden = true;
        pop.classList.remove('is-open');
      }
      $$('[data-action="exam-settings"]').forEach(b => b.classList.remove('is-active'));
      $('[data-action="exam-settings"]')?.focus();
      return;
    }
    const wrap = $('#zen-lang-dropdown');
    const menu = $('#zen-lang-menu');
    if (wrap && menu && wrap.classList.contains('is-open')) {
      wrap.classList.remove('is-open');
      menu.hidden = true;
      $('#zen-lang-trigger')?.setAttribute('aria-expanded', 'false');
      $('#zen-lang-trigger')?.focus();
      return;
    }
  }

  if (state.page !== 'exam') return;
  const target = e.target;

  if (state.shortcutCaptureAction) {
    e.preventDefault();
    e.stopPropagation();
    if (e.isComposing || e.repeat || MODIFIER_ONLY_KEYS.has(e.key)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) {
      state.shortcutConflictMessage = 'Gunakan tombol tunggal tanpa Ctrl, Alt, atau Meta.';
      refreshExamShortcutsUI();
      return;
    }
    const result = assignExamShortcut(state.shortcutCaptureAction, e.key);
    if (result.ok) {
      const updatedAction = state.shortcutCaptureAction;
      state.shortcutCaptureAction = null;
      state.shortcutConflictMessage = '';
      refreshExamShortcutsUI();
      $(`#exam-shortcuts-section [data-shortcut-action="${updatedAction}"]`)?.focus();
    } else {
      state.shortcutConflictMessage = result.message;
      refreshExamShortcutsUI();
    }
    return;
  }

  const answerChoice = target?.closest?.('.answer-choice[data-action="answer"]');
  if (answerChoice && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    await setExamAnswer(Number(answerChoice.dataset.index));
    return;
  }

  const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
  if (isInputOrEditable(target) || isInputOrEditable(activeEl)) {
    return;
  }

  if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;

  const normalizedKey = normalizeShortcutKey(e.key);
  if (!normalizedKey) return;

  const bindings = state.examShortcuts || DEFAULT_EXAM_SHORTCUTS;
  const matchedAction = Object.keys(bindings).find(actionId => bindings[actionId] === normalizedKey);

  if (e.repeat && matchedAction !== 'scrollQuestionUp' && matchedAction !== 'scrollQuestionDown') {
    return;
  }

  if (e.key === 'f' || e.key === 'F') {
    if (e.repeat) return;
    e.preventDefault();
    toggleFullScreen();
    return;
  }

  if (!matchedAction) return;

  const s = activeExam();
  if (!s) return;

  e.preventDefault();

  switch (matchedAction) {
    case 'scrollQuestionDown': {
      const workspace = document.querySelector('.exam-workspace');
      if (workspace) {
        workspace.scrollTop += 80;
      }
      break;
    }
    case 'scrollQuestionUp': {
      const workspace = document.querySelector('.exam-workspace');
      if (workspace) {
        workspace.scrollTop = Math.max(0, workspace.scrollTop - 80);
      }
      break;
    }
    case 'nextQuestion':
      if (s.currentIndex < s.questions.length - 1) await moveExamTo(s.currentIndex + 1);
      break;
    case 'prevQuestion':
      if (s.currentIndex > 0) await moveExamTo(s.currentIndex - 1);
      break;
    case 'selectOption1':
    case 'selectOption2':
    case 'selectOption3':
    case 'selectOption4': {
      const optionIdx = Number(matchedAction.slice(-1)) - 1;
      const q = currentExamQuestion(s);
      if (q && Array.isArray(q.options) && optionIdx >= 0 && optionIdx < q.options.length) {
        await setExamAnswer(optionIdx);
      }
      break;
    }
    case 'toggleFurigana':
      state.examPrefs.showFurigana = !state.examPrefs.showFurigana;
      saveExamPrefs(state.examPrefs);
      applyExamPrefs();
      break;
    case 'toggleMap': {
      state.mapHidden = !state.mapHidden;
      saveMapHidden(state.mapHidden);
      const shell = $('.exam-shell', view);
      if (shell) shell.classList.toggle('map-hidden', state.mapHidden);
      $$('[data-action="toggle-question-map"]').forEach(btn => {
        btn.classList.toggle('is-active', !state.mapHidden);
        btn.setAttribute('aria-pressed', String(!state.mapHidden));
      });
      break;
    }
    case 'toggleFlag': {
      const cq = currentExamQuestion(s);
      if (cq) {
        s.flaggedQuestions = Array.isArray(s.flaggedQuestions) ? s.flaggedQuestions : [];
        const ix = s.flaggedQuestions.indexOf(cq.id);
        if (ix >= 0) s.flaggedQuestions.splice(ix, 1);
        else s.flaggedQuestions.push(cq.id);
        await persistExam();
        renderExam({ preserveScroll: true });
      }
      break;
    }
    case 'openSettings': {
      state.examSettingsOpen = !state.examSettingsOpen;
      if (!state.examSettingsOpen) {
        state.shortcutCaptureAction = null;
        state.shortcutConflictMessage = '';
      }
      const pop = $('#exam-settings-popover');
      if (pop) {
        pop.hidden = !state.examSettingsOpen;
        pop.classList.toggle('is-open', state.examSettingsOpen);
      }
      $$('[data-action="exam-settings"]').forEach(b => b.classList.toggle('is-active', state.examSettingsOpen));
      refreshExamShortcutsUI();
      updateFullscreenUI();
      break;
    }
    case 'togglePracticeTranslation': {
      const isUntimedPractice = Boolean(s.mode === 'practice' && !s.deadline && !s.timed);
      if (isUntimedPractice) {
        state.practiceTranslationOpen = !state.practiceTranslationOpen;
        resetSelectiveTranslationOverrides(s);
        renderExam({ preserveScroll: true });
      }
      break;
    }
    case 'toggleStudyList': {
      const q = currentExamQuestion(s);
      if (!q) break;
      const inStudy = await toggleStudyItem(q);
      const btn = document.querySelector('.study-list-quick-button');
      if (btn) {
        btn.classList.toggle('is-active', inStudy);
        btn.setAttribute('aria-pressed', String(inStudy));
        btn.setAttribute('title', inStudy ? t('studyRemoveTooltip') : t('studyAddTooltip'));
        btn.setAttribute('aria-label', inStudy ? t('studyRemoveTooltip') : t('studyAddTooltip'));
        btn.textContent = inStudy ? '✓' : '+';
      }
      const mapBtn = document.querySelector(`.question-map-item[data-index="${s.currentIndex}"]`);
      if (mapBtn) {
        mapBtn.classList.toggle('in-study', inStudy);
      }
      break;
    }
    case 'togglePracticeReveal': {
      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
      if (!isUntimedPractice) break;
      state.practiceRevealAnswer = !state.practiceRevealAnswer;
      renderExam({ preserveScroll: true });
      break;
    }
    case 'toggleQuestionTrans': {
      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
      if (!isUntimedPractice) break;
      const q = currentExamQuestion(s);
      if (!q) break;
      toggleSelectiveTrans(s, q.id, null);
      renderExam({ preserveScroll: true });
      break;
    }
    case 'toggleOption1Trans':
    case 'toggleOption2Trans':
    case 'toggleOption3Trans': {
      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
      if (!isUntimedPractice) break;
      const q = currentExamQuestion(s);
      if (!q) break;
      const targetVisualIdx = matchedAction === 'toggleOption1Trans' ? 0 : (matchedAction === 'toggleOption2Trans' ? 1 : 2);
      const displayed = getExamDisplayedOptions(s, q);
      const opt = displayed[targetVisualIdx];
      if (!opt || !opt.key) break;
      toggleSelectiveTrans(s, q.id, opt.key);
      renderExam({ preserveScroll: true });
      break;
    }
    case 'toggleQuestionKotoba': {
      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
      if (!isUntimedPractice) break;
      const q = currentExamQuestion(s);
      if (!q) break;
      toggleSelectiveKotoba(s, q.id, null);
      if (typeof ensureKotobaDataLoaded === 'function') {
        try {
          await ensureKotobaDataLoaded();
        } catch (e) {}
      }
      renderExam({ preserveScroll: true });
      break;
    }
    case 'toggleOption1Kotoba':
    case 'toggleOption2Kotoba':
    case 'toggleOption3Kotoba': {
      const isUntimedPractice = Boolean(s && s.mode === 'practice' && !s.deadline && !s.timed);
      if (!isUntimedPractice) break;
      const q = currentExamQuestion(s);
      if (!q) break;
      const targetVisualIdx = matchedAction === 'toggleOption1Kotoba' ? 0 : (matchedAction === 'toggleOption2Kotoba' ? 1 : 2);
      const displayed = getExamDisplayedOptions(s, q);
      const opt = displayed[targetVisualIdx];
      if (!opt || !opt.key) break;
      toggleSelectiveKotoba(s, q.id, opt.key);
      if (typeof ensureKotobaDataLoaded === 'function') {
        try {
          await ensureKotobaDataLoaded();
        } catch (e) {}
      }
      renderExam({ preserveScroll: true });
      break;
    }
  }
});

const DEFAULT_PINCH_COOLDOWN_MS = 150;
const activeExamPointers = new Map();
let wasMultiTouch = false;
let multiTouchCooldownUntil = 0;

function isExamMultiTouchGuarded() {
  return activeExamPointers.size >= 2 || wasMultiTouch || Date.now() < multiTouchCooldownUntil;
}

const PINCH_GUARDED_EXAM_ACTIONS = new Set([
  'answer',
  'toggle-selective-trans',
  'toggle-selective-kotoba',
  'toggle-fullscreen',
  'exam-settings',
  'toggle-furigana-quick',
  'toggle-question-map',
  'toggle-flag',
  'toggle-practice-translation',
  'toggle-practice-reveal-answer',
  'exam-prev',
  'exam-next',
  'exam-finish',
  'jump-question'
]);

let examAnswerPointerStart = null;
const supportsPointerEvents = typeof window !== 'undefined' && 'PointerEvent' in window;

if (supportsPointerEvents) {
  document.addEventListener('pointerdown', e => {
    if (state.page === 'exam' && e.target?.closest?.('.exam-shell')) {
      if (Date.now() >= multiTouchCooldownUntil && activeExamPointers.size === 0) {
        wasMultiTouch = false;
      }
      activeExamPointers.set(e.pointerId, { x: e.clientX, y: e.clientY, time: Date.now() });
      if (activeExamPointers.size >= 2) {
        wasMultiTouch = true;
        examAnswerPointerStart = null;
      }
    }
    if (wasMultiTouch || activeExamPointers.size >= 2) {
      examAnswerPointerStart = null;
      return;
    }
    const choice = e.target.closest?.('.answer-choice[data-action="answer"]');
    if (choice) {
      examAnswerPointerStart = { x: e.clientX, y: e.clientY };
    } else {
      examAnswerPointerStart = null;
    }
  }, { passive: true });

  const handleExamPointerEnd = e => {
    if (activeExamPointers.has(e.pointerId)) {
      activeExamPointers.delete(e.pointerId);
    }
    if (e.type === 'pointercancel') {
      activeExamPointers.clear();
    }
    if (activeExamPointers.size === 0 && wasMultiTouch) {
      multiTouchCooldownUntil = Date.now() + DEFAULT_PINCH_COOLDOWN_MS;
      wasMultiTouch = false;
    }
  };

  document.addEventListener('pointerup', handleExamPointerEnd, { passive: true });
  document.addEventListener('pointercancel', handleExamPointerEnd, { passive: true });
} else {
  // Fallback exclusively for legacy browsers lacking PointerEvent support
  document.addEventListener('touchstart', e => {
    if (state.page === 'exam' && e.target?.closest?.('.exam-shell') && e.touches && e.touches.length >= 2) {
      wasMultiTouch = true;
      examAnswerPointerStart = null;
    }
  }, { passive: true });

  const handleExamTouchEnd = e => {
    if (state.page === 'exam' && (!e.touches || e.touches.length === 0) && wasMultiTouch) {
      multiTouchCooldownUntil = Date.now() + DEFAULT_PINCH_COOLDOWN_MS;
      wasMultiTouch = false;
    }
  };

  document.addEventListener('touchend', handleExamTouchEnd, { passive: true });
  document.addEventListener('touchcancel', () => {
    if (state.page === 'exam') {
      if (wasMultiTouch) {
        multiTouchCooldownUntil = Date.now() + DEFAULT_PINCH_COOLDOWN_MS;
        wasMultiTouch = false;
      }
    }
  }, { passive: true });
}

window.addEventListener('blur', () => {
  activeExamPointers.clear();
  wasMultiTouch = false;
}, { passive: true });

document.addEventListener('mousedown', e => {
  if (e.target.closest('.rich-editor-toolbar button')) e.preventDefault();
});

document.addEventListener('click', e => {
  const button = e.target.closest('[data-rich-command]');
  if (!button) return;
  e.preventDefault();
  const shell = button.closest('.rich-editor-shell');
  const editor = shell?.querySelector('[data-rich-field]');
  if (!editor || editor.getAttribute('contenteditable') === 'false') return;
  editor.focus();
  const command = button.dataset.richCommand;
  const value = button.dataset.richValue || null;
  try { document.execCommand(command, false, value); }
  catch (err) { console.warn('Format rich text tidak tersedia:', command, err); }
});

document.addEventListener('paste', async e => {
  const editor = e.target.closest('[data-rich-field]');
  if (!editor || !$('#question-editor') || editor.getAttribute('contenteditable') === 'false') return;
  const clipboard = e.clipboardData;
  if (!clipboard) return;
  const imageItem = [...(clipboard.items || [])].find(item => item.kind === 'file' && /^image\/(?:png|jpeg|webp|gif)$/i.test(item.type));
  if (imageItem) {
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast('Gambar maksimal 8 MB.', 'warn'); return; }
    try {
      const dataUrl = await blobToDataURL(file);
      if (!editor.isConnected) return;
      editor.focus();
      document.execCommand('insertHTML', false, `<img src="${dataUrl}" alt="Ilustrasi tempelan">`);
      toast('Gambar ditempel ke konten soal.', 'success');
    } catch (err) { console.error(err); toast('Gagal menempel gambar.', 'error'); }
    return;
  }
  const clipboardHTML = clipboard.getData('text/html');
  if (clipboardHTML) {
    e.preventDefault();
    const clean = sanitizeRichHTML(clipboardHTML);
    if (clean) document.execCommand('insertHTML', false, clean);
    else document.execCommand('insertText', false, clipboard.getData('text/plain') || '');
  }
});

document.addEventListener('click', async e => {
  const langTrigger = e.target.closest('#zen-lang-trigger');
  if (langTrigger) {
    const wrap = $('#zen-lang-dropdown');
    const menu = $('#zen-lang-menu');
    if (wrap && menu) {
      const isOpen = wrap.classList.contains('is-open');
      wrap.classList.toggle('is-open', !isOpen);
      menu.hidden = isOpen;
      langTrigger.setAttribute('aria-expanded', String(!isOpen));
    }
    return;
  }

  const langItem = e.target.closest('.zen-lang-item');
  if (langItem) {
    const newLang = langItem.dataset.lang;
    const wrap = $('#zen-lang-dropdown');
    const menu = $('#zen-lang-menu');
    if (wrap && menu) {
      wrap.classList.remove('is-open');
      menu.hidden = true;
      $('#zen-lang-trigger')?.setAttribute('aria-expanded', 'false');
    }
    if (newLang && newLang !== state.lang) {
      setLanguage(newLang);
    }
    return;
  }

  // Close lang dropdown when clicking outside
  if (!e.target.closest('#zen-lang-dropdown')) {
    const wrap = $('#zen-lang-dropdown');
    const menu = $('#zen-lang-menu');
    if (wrap && menu && wrap.classList.contains('is-open')) {
      wrap.classList.remove('is-open');
      menu.hidden = true;
      $('#zen-lang-trigger')?.setAttribute('aria-expanded', 'false');
    }
  }

  // Close exam settings popover when clicking outside
  if (state.examSettingsOpen && !e.target.closest('#exam-settings-popover') && !e.target.closest('[data-action="exam-settings"]')) {
    state.examSettingsOpen = false;
    const pop = $('#exam-settings-popover');
    if (pop) {
      pop.hidden = true;
      pop.classList.remove('is-open');
    }
    $('[data-action="exam-settings"]').forEach(b => b.classList.remove('is-active'));
  }

  const pageBtn = e.target.closest('[data-page]');
  const actionBtn = e.target.closest('[data-action]');
  if (pageBtn && !actionBtn) {
    e.preventDefault();
    await go(pageBtn.dataset.page);
    return;
  }
  if (actionBtn) {
    const action = actionBtn.dataset.action;
    if (state.page === 'exam' && PINCH_GUARDED_EXAM_ACTIONS.has(action) && isExamMultiTouchGuarded()) {
      return;
    }
    if (action === 'close-modal' && actionBtn.classList.contains('modal-backdrop') && e.target !== actionBtn) return;
    if (action === 'answer') {
      const moved = examAnswerPointerStart
        ? Math.hypot(e.clientX - examAnswerPointerStart.x, e.clientY - examAnswerPointerStart.y)
        : 0;
      examAnswerPointerStart = null;
      const sel = window.getSelection ? window.getSelection() : null;
      const selectedText = sel && !sel.isCollapsed ? String(sel.toString() || '').trim() : '';
      const selectionInsideExam = Boolean(
        selectedText &&
        sel?.anchorNode &&
        actionBtn.closest('.exam-workspace')?.contains(sel.anchorNode)
      );
      if (moved > 6 || selectionInsideExam) {
        return;
      }
    }
    e.preventDefault();
    try { await handleAction(action, actionBtn); }
    catch (err) { console.error(err); toast(err.message || 'Terjadi kesalahan.', 'error'); }
  }
});

document.addEventListener('change', async e => {
  const target = e.target;
  try {
    if (target.matches('#global-lang-select, #exam-pref-lang')) {
      setLanguage(target.value);
      return;
    }
    if (target.matches('#exam-pref-furigana')) {
      state.examPrefs.showFurigana = target.checked;
      saveExamPrefs(state.examPrefs);
      applyExamPrefs();
      return;
    }
    if (target.matches('#csv-import-file')) {
      const file = target.files?.[0]; target.value = '';
      if (!file) return;
      await openCSVImport(file);
      return;
    }
    if (target.matches('#json-set-import-file')) {
      const file = target.files?.[0]; target.value = '';
      if (!file) return;
      await importBackupFile(file);
      return;
    }
    if (target.matches('[data-csv-map]') && state.csvImport) {
      state.csvImport.mapping[target.dataset.csvMap] = target.value === '' ? null : Number(target.value);
      renderCSVImportModal();
      return;
    }
    if (target.matches('input[name="questionIds"]')) {
      if (target.checked) state.setupCustomIds.add(target.value);
      else state.setupCustomIds.delete(target.value);
      updateCustomSetupSummary();
      return;
    }
    if (target.matches('[data-media-kind]')) {
      syncQuestionDraft();
      const file = target.files?.[0]; if (!file) return;
      if (file.size > 35 * 1024 * 1024) { toast('File gambar maksimal 35 MB.', 'warn'); target.value = ''; return; }
      if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { toast('Gunakan gambar JPG, PNG, atau WebP.', 'warn'); return; }
      const m = { id: uid('media'), name: file.name, type: file.type, blob: file };
      state.editor.q.media.push(m);
      state.editor.q.imageMediaId = m.id;
      state.editor.q.questionImage = '';
      renderQuestionEditor();
      return;
    }
    if (target.matches('[data-option-image]')) {
      syncQuestionDraft();
      const file = target.files?.[0]; if (!file) return;
      if (!file.type.startsWith('image/')) { toast('Pilih file gambar.', 'warn'); return; }
      const m = { id: uid('media'), name: file.name, type: file.type, blob: file };
      state.editor.q.media.push(m);
      state.editor.q.options[Number(target.dataset.optionImage)].mediaId = m.id;
      renderQuestionEditor();
      return;
    }
    if (target.matches('#setup-form select, #setup-form input')) {
      if (target.name === 'candidatePhoto') return;
      const form = $('#setup-form'); if (!form) return;
      const prevMode = state.setup.mode;
      state.setup.mode = form.elements.mode.value;
      state.setup.setId = form.elements.setId?.value || 'ssw-pm-kunci-ujian-1';
      state.setup.candidateName = String(form.elements.candidateName?.value || '').trim();
      state.setup.count = Number(form.elements.count.value) || 40;
      state.setup.duration = Number(form.elements.duration.value) || 70;
      state.setup.random = form.elements.random.checked;
      state.setup.shuffleOptions = Boolean(form.elements.shuffleOptions?.checked);
      state.setup.practice = form.elements.practice.checked;
      if (target.name === 'mode' && state.setup.mode !== prevMode) {
        if (state.setup.mode === 'practice') state.setup.practice = true;
        else if (state.setup.mode === 'full') {
          state.setup.practice = false;
          state.setup.duration = state.settings.standardDuration || 70;
        }
      }
      if (['mode', 'setId'].includes(target.name)) state.setupCustomIds.clear();
      renderSetup();
      return;
    }
    if (target.matches('#bank-select-visible')) {
      for (const id of state.bankVisibleIds) {
        if (target.checked) state.bankSelectedIds.add(id);
        else state.bankSelectedIds.delete(id);
      }
      renderBank();
      return;
    }
    if (target.matches('[data-question-select]')) {
      const id = target.dataset.questionSelect;
      if (target.checked) state.bankSelectedIds.add(id);
      else state.bankSelectedIds.delete(id);
      renderBank();
      return;
    }
    if (target.matches('#bank-package-filter, #bank-media-filter, #bank-status-filter')) {
      if (target.id === 'bank-package-filter') state.bankFilter.setId = target.value;
      if (target.id === 'bank-media-filter') state.bankFilter.media = target.value;
      if (target.id === 'bank-status-filter') state.bankFilter.status = target.value;
      state.bankPage = 1;
      renderBank();
      return;
    }
    if (target.matches('#review-filter')) {
      state.reviewFilter = target.value;
      renderResult();
      return;
    }
    if (target.matches('#backup-file')) {
      await importBackupFile(target.files?.[0]);
      return;
    }
  } catch (err) {
    console.error(err);
    toast(err.message || 'Gagal memproses perubahan.', 'error');
  }
});

document.addEventListener('input', e => {
  const tEl = e.target;
  if (tEl.matches('#exam-pref-q-font')) {
    state.examPrefs.questionFontSize = Math.min(36, Math.max(18, Number(tEl.value) || 22));
    saveExamPrefs(state.examPrefs);
    applyExamPrefs();
    return;
  }
  if (tEl.matches('#exam-pref-a-font')) {
    state.examPrefs.answerFontSize = Math.min(30, Math.max(16, Number(tEl.value) || 17));
    saveExamPrefs(state.examPrefs);
    applyExamPrefs();
    return;
  }
  if (tEl.matches('#bank-search')) {
    state.bankFilter.search = tEl.value;
    state.bankPage = 1;
    const start = tEl.selectionStart;
    renderBank();
    const next = $('#bank-search');
    next?.focus();
    try { next?.setSelectionRange(start, start); } catch {}
  }
});

document.addEventListener('change', async e => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.files?.[0]) return;
  if (!input.accept?.includes('image')) return;
  if (input.id !== 'candidate-photo-upload' && input.id !== 'result-photo-upload') return;
  const file = input.files[0];
  if (!file.type.startsWith('image/')) { toast('Pilih file gambar yang valid.', 'warn'); return; }
  if (file.size > 3 * 1024 * 1024) { toast('Ukuran foto maksimal 3 MB.', 'warn'); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = async () => {
    const data = String(reader.result || '');
    if (input.id === 'candidate-photo-upload') {
      state.setup.candidatePhoto = data;
      toast('Foto kandidat dipilih untuk simulasi berikutnya.', 'success');
    } else if (input.id === 'result-photo-upload') {
      const session = getResultSession();
      if (!session) return;
      session.candidatePhoto = data;
      await put('sessions', session);
      await reloadData();
      renderResult();
      toast('Foto pada lembar hasil berhasil diperbarui.', 'success');
    }
  };
  reader.readAsDataURL(file);
});

document.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  try {
    if (form.id === 'setup-form') {
      state.setup.mode = form.elements.mode.value;
      state.setup.setId = form.elements.setId?.value || 'ssw-pm-kunci-ujian-1';
      state.setup.candidateName = String(form.elements.candidateName?.value || '').trim() || 'Faiz';
      state.setup.count = Number(form.elements.count.value) || 40;
      state.setup.duration = Number(form.elements.duration.value) || 70;
      state.setup.random = form.elements.random.checked;
      state.setup.shuffleOptions = Boolean(form.elements.shuffleOptions?.checked);
      state.setup.practice = form.elements.practice.checked;
      const pool = getSetupPool(state.setup);
      if (!pool.length) {
        toast('Tidak ada soal aktif untuk paket ini.', 'warn');
        return;
      }
      await startExam();
    } else if (form.id === 'settings-form') {
      await saveSettings(form);
    }
  } catch (err) {
    console.error(err);
    toast(err.message || 'Tidak dapat menyimpan data.', 'error');
  }
});

$('#mobile-menu')?.addEventListener('click', () => $('#sidebar').classList.toggle('sidebar-open'));

if (typeof window !== 'undefined') {
  window.put = put;
  window.get = get;
  window.all = all;
  window.getAll = all;
  window.reloadData = reloadData;
  window.render = render;
  window.getAvailablePackages = getAvailablePackages;
  window.ensureAllBuiltinSetsLoaded = ensureAllBuiltinSetsLoaded;
  window.go = go;
  window.startExam = startExam;
  window.moveExamTo = moveExamTo;
  window.finishExam = finishExam;
  window.initSelectiveState = initSelectiveState;
  window.getSelectiveState = getSelectiveState;
  window.getSelectiveQuestionState = getSelectiveQuestionState;
  window.getSelectiveOptionState = getSelectiveOptionState;
  window.getOptionKey = getOptionKey;
  window.toggleSelectiveTrans = toggleSelectiveTrans;
  window.resetSelectiveTranslationOverrides = resetSelectiveTranslationOverrides;
  window.setKotobaData = setKotobaData;
  window.ensureKotobaDataLoaded = ensureKotobaDataLoaded;
  window.resolveKotobaEntries = resolveKotobaEntries;
  window.renderKotobaList = renderKotobaList;
  window.toggleSelectiveKotoba = toggleSelectiveKotoba;
  window.getExamDisplayedOptions = getExamDisplayedOptions;
  window.shouldUseFillScreenFallback = shouldUseFillScreenFallback;
  window.isFullscreenActive = isFullscreenActive;
  window.toggleFullScreen = toggleFullScreen;
  window.updateFullscreenUI = updateFullscreenUI;
  window.cleanupFullscreen = cleanupFullscreen;
}

/* ==========================================================================
   FEATURE 004: Global Mobile Swipe Navigation Across All Main Tabs
   ========================================================================== */
const ORDERED_MAIN_TABS = Object.freeze([
  'home',
  'setup',
  'bank',
  'history',
  'study',
  'backup'
]);

const SWIPE_CONFIG = Object.freeze({
  THRESHOLD_PX: 70,
  MAX_DURATION_MS: 800,
  DOMINANCE_RATIO: 1.5,
  EXEMPT_PAGES: Object.freeze(['exam', 'result', 'review'])
});

function getAdjacentMainTab(currentPage, direction) {
  const currentIndex = ORDERED_MAIN_TABS.indexOf(currentPage);
  if (currentIndex === -1) return null;
  if (direction === 'next') {
    const nextIndex = currentIndex + 1;
    return nextIndex < ORDERED_MAIN_TABS.length ? ORDERED_MAIN_TABS[nextIndex] : null;
  }
  if (direction === 'prev') {
    const prevIndex = currentIndex - 1;
    return prevIndex >= 0 ? ORDERED_MAIN_TABS[prevIndex] : null;
  }
  return null;
}

function isSwipeTargetExcluded(target) {
  if (!target || !(target instanceof Element)) return false;
  // 1. Interactive controls
  if (target.closest('input, textarea, select, button, a, [role="slider"], [role="button"], audio, video, canvas, [data-no-swipe]')) {
    return true;
  }
  // 2. Horizontally scrollable carousels & containers
  if (target.closest('.hd-pkg-pills, #home-pkg-pills, .table-scroll, pre, code, [data-horizontal-scroll]')) {
    return true;
  }
  // 3. Ancestral horizontal overflow check
  let curr = target;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    if (curr.scrollWidth > curr.clientWidth) {
      try {
        const style = window.getComputedStyle(curr);
        const ox = style.overflowX;
        if (ox === 'auto' || ox === 'scroll') return true;
      } catch (_) {}
    }
    curr = curr.parentElement;
  }
  return false;
}

let swipeSession = null;

function initSwipeNavigation() {
  const onTouchStart = (e) => {
    if (!e.touches || e.touches.length !== 1) {
      swipeSession = null;
      return;
    }
    // Check exempt pages (CBT active, Results, Review)
    if (SWIPE_CONFIG.EXEMPT_PAGES.includes(state.page)) {
      swipeSession = null;
      return;
    }
    // Check if modal or dialog is open
    const hasModal = Boolean(document.querySelector('.modal-backdrop:not([hidden]), .zen-dialog:not([hidden]), #editor-modal:not([hidden]), #settings-modal:not([hidden]), #csv-import-modal:not([hidden])'));
    if (hasModal) {
      swipeSession = null;
      return;
    }
    // Check target exclusion
    if (isSwipeTargetExcluded(e.target)) {
      swipeSession = null;
      return;
    }

    const t = e.touches[0];
    swipeSession = {
      startX: t.clientX,
      startY: t.clientY,
      startTime: Date.now(),
      isVerticalScroll: false,
      hasNavigated: false
    };
  };

  const onTouchMove = (e) => {
    if (!swipeSession || swipeSession.hasNavigated || swipeSession.isVerticalScroll) return;
    if (!e.touches || e.touches.length !== 1) {
      swipeSession = null;
      return;
    }
    const t = e.touches[0];
    const dx = t.clientX - swipeSession.startX;
    const dy = t.clientY - swipeSession.startY;

    // Early vertical scroll locking
    if (Math.abs(dy) > Math.abs(dx)) {
      swipeSession.isVerticalScroll = true;
    }
  };

  const onTouchEnd = async (e) => {
    if (!swipeSession || swipeSession.hasNavigated || swipeSession.isVerticalScroll) {
      swipeSession = null;
      return;
    }
    const duration = Date.now() - swipeSession.startTime;
    if (duration > SWIPE_CONFIG.MAX_DURATION_MS) {
      swipeSession = null;
      return;
    }

    const changedTouch = e.changedTouches && e.changedTouches[0];
    if (!changedTouch) {
      swipeSession = null;
      return;
    }

    const dx = changedTouch.clientX - swipeSession.startX;
    const dy = changedTouch.clientY - swipeSession.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX >= SWIPE_CONFIG.THRESHOLD_PX && absX > absY * SWIPE_CONFIG.DOMINANCE_RATIO) {
      const direction = dx < 0 ? 'next' : 'prev';
      const targetPage = getAdjacentMainTab(state.page, direction);
      swipeSession.hasNavigated = true;
      swipeSession = null;
      if (targetPage) {
        await go(targetPage);
      }
    } else {
      swipeSession = null;
    }
  };

  const onTouchCancel = () => {
    swipeSession = null;
  };

  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('touchcancel', onTouchCancel, { passive: true });
}

async function boot() {
  try {
    initSwipeNavigation();
    applyExamPrefs();
    updateShellLanguage();
    const seedKunci = (SEED_KUNCI_UJIAN_1?.questions || []).map((q, i) => normalizeExternalQuestion(q, i, 'ssw-pm-kunci-ujian-1', 'Soal Ujian 1 — CBTP Gino1')).filter(Boolean);
    const seedTipe2 = (SEED_SSW_TIPE_2?.questions || []).map((q, i) => normalizeExternalQuestion(q, i, 'ssw-pm-tipe2-nguyen1', 'Latsol Tipe 2 SSW PM — Đề 7 Thực Phẩm GINO1')).filter(Boolean);
    state.questions = [...seedKunci, ...seedTipe2];
    renderHome();
    await initialise();
    await reloadData();
    await ensureKunciUjian1Loaded(false);
    await ensureSswPmTipe2Loaded(false);
    $('#connection-label').textContent = navigator.onLine ? t('storageOnline') : t('storageOffline');
    window.addEventListener('online', () => $('#connection-label').textContent = t('storageOnline'));
    window.addEventListener('offline', () => $('#connection-label').textContent = t('storageOffline'));
    if (!state.settings.resumeInterrupted) {
      for (const s of state.sessions.filter(x => x.status === 'in_progress')) {
        s.status = 'interrupted';
        s.endedAt = Date.now();
        await put('sessions', s);
      }
      await reloadData();
    }
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js?v=ssw28').catch(err => console.warn('Service worker gagal didaftarkan:', err));
    }
    state.setup.duration = state.settings.standardDuration || 70;
    state.setup.count = state.settings.standardCount || 40;
    renderHome();
    if (typeof window !== 'undefined') window.__APP_BOOTED__ = true;
    ensureAllBuiltinSetsLoaded(false).catch(err => console.warn('Auto-seed paket tambahan dilewati:', err));
  } catch (err) {
    console.error(err);
    view.innerHTML = `<section class="panel error-panel"><h1>Penyimpanan belum siap</h1><p>${esc(err.message || 'Browser gagal membuka IndexedDB.')}</p><p>Pastikan aplikasi dibuka dari localhost atau hosting HTTPS dan browser mengizinkan penyimpanan situs.</p><button class="button button-primary" onclick="location.reload()">Coba lagi</button></section>`;
  }
}
boot();
