# Quickstart: Verification & Regression Testing for Feature 003

**Feature**: `003-fix-exam-scroll-lock`
**Date**: 2026-11-09

## Prerequisites
- Node.js runtime (v18+)
- Google Chrome atau Chromium terpasang di sistem (`C:\Program Files\Google\Chrome\Application\chrome.exe` atau setara)
- Port lokal bebas untuk test server (otomatis dialokasikan)

## Verification Commands

### 1. Dedicated Scroll Regression Suite
Jalankan pengujian regresi otomatis scroll lifecycle:
```bash
node tests/test-exam-scroll-lock.mjs
```

### 2. Skenario Pengujian Otomatis yang Tercakup
Script uji menjalankan rangkaian pengujian Chrome Headless CDP berikut:
1. **Manual Finish Scenario (Desktop - 1440×900)**:
   - Mulai sesi ujian baru (40 soal).
   - Jawab beberapa soal pilihan ganda.
   - Klik "Selesaikan Ujian" dan konfirmasi modal.
   - Halaman Results terbuka: verifikasi `html.in-exam === false` dan `body.exam-mode === false`.
   - Scroll Results ke bawah: verifikasi `window.scrollY > 0`.
   - Buka Review Answers: scroll ke bawah hingga kartu soal #40 terdeteksi masuk viewport.
   - Simpan screenshot bukti: `results-desktop.png` dan `review-q40-desktop.png`.
2. **Time-Up Automatic Finish Scenario (Mobile - 390×844)**:
   - Mulai sesi ujian baru.
   - Picu time-up (`finishExam(true)`).
   - Halaman Results terbuka: verifikasi pelepasan class `in-exam` dan `exam-mode`.
   - Scroll Results secara vertikal: verifikasi pergerakan `window.scrollY`.
   - Buka Review Answers: scroll vertikal hingga soal #40.
   - Simpan screenshot bukti: `results-mobile.png` dan `review-q40-mobile.png`.
3. **Repeated Exam Transition & Invariant Check**:
   - Mulai ujian kedua setelah ujian pertama selesai.
   - Pastikan proteksi CBT aktif kembali saat ujian berlangsung (`in-exam: true`, `exam-mode: true`).
   - Selesaikan ujian kedua dan pastikan scroll lock terlepas kembali dengan sempurna.

### 3. Full Existing Regression Suites (Zero Regression Baseline)
Jalankan seluruh pengujian yang ada untuk membuktikan tidak ada regresi pada PWA dan Bank Soal:
```bash
node tests/verify-cache-governance.js
node tests/test-cache-cleanup-scenarios.js
node tests/test-bank-soal-performance.mjs
```

Semua pengujian di atas harus menghasilkan status **PASS** secara menyeluruh.
