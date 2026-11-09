# Research & Decisions: Fix Exam Scroll Lock

**Feature**: `003-fix-exam-scroll-lock`
**Date**: 2026-11-09
**Status**: Completed

## Problem Investigation

### 1. Root Cause Identification
- **Observed Defect**: Setelah menyelesaikan ujian CBT (baik melalui tombol "Selesaikan Ujian" maupun timer habis), halaman Hasil Ujian (`result`) dan Tinjauan Jawaban (`review`) tidak dapat digulir (scroll lock). Pengguna tidak dapat melihat skor lengkap maupun pembahasan soal 1–40.
- **CSS Rule Location**: `QUESTION-EDITOR-UPDATES.css` baris 170–178:
  ```css
  html:has(body.exam-mode),
  html.in-exam {
    overflow: hidden !important;
    height: 100% !important;
    max-height: 100% !important;
    position: fixed !important;
    width: 100% !important;
    inset: 0 !important;
  }
  ```
- **Lifecycle Omission in JS (`app.js`)**:
  - `renderExam()` memasang dua kelas proteksi:
    ```javascript
    document.body.classList.add('exam-mode');
    document.documentElement.classList.add('in-exam');
    ```
  - `finishExam()` hanya membersihkan salah satunya:
    ```javascript
    state.page = 'result';
    document.body.classList.remove('exam-mode'); // Hanya menghapus exam-mode
    render();
    ```
    Fungsi `finishExam()` tidak menghapus class `in-exam` dari `document.documentElement` (`<html>`), dan tidak memanggil `unlockExamOrientation()`.
  - Karena `html` masih berkelas `in-exam`, selektor CSS `html.in-exam` tetap aktif mengunci `html` dengan `position: fixed !important; overflow: hidden !important; inset: 0 !important;`.

## Architectural Decisions

### Decision 1: Deterministic Lifecycle Teardown in `app.js`
- **Decision**: Menambahkan pembersihan eksplisit `document.documentElement.classList.remove('in-exam')` dan `unlockExamOrientation()` pada:
  1. `finishExam()` (titik terminasi langsung saat manual finish atau time-up).
  2. Router pusat `render()` sebagai invarian defensif: jika `state.page !== 'exam'`, pastikan `document.documentElement.classList.remove('in-exam')` dan `document.body.classList.remove('exam-mode')` selalu dieksekusi.
- **Rationale**:
  - `finishExam()` tidak memanggil `go('result')`, melainkan langsung mengatur `state.page = 'result'` dan memanggil `render()`.
  - Meletakkan invariant guard di `render()` menjamin bahwa setiap transisi halaman di luar ujian (termasuk tombol back, event delegation `open-result`, `open-review`, atau pemulihan sesi) secara otomatis bebas dari residu class exam.
- **Alternatives Considered**:
  - *Mengubah CSS `html.in-exam` menjadi selektor gabungan `html.in-exam body.exam-mode`*: Ditolak karena melanggar prinsip lokalisasi perubahan minimal (Constitution Principle III). Perilaku CSS saat CBT aktif sudah tepat dan stabil; masalahnya adalah kelalaian pelepasan kelas di JavaScript.
  - *Memanggil `go('result')` di dalam `finishExam()`*: Ditolak karena `go()` memiliki guard konfirmasi keluar ujian (`if (state.page === 'exam' && page !== 'exam')`) yang dapat memicu interferensi toast jika tidak ditangani hati-hati.

### Decision 2: Preservation of Active CBT Viewport Locks
- **Decision**: Mempertahankan seluruh mekanisme isolasi viewport pada saat ujian sedang AKTIF (`state.page === 'exam'`).
- **Rationale**:
  - Selama ujian CBT berlangsung, peserta memerlukan toolbar atas dan bilah navigasi bawah tetap terpasang kokoh tanpa goyang atau elastisitas viewport di perangkat mobile.
  - Area scroll aktif selama ujian adalah `.exam-workspace` dan `.exam-question-map`, bukan root document.
  - Mengubah perilaku saat ujian aktif berisiko merusak layout CBT yang diproteksi oleh Constitution Principle I.

### Decision 3: Automated Chrome Headless CDP Regression Test Strategy
- **Decision**: Membuat script uji mandiri `tests/test-exam-scroll-lock.mjs` berbasis Chrome DevTools Protocol (CDP) dengan `--headless=new` dan `--remote-debugging-pipe`.
- **Rationale**:
  - Memenuhi Constitution Principle VII (Empirical verification via native CDP automation).
  - Menguji kedua alur penyelesaian:
    1. **Manual Finish**: Peserta menjawab soal, klik "Selesaikan Ujian", konfirmasi dialog, diarahkan ke Results -> scroll test (`scrollY > 0`) -> buka Review Answers -> scroll test hingga soal #40 terdeteksi masuk viewport.
    2. **Automatic Time-Up**: Simulasi waktu ujian habis (`finishExam(true)`) -> diarahkan ke Results -> scroll test -> Review Answers -> scroll test.
  - Menguji Multi-Viewport Parity:
    - Desktop: 1440 × 900
    - Mobile: 390 × 844
  - Mengambil tangkapan layar bukti visual di bagian atas dan bawah halaman untuk disimpan di direktori artefak.

### Decision 4: Fullscreen Lifecycle Handling (C1 Investigation)
- **Investigation Finding**:
  - Fullscreen API di aplikasi bersifat **opsional**, dipicu hanya jika pengguna menekan tombol `[data-action="toggle-fullscreen"]` atau tombol pintas keyboard `F`/`f`.
  - Fullscreen **tidak diaktifkan secara otomatis** saat ujian dimulai (`startExam()`).
  - Aturan CSS untuk `body.is-fullscreen` sama sekali tidak menerapkan `overflow: hidden` atau `position: fixed` pada dokumen; penguncian scroll murni berasal dari `html.in-exam`.
- **Decision**:
  - Sistem **tidak memanggil paksa** `document.exitFullscreen()` di `finishExam()`.
  - Pembersihan saat ujian selesai berfokus pada:
    1. Memanggil `unlockExamOrientation()` untuk melepas kunci rotasi landscape pada perangkat mobile.
    2. Menyinkronkan status indikator UI dengan `updateFullscreenUI()`.
- **Rationale**:
  - Memanggil `document.exitFullscreen()` secara otomatis tanpa gestur pengguna dapat memicu penolakan izin browser (*unhandled promise rejection*), terutama pada skenario waktu ujian habis otomatis (*time-up*).
  - Jika pengguna memang ingin tetap melihat scorecard dalam layar penuh, memaksa keluar merusak kenyamanan pengguna (*user agency*). Pengguna dapat keluar kapan saja dengan menekan Escape, F11, atau tombol kontrol browser.

### Decision 5: Strict Scope Boundary (Exclusion of Swipe Tab Navigation)
- **Decision**: Menegaskan bahwa fitur navigasi swipe tab horizontal (*Instagram-style swipe*) berada sepenuhnya di luar cakupan Feature 003.
- **Rationale**:
  - Sesuai prinsip lokalisasi dampak minimal (Constitution Principle III), pencampuran fitur navigasi gestur baru dengan perbaikan bug scroll lock meningkatkan risiko regresi.
  - Fitur gestur swipe akan ditangani secara terpisah setelah stabilitas perbaikan scroll lock terverifikasi 100%.
