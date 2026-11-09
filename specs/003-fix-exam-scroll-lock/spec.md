# Feature Specification: Fix Exam Scroll Lock on Finished, Results, and Review Pages

**Feature Branch**: `fix/exam-scroll-lock`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "Perbaiki bug scroll lock pada halaman Exam Finished, Results, dan Review Answers setelah ujian selesai. Investigasi root cause terlebih dahulu. Scrolling harus berfungsi normal pada desktop dan mobile. Jangan mengubah mekanisme CBT, timer, penilaian, atau fitur lain. Buat spesifikasi dan acceptance criteria. Jangan implementasikan kode dulu."

## Root Cause Investigation Summary

Investigasi mendalam pada kode sumber mengonfirmasi akar penyebab bug penguncian scroll:
1. **Pemicu Scroll Lock di CSS**:
   Pada `QUESTION-EDITOR-UPDATES.css` (baris 170–178), terdapat aturan:
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
2. **Lifecycle Cleanup Tidak Lengkap di JavaScript**:
   - Ketika ujian CBT aktif dimulai di `renderExam()` (`app.js`), sistem mengeksekusi:
     ```javascript
     document.body.classList.add('exam-mode');
     document.documentElement.classList.add('in-exam');
     ```
   - Namun ketika ujian berakhir melalui fungsi `finishExam()` (`app.js`):
     ```javascript
     state.page = 'result';
     document.body.classList.remove('exam-mode');
     render();
     ```
     Sistem **hanya menghapus** `exam-mode` dari `document.body`, tetapi **lalai menghapus** kelas `in-exam` dari `document.documentElement` (`<html>`).
3. **Akibat**:
   Karena `<html>` masih memiliki kelas `in-exam`, selektor `html.in-exam` tetap aktif 100%. Akibatnya, `<html>` tetap terikat pada `position: fixed !important; inset: 0 !important; overflow: hidden !important; height: 100% !important;`, sehingga seluruh interaksi scroll (mouse wheel, trackpad, touch swipe, scrollbar, arrow keys) lumpuh total pada halaman Hasil dan Review Ujian.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unrestricted Scrolling on Exam Results Scorecard (Priority: P1)

Sebagai peserta ujian yang baru saja menyelesaikan simulasi ujian CBT (baik melalui tombol "Selesaikan Ujian" maupun karena waktu habis otomatis), saya ingin dapat menggulir (scroll) halaman Hasil Ujian (Results) secara lancar ke atas dan ke bawah agar saya dapat membaca ringkasan skor, status kelulusan, rincian per kategori, dan mengakses tombol review tanpa terkunci atau terpotong.

**Why this priority**: Halaman Hasil adalah pintu gerbang utama evaluasi ujian. Jika halaman terkunci tidak bisa di-scroll, peserta tidak dapat melihat hasil lengkap simulasi ujian yang telah dikerjakan.

**Independent Test**: Dapat diuji secara mandiri via script otomasi `tests/test-exam-scroll-lock.mjs` dengan menyelesaikan 1 sesi ujian CBT, lalu melakukan verifikasi bahwa `window.scrollY` dapat bergerak bertambah (`scrollY > 0`) saat digulir ke bawah, dan kembali ke 0 saat digulir ke atas.

**Acceptance Scenarios**:

1. **Given** peserta berada dalam sesi ujian CBT aktif, **When** peserta menekan tombol "Selesaikan Ujian" dan mengonfirmasi dialog penyelesaian, **Then** sistem menampilkan halaman Results dan seluruh dokumen (`window`, `html`, `body`) dapat digulir bebas dari puncak kartu skor hingga bagian terbawah.
2. **Given** peserta berada dalam sesi ujian CBT aktif berbatas waktu, **When** waktu ujian habis (timer = 00:00), **Then** sistem otomatis mengakhiri ujian ke halaman Results dan scrolling halaman berfungsi bebas tanpa sisa scroll lock.
3. **Given** peserta membuka halaman Results pada perangkat mobile (390×844) atau desktop (1440×900), **When** peserta melakukan gestur swipe vertikal atau memutar roda mouse, **Then** halaman bergerak vertikal secara responsif tanpa tertahan `position: fixed`.

---

### User Story 2 - Comprehensive Scrolling Across All 40 Review Questions (Priority: P1)

Sebagai peserta ujian yang sedang meninjau jawaban pada Review Answers, saya ingin dapat menggulir daftar pembahasan dari soal nomor 1 hingga soal terakhir (nomor 40) secara mulus sehingga saya dapat mempelajari seluruh kunci jawaban, pilihan saya, dan penjelasan rinci tanpa hambatan viewport.

**Why this priority**: Tujuan utama simulasi ujian SSW PM adalah pembelajaran melalui pembahasan jawaban. Kegagalan scroll menyebabkan peserta tidak dapat mengakses soal nomor berikutnya di bawah lipatan layar (below the fold).

**Independent Test**: Dapat diuji secara independen via script otomasi `tests/test-exam-scroll-lock.mjs` dengan membuka Review Answers dari ujian yang selesai, lalu menggulir hingga elemen kartu soal terakhir (#40) masuk ke viewport dan mencatat nilai `window.scrollY > 1500px`.

**Acceptance Scenarios**:

1. **Given** peserta membuka Review Answers, **When** peserta menggulir ke bawah, **Then** peserta dapat membaca seluruh kartu soal hingga soal nomor 40 tanpa terhenti atau terpotong.
2. **Given** peserta mengubah filter review (misalnya filter "Salah Saja" atau "Kosong Saja"), **When** daftar soal diperbarui, **Then** scroll container tetap bebas digulir sesuai tinggi konten baru.
3. **Given** peserta membuka atau menutup penjelasan detail pada kartu soal, **When** tinggi dokumen bertambah dinamis, **Then** scrolling tetap mengalir secara alami tanpa layout break.

---

### User Story 3 - Robust CBT Teardown & Transition Lifecycle (Priority: P2)

Sebagai pengguna yang berpindah-pindah antar-halaman aplikasi (misalnya dari Hasil Ujian ke Beranda, Bank Soal, Riwayat, atau memulai ujian baru), saya ingin seluruh status scroll lock, orientasi layar, dan atribut viewport CBT dibersihkan secara tuntas dan konsisten di setiap titik transisi, sehingga tidak terjadi kebocoran status scroll lock ke halaman lain.

**Why this priority**: Menjamin stabilitas Single Page Application (SPA) jangka panjang agar bug tidak muncul kembali saat navigasi bolak-balik atau saat memulai sesi ujian baru.

**Independent Test**: Dapat diuji via script otomasi `tests/test-exam-scroll-lock.mjs` dengan berpindah dari Results ke Bank Soal, lalu ke Riwayat, lalu membuka kembali hasil lama dari Riwayat, dan memastikan tidak ada satupun halaman yang mewarisi kelas `in-exam` atau `exam-mode`.

**Acceptance Scenarios**:

1. **Given** pengguna berada di halaman Results, **When** pengguna menavigasi ke halaman Beranda atau Bank Soal, **Then** `document.documentElement` tidak memiliki kelas `in-exam` dan `document.body` tidak memiliki kelas `exam-mode`.
2. **Given** pengguna membuka riwayat ujian masa lalu melalui menu Riwayat, **When** halaman detail hasil dimuat, **Then** halaman dapat di-scroll normal dari atas ke bawah.
3. **Given** pengguna memulai sesi ujian baru setelah menyelesaikan ujian sebelumnya, **When** ujian baru dimulai, **Then** proteksi scroll CBT aktif kembali secara tepat, dan ketika selesai, kembali dibersihkan secara tuntas.

---

### Edge Cases

- **Ujian selesai dalam mode Layar Penuh (Fullscreen)**: Jika peserta mengakhiri ujian saat mode layar penuh aktif, sistem harus memastikan status fullscreen dan orientasi layar dinormalkan sehingga scrolling pada halaman hasil tidak terhambat oleh batas fullscreen browser.
- **Transisi cepat saat dialog konfirmasi**: Jika pengguna mengonfirmasi selesai dengan cepat, pembersihan kelas `in-exam` tidak boleh tertunda oleh operasi penyimpanan asynchronous IndexedDB.
- **Restorasi sesi terganggu saat boot aplikasi**: Jika aplikasi dimuat ulang saat terdapat sesi ujian yang kedaluwarsa, transisi otomatis ke halaman hasil harus tetap membersihkan kelas `in-exam`.
- **Perangkat layar sentuh dengan dynamic browser bar**: Pada mobile Safari / Chrome, pergeseran tinggi viewport dinamis tidak boleh meninggalkan ruang kosong atau clipping saat scroll lock dilepas.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem HARUS menghapus kelas `in-exam` dari `document.documentElement` (`<html>`) dan kelas `exam-mode` dari `document.body` secara deterministik setiap kali ujian CBT berakhir (baik melalui `finishExam()` manual maupun otomatis waktu habis).
- **FR-002**: Sistem HARUS memastikan fungsi perutean umum (`render()`) menegakkan aturan invarian: jika halaman aktif bukan `exam` (`state.page !== 'exam'`), maka `<html>` dan `<body>` tidak boleh memiliki kelas `in-exam` atau `exam-mode`.
- **FR-003**: Sistem HARUS memulihkan kemampuan scrolling dokumen standar (`overflow: visible/auto`, `position: static`, `height: auto`) pada `window`, `<html>`, dan `<body>` saat menampilkan halaman `result` dan `review`.
- **FR-004**: Sistem HARUS melepaskan kunci orientasi layar (`unlockExamOrientation()`) saat keluar dari lingkungan CBT.
- **FR-005**: Sistem HARUS mempertahankan proteksi penguncian scroll penuh pada lingkungan CBT saat ujian sedang AKTIF (`renderExam()`) untuk mencegah dislokasi layout soal dan bilah navigasi bawah CBT.
- **FR-006**: Sistem HARUS mendukung scrolling penuh melalui seluruh mekanisme input standar: mouse wheel, trackpad, touch swipe vertikal, scrollbar, dan tombol navigasi keyboard (Page Down/Up, Arrow Down/Up).
- **FR-007**: Sistem TIDAK BOLEH mengubah logika timer ujian, perhitungan skor berbobot, status kelulusan, struktur data bank soal, atau Service Worker PWA cache governance.

### Key Entities

- **CBT Lifecycle State**: Status siklus hidup ujian yang menentukan mode tampilan (`exam` vs `result`/`review`/non-exam), mengontrol apakah isolasi viewport (`in-exam`, `exam-mode`) aktif atau dinonaktifkan.
- **Document Viewport Context**: Elemen akar (`html`, `body`, `#app`, `#view`) yang mengelola aliran tata letak dan kemampuan scrolling vertikal halaman.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **100% Bebas Scroll Lock**: Pada pengujian browser otomatis (CDP), halaman Hasil Ujian (`result`) dan Tinjauan Jawaban (`review`) mencapai perpindahan `window.scrollY > 0` saat digulir ke bawah, membuktikan pelepasan scroll lock yang berhasil.
- **SC-002**: **Jangkauan Penuh 40 Soal**: Pengguna dapat menggulir hingga kartu soal ke-40 pada halaman Review Answers tanpa terhenti, terpotong, atau mengalami rubber-band snap.
- **SC-003**: **Zero Residual Classes**: Nilai `document.documentElement.classList.contains('in-exam')` bernilai `false` dan `document.body.classList.contains('exam-mode')` bernilai `false` pada setiap halaman di luar ujian aktif.
- **SC-004**: **Multi-Viewport Parity**: Scrolling vertikal terverifikasi lancar pada Desktop (1440×900) dan Mobile (390×844) dengan bukti tangkapan layar di bagian atas dan bagian bawah halaman.
- **SC-005**: **Zero Regression**: Seluruh rangkaian pengujian yang ada (`tests/verify-cache-governance.js`, `tests/test-cache-cleanup-scenarios.js`, dan `tests/test-bank-soal-performance.mjs`) tetap lulus 100%.

---

## Assumptions

- **A-001**: Masalah utama murni bersumber dari kelalaian penghapusan kelas `in-exam` pada elemen root `<html>` di `app.js` saat `finishExam()` dipanggil, yang memicu aturan CSS `position: fixed !important; overflow: hidden !important;` pada `QUESTION-EDITOR-UPDATES.css`.
- **A-002**: Komponen `.zen-result-page` dan `.zen-review-section` pada `ZEN-PAGES.css` sudah dirancang mengalir secara alami (flow layout) dan tidak memiliki batasan ketinggian tetap atau `overflow: hidden` internal yang memblokir scrolling.
- **A-003**: Perbaikan cukup dilakukan pada lifecycle pengelolaan kelas di `app.js` tanpa perlu merombak struktur HTML atau CSS yang sudah ada.
- **A-004**: **Scope Boundary**: Navigasi swipe tab horizontal berada di luar cakupan Feature 003 dan tidak diimplementasikan pada fitur ini agar scope perbaikan scroll lock tetap minimal dan terfokus.
- **A-005**: **Fullscreen Lifecycle**: Mode Layar Penuh (Fullscreen) merupakan opsi tampilan pengguna yang tidak mengunci scroll secara mandiri. Saat ujian berakhir, sistem tidak memanggil `document.exitFullscreen()` secara paksa (untuk menghindari penolakan izin browser tanpa gestur aktif), melainkan menormalkan orientasi layar (`unlockExamOrientation()`) dan memperbarui indikator fullscreen UI (`updateFullscreenUI()`).
