# Tasks: Fix Exam Scroll Lock on Finished, Results, and Review Pages

**Input**: Design documents from `/specs/003-fix-exam-scroll-lock/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/cbt-lifecycle.md`, `quickstart.md`)

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Automated Chrome Headless CDP regression test suite included per constitution and user requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline verification of existing test suites and test harness initialization

- [X] T001 Verify baseline status of existing regression suites (`tests/verify-cache-governance.js`, `tests/test-cache-cleanup-scenarios.js`, `tests/test-bank-soal-performance.mjs`)
- [X] T002 [P] Initialize automated regression test harness skeleton in `tests/test-exam-scroll-lock.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core headless browser test automation infrastructure required for verifying scroll behavior

**⚠️ CRITICAL**: Test runner helpers must be in place before executing story verification

- [X] T003 Implement Chrome DevTools Protocol (CDP) automation helpers (launch headless browser, viewport resizing, mouse wheel emulation, touch scroll emulation, and `window.scrollY` extraction) in `tests/test-exam-scroll-lock.mjs`

**Checkpoint**: Foundation ready — user story implementation and verification can begin.

---

## Phase 3: User Story 1 - Unrestricted Scrolling on Exam Results Scorecard (Priority: P1) 🎯 MVP

**Goal**: Memastikan halaman Results dapat digulir bebas ke atas dan ke bawah setelah ujian selesai (baik via klik tombol "Selesaikan Ujian" maupun saat timer habis otomatis), tanpa hambatan class `in-exam` atau `position: fixed`.

**Independent Test**: Jalankan simulasi ujian CBT hingga selesai, lalu verifikasi `document.documentElement.classList.contains('in-exam') === false`, `document.body.classList.contains('exam-mode') === false`, dan `window.scrollY > 0` saat digulir ke bawah pada desktop dan mobile.

### Tests for User Story 1

- [X] T004 [US1] Implement failing regression test assertions in `tests/test-exam-scroll-lock.mjs` verifying that after `finishExam()` (both manual finish and time-up), `<html>` lacks `in-exam`, `<body>` lacks `exam-mode`, and scrolling Results down produces positive `window.scrollY` on Desktop (1440×900) and Mobile (390×844)

### Implementation for User Story 1

- [X] T005 [US1] Implement explicit cleanup of `document.documentElement.classList.remove('in-exam')` and `unlockExamOrientation()` inside `finishExam()` in `app.js`
- [X] T006 [US1] Run User Story 1 regression verification via `node tests/test-exam-scroll-lock.mjs`, verify `scrollY > 0` on Results, and save screenshot artifacts `results-desktop.png` and `results-mobile.png`

**Checkpoint**: At this point, User Story 1 is fully functional and independently verified.

---

## Phase 4: User Story 2 - Comprehensive Scrolling Across All 40 Review Questions (Priority: P1)

**Goal**: Memastikan seluruh 40 kartu pembahasan soal pada halaman Review Answers dapat di-scroll dari nomor 1 hingga nomor terakhir (#40) tanpa terpotong atau terhenti di tengah jalan.

**Independent Test**: Buka Review Answers dari ujian yang selesai, lalu lakukan scroll ke bawah hingga kartu soal ke-40 (`.zen-review-item:nth-of-type(40)`) masuk ke area viewport dengan nilai `window.scrollY > 1500px`.

### Tests for User Story 2

- [X] T007 [US2] Add Review Answers scroll assertions in `tests/test-exam-scroll-lock.mjs` to navigate from Results to Review, scroll down the question list, and assert that the 40th question card is present and visible in viewport

### Implementation for User Story 2

- [X] T008 [US2] Verify and ensure `.zen-result-page` and `.zen-review-section` flow naturally without viewport height clipping during filter changes ('all', 'wrong', 'blank', 'correct') in `app.js`
- [X] T009 [US2] Run User Story 2 regression verification via `node tests/test-exam-scroll-lock.mjs`, confirm scroll reachability to question #40, and save screenshot artifacts `review-q40-desktop.png` and `review-q40-mobile.png`

**Checkpoint**: User Stories 1 and 2 are fully functional and verifiable independently.

---

## Phase 5: User Story 3 - Robust CBT Teardown & Transition Lifecycle (Priority: P2)

**Goal**: Menjamin isolasi scroll tetap 100% aktif selama ujian berlangsung, mencegah kebocoran kelas saat navigasi bolak-balik (Results ↔ Beranda/Bank/Riwayat), dan memastikan sesi ujian baru tidak terinfeksi residu scroll lock.

**Independent Test**: Uji siklus hidup penuh: (1) saat ujian aktif, scroll root terkunci; (2) saat keluar ke Beranda/Bank Soal, class exam bersih; (3) saat mulai ujian baru, scroll lock aktif kembali; (4) saat selesai lagi, scroll lock terlepas kembali.

### Implementation for User Story 3

- [X] T010 [US3] Implement defensive invariant guard in central router `render()` function in `app.js`: if `state.page !== 'exam'`, execute `document.documentElement.classList.remove('in-exam')`, `document.body.classList.remove('exam-mode')`, and `unlockExamOrientation()`
- [X] T011 [US3] Add transition lifecycle test scenarios in `tests/test-exam-scroll-lock.mjs` verifying: (a) active CBT scroll protection (`html.in-exam: true`, `body.exam-mode: true`), (b) zero residual classes when navigating to non-exam pages, and (c) repeated exam session immunity
- [X] T012 [US3] Run User Story 3 regression verification via `node tests/test-exam-scroll-lock.mjs` and confirm all lifecycle transitions succeed

**Checkpoint**: All three user stories are functional and fully guarded against regressions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Menjalankan validasi menyeluruh lintas viewport dan regresi komparatif terhadap seluruh fitur yang sudah ada

- [X] T013 Execute full suite in `tests/test-exam-scroll-lock.mjs` across both Desktop (1440×900) and Mobile (390×844) viewports and verify 0 failures
- [X] T014 Execute existing regression test suites to guarantee zero regression: `node tests/verify-cache-governance.js`, `node tests/test-cache-cleanup-scenarios.js`, and `node tests/test-bank-soal-performance.mjs`
- [X] T015 Verify that all visual artifact screenshots (`results-desktop.png`, `results-mobile.png`, `review-q40-desktop.png`, `review-q40-mobile.png`) are properly generated and saved in the artifact directory

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Tanpa dependensi — dapat dimulai segera.
- **Foundational (Phase 2)**: Bergantung pada Phase 1 — memblokir pelaksanaan pengujian user story.
- **User Story 1 (Phase 3)**: Bergantung pada Phase 2 — MVP inti pelepasan scroll lock pada Results.
- **User Story 2 (Phase 4)**: Bergantung pada User Story 1 — memvalidasi scroll pada Review Answers hingga soal #40.
- **User Story 3 (Phase 5)**: Bergantung pada User Story 1 & 2 — menegakkan invarian defensif pada router `render()`.
- **Polish (Phase 6)**: Bergantung pada penyelesaian seluruh User Story — verifikasi akhir multi-viewport dan zero regression.

### User Story Dependencies
- **User Story 1 (P1)**: Independen — fokus pada pembersihan di `finishExam()` dan scroll pada Results.
- **User Story 2 (P1)**: Membutuhkan penyelesaian ujian dari US1 untuk masuk ke Review Answers.
- **User Story 3 (P2)**: Menambahkan guard router di `render()` dan memverifikasi proteksi CBT aktif serta transisi berulang.

---

## Parallel Opportunities

- **T002** dan **T001** dapat diinisialisasi secara paralel.
- Pembuatan test script assertions (**T004**, **T007**, **T011**) dilakukan sebelum implementasi kode pada file `app.js`.

---

## Implementation Strategy

### MVP First (User Story 1)
1. Inisialisasi test harness CDP (`tests/test-exam-scroll-lock.mjs`).
2. Terapkan pembersihan `document.documentElement.classList.remove('in-exam')` dan `unlockExamOrientation()` di `finishExam()` (`app.js`).
3. Validasi bahwa halaman Results sudah bisa di-scroll (`scrollY > 0`) pada desktop dan mobile.

### Incremental Delivery
1. US1 selesai → Peserta dapat membaca Results scorecard secara penuh.
2. Tambahkan US2 → Peserta dapat membaca seluruh 40 soal di Review Answers sampai tuntas.
3. Tambahkan US3 → Router memiliki proteksi invarian di `render()`, menjamin zero state leakages di seluruh rute SPA.
4. Final Polish → Verifikasi zero regression terhadap PWA Cache Governance dan Bank Soal Lazy Loading.
