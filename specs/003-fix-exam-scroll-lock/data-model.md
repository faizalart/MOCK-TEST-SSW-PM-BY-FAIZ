# Data Model & State Lifecycle: CBT Viewport & Scroll Governance

**Feature**: `003-fix-exam-scroll-lock`
**Date**: 2026-11-09

## 1. Application State & Viewport Lifecycle

Siklus hidup aplikasi berpindah melalui status berikut, dengan pemetaan kelas DOM dan aturan penguncian viewport:

```
[ Setup / Beranda / Bank Soal ] (state.page: 'home' | 'setup' | 'bank' | ...)
             │
             ▼ startExam()
[ Active CBT Exam ] (state.page: 'exam')
   - document.documentElement: class "in-exam"
   - document.body: class "exam-mode"
   - Root scroll: LOCKED (position: fixed; overflow: hidden)
   - Workspace scroll: ISOLATED (.exam-workspace, overflow-y: auto)
   - Screen orientation: Locked landscape (jika fullscreen aktif)
             │
             ├─────────────────────────────────────────┐
             ▼ Finish Exam (Manual)                    ▼ Time Up (Otomatis)
   finishExam(false, true)                   finishExam(true)
             │                                         │
             └────────────────────┬────────────────────┘
                                  ▼
[ Exam Results Scorecard ] (state.page: 'result')
   - document.documentElement: class "in-exam" REMOVED (Invariant: false)
   - document.body: class "exam-mode" REMOVED (Invariant: false)
   - Root scroll: UNRESTRICTED (overflow: visible; position: static)
   - Screen orientation: Unlocked
             │
             ▼ Open Review (Click "Review Soal")
[ Review Answers ] (state.page: 'review')
   - document.documentElement: class "in-exam" REMOVED (Invariant: false)
   - document.body: class "exam-mode" REMOVED (Invariant: false)
   - Root scroll: UNRESTRICTED (overflow: visible; position: static)
   - Total cards: 40 questions scrollable from top to bottom
```

## 2. Invariant State Matrix

| State Name | `state.page` | `html.in-exam` | `body.exam-mode` | Root Viewport Scroll | Internal Scroll Container |
|---|---|---|---|---|---|
| **Non-Exam Pages** | `'home'`, `'setup'`, `'bank'`, `'history'`, `'study'`, `'backup'` | `false` | `false` | `overflow: visible; position: static` | Normal window scroll |
| **Active Exam** | `'exam'` | `true` | `true` | `overflow: hidden; position: fixed` | `.exam-workspace`, `.exam-question-map` |
| **Exam Finished / Results** | `'result'` | `false` | `false` | `overflow: visible; position: static` | Normal window scroll |
| **Exam Review** | `'review'` | `false` | `false` | `overflow: visible; position: static` | Normal window scroll |

## 3. State Entities & Fields

### Entity: `SessionRecord` (IndexedDB: `sessions`)
- **Key**: `id` (string, UUID / timestamp ID)
- **Status Fields**:
  - `status`: `'in_progress'` | `'completed'` | `'time-up'`
  - `finishReason`: `'manual-or-complete'` | `'time-limit'`
  - `endedAt`: timestamp (ms)
  - `elapsedSeconds`: number
- **Validation Rules**:
  - Saat `s.status` berubah menjadi `'completed'` atau `'time-up'`, sesi tidak boleh lagi berada dalam status aktif (`state.activeSession = null`).
  - Viewport wajib ditransisikan keluar dari mode isolasi CBT.

### Entity: `ViewportGovernance`
- **DOM Class Invariants**:
  - `document.documentElement.classList.contains('in-exam') === (state.page === 'exam')`
  - `document.body.classList.contains('exam-mode') === (state.page === 'exam')`
- **Orientation Invariants**:
  - `screen.orientation.unlock()` dipanggil saat `state.page !== 'exam'`.
