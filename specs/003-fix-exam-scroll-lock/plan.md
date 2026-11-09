# Implementation Plan: Fix Exam Scroll Lock on Finished, Results, and Review Pages

**Branch**: `fix/exam-scroll-lock` | **Date**: 2026-11-09 | **Spec**: [specs/003-fix-exam-scroll-lock/spec.md](spec.md)

**Input**: Feature specification from `/specs/003-fix-exam-scroll-lock/spec.md`

## Summary

Memperbaiki bug penguncian scroll (*scroll lock*) pada halaman Exam Finished, Results, dan Review Answers yang terjadi setelah ujian CBT selesai. Investigasi empiris membuktikan bahwa penyebabnya adalah kelalaian fungsi `finishExam()` di `app.js` yang hanya menghapus kelas `exam-mode` dari `document.body` namun tidak menghapus kelas `in-exam` dari `document.documentElement` (`<html>`), sehingga aturan CSS `html.in-exam { position: fixed !important; overflow: hidden !important; }` tetap aktif mengunci scrolling seluruh dokumen.

Solusi implementasi berfokus secara bedah (*surgical*) pada `app.js`:
1. Menambahkan pembersihan eksplisit `document.documentElement.classList.remove('in-exam')` dan `unlockExamOrientation()` di `finishExam()`.
2. Menegakkan invarian defensif di router utama `render()`: jika `state.page !== 'exam'`, hapus `in-exam` dan `exam-mode` serta panggil `unlockExamOrientation()`.
3. Menjaga proteksi isolasi scroll tetap 100% aktif selama sesi ujian CBT aktif (`state.page === 'exam'`).
4. Memvalidasi perbaikan menggunakan automated regression test suite headless Chrome CDP pada viewport Desktop (1440×900) dan Mobile (390×844) untuk kedua skenario (penyelesaian manual dan otomatis saat waktu habis).

## Technical Context

**Language/Version**: Modern Vanilla JavaScript (ES2022+ Native ES Modules), Native HTML5, Modern CSS.

**Primary Dependencies**: Zero external dependencies (PWA murni).

**Storage**: IndexedDB (`ssw-pm-mock-test-db`, version 2) untuk persistensi sesi ujian.

**Testing**: Standalone Node.js scripts dan Headless Chromium automation via Chrome DevTools Protocol (`--headless=new`, `--remote-debugging-pipe`).

**Target Platform**: Desktop (Chrome, Edge, Safari, Firefox) dan Mobile (iOS Safari, Android Chrome).

**Project Type**: Single-Page Application (SPA) Progressive Web App (PWA) offline-first.

**Performance Goals**:
- Latensi transisi dari ujian selesai ke Results < 150 ms.
- Kemampuan scroll instan (60 fps) tanpa jank, layout shift, atau freezing.

**Constraints**:
- Perubahan kode aplikasi hanya diperbolehkan pada `app.js` (perubahan minimal).
- Tidak boleh mengubah CSS CBT atau non-CBT (`styles.css`, `QUESTION-EDITOR-UPDATES.css`, `ZEN-*.css`).
- Tidak boleh mengubah logika timer ujian, perhitungan skor, atau database soal.
- PWA offline caching dan Service Worker tetap utuh.
- **Scope Boundary**: Swipe tab navigation berada di luar cakupan Feature 003 untuk menjaga surgical impact.
- **Fullscreen Teardown**: Fullscreen adalah fitur opsional peserta yang tidak mengunci scroll. Sistem menormalkan orientasi layar (`unlockExamOrientation()`) dan menyinkronkan UI tanpa memanggil paksa `document.exitFullscreen()` saat ujian selesai.

**Scale/Scope**:
- 1 file aplikasi termodifikasi (`app.js`).
- 1 file pengujian regresi baru (`tests/test-exam-scroll-lock.mjs`).

## Constitution Check

*GATE: Evaluated against Constitution v1.1.0*

| Principle / Gate | Status | Evaluation & Compliance Notes |
|---|---|---|
| **Principle I: Preserve Existing Functionality** | **PASS** | Zone A CBT tetap terlindungi penuh saat aktif (`state.page === 'exam'`). Scroll lock hanya dilepas setelah ujian selesai atau saat berpindah ke halaman non-exam. Tidak ada perombakan visual. |
| **Principle II: Data Integrity & Schema Preservation** | **PASS** | Tidak menyentuh atau memodifikasi schema soal, IndexedDB stores, atau bundle JSON. |
| **Principle III: Minimal Changes & Scoped Impact** | **PASS** | Perubahan terkonsentrasi hanya pada pembersihan class di `finishExam()` dan guard di `render()` pada `app.js`. CSS dan HTML tidak diubah. |
| **Principle IV: UI Consistency & Zen White Design System** | **PASS** | Tampilan Hasil Ujian dan Review tetap mengikuti Zen White Digital Library tanpa pergeseran layout. |
| **Principle V: Mobile Responsiveness & Multi-Viewport Parity** | **PASS** | Diuji dan diverifikasi pada Desktop (1440×900) dan Mobile (390×844) via CDP automation. |
| **Principle VI: Performance & Zero-Dependency PWA** | **PASS** | Zero library eksternal, performa native DOM manipulation, Service Worker v27 tetap sinkron. |
| **Principle VII: Testing & Empirical Verification** | **PASS** | Pengujian regresi otomatis dengan bukti numerik `scrollY > 0`, visual hingga kartu soal #40, dan screenshot artefak. |
| **Tier 4 Quality Gates** | **PASS** | - Gate 1 (Zero-Dependency & Scope Check): Lulus.<br>- Gate 2 (Schema & Data Consistency): Lulus (data soal tidak tersentuh).<br>- Gate 3 (Multi-Viewport Browser Parity): Lulus via CDP.<br>- Gate 4 (Service Worker & Cache Synchronization): Lulus (governance invariant terjaga). |

## Project Structure

### Documentation (this feature)

```text
specs/003-fix-exam-scroll-lock/
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0: Root cause investigation & architectural decisions
├── data-model.md        # Phase 1: State lifecycle & viewport governance matrix
├── contracts/
│   └── cbt-lifecycle.md # Phase 1: Viewport lifecycle & scroll teardown contract
├── quickstart.md        # Phase 1: Test execution & validation guide
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── spec.md              # Feature specification
```

### Source Code Impact

```text
app.js                                  # Surgical modification: lifecycle teardown in finishExam() & render()
tests/test-exam-scroll-lock.mjs         # New regression test suite: CDP automation for scroll behavior
```

**Structure Decision**: Perubahan murni terkonsentrasi pada file pengendali state `app.js` dan pembuatan automated regression test `tests/test-exam-scroll-lock.mjs`.

## Complexity Tracking

*Zero constitutional violations. No complexity justification required.*
