# Contract: CBT Viewport Lifecycle & Scroll Teardown

**Feature**: `003-fix-exam-scroll-lock`
**Date**: 2026-11-09
**Domain**: Client-Side Single Page Application Lifecycle

## 1. Exam Teardown Contract (`finishExam`)

### Signature
```typescript
function finishExam(timeUp?: boolean, manualConfirmed?: boolean): Promise<void>
```

### Preconditions
- Sesi aktif tersedia (`activeExam() != null`).
- Jika `timeUp === false` dan `manualConfirmed === false`, dialog konfirmasi ditampilkan terlebih dahulu.

### Postconditions
- `s.status` diset ke `'time-up'` (jika `timeUp === true`) atau `'completed'` (jika `timeUp === false`).
- `s.endedAt` dan `s.elapsedSeconds` tersimpan di IndexedDB (`sessions`).
- `state.resultId` diset ke `s.id`.
- `state.activeSession` diset ke `null`.
- `state.page` diset ke `'result'`.
- **Viewport Governance Guarantees**:
  1. `document.body.classList.remove('exam-mode')` terpanggil.
  2. `document.documentElement.classList.remove('in-exam')` terpanggil.
  3. `unlockExamOrientation()` terpanggil.
  4. `updateFullscreenUI()` terpanggil untuk menyinkronkan indikator status tanpa memaksakan `document.exitFullscreen()`.
- **Scroll Guarantees**:
  1. Root document (`window`, `html`, `body`) bebas dari `position: fixed` dan `overflow: hidden`.
  2. Scroll posisi dapat bergerak dari `scrollY === 0` hingga dasar halaman.

---

## 2. Central Router Invariant Contract (`render`)

### Signature
```typescript
function render(): void
```

### Invariant Contract
Setiap kali fungsi `render()` dieksekusi:
```javascript
if (state.page !== 'exam') {
  document.body.classList.remove('exam-mode');
  document.documentElement.classList.remove('in-exam');
  unlockExamOrientation();
}
```
Aturan ini menjamin bahwa tidak ada satupun halaman di luar `exam` yang dapat terinfeksi atau mewarisi status scroll lock CBT.

---

## 3. Navigation Teardown Contract (`go`)

### Signature
```typescript
function go(page: string): Promise<void>
```

### Postconditions for `page !== 'exam'`
- `document.body.classList.remove('exam-mode')`.
- `document.documentElement.classList.remove('in-exam')`.
- `unlockExamOrientation()`.
- Tampilan navigasi sidebar menutup jika sebelumnya terbuka (`#sidebar.sidebar-open` dilepas).
