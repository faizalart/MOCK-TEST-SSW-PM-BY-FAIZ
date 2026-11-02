# Laporan Pengujian & Validasi — SSW PM Mock Test by Faiz

## 1. Ringkasan Refactoring (JFT → SSW PM Mock Test by Faiz)
- **Identitas & Branding**: Seluruh elemen aplikasi (`index.html`, `manifest.webmanifest`, `sw.js`, `js/app.js`, `js/utils.js`, `js/db.js`, `js/archive.js`, `README.md`) telah diperbarui menjadi **SSW PM MOCK TEST BY FAIZ — 特定技能1号・飲食料品製造業 (食品製造)**.
- **Penghapusan Sistem JFT-Basic**:
  - Seluruh bagian `MOJIGOI`, `HYOUGEN`, `CHOUKAI`, dan `DOKKAI` dihapus dari kode dan antarmuka.
  - Halaman `Tema & sesi` dan `Bacaan DOKKAI` dihapus; navigasi disederhanakan menjadi 5 menu: **Beranda**, **Mulai Mock Test**, **Bank Soal**, **Riwayat Hasil**, dan **Backup & Data**.
  - Aturan penguncian bagian (*section locking*), tombol `Finish Section`, label `Section Time Remaining`, tombol `Your Language 1` / `Your Language 2`, aturan batas 2x audio JFT, soal demo JFT, dan tabel konversi level JFT-Basic telah dihapus sepenuhnya.
- **Pelestarian Data Lama**: Paket soal SSW PM lama (`Latsol Tipe 2 SSW PM — Đề 7 Thực Phẩm GINO1`, 40 soal) tetap dipertahankan secara utuh dan terpisah dari paket PDF baru.

## 2. Hasil Ekstraksi & Validasi 40 Soal PDF (`Kunci Soal Ujian 1 — CBTP Gino1`)
- **Sumber**: `Kunci Soal Ujian 1.pdf` (Halaman 1–9, Câu 1 s.d. Câu 40).
- **ID Paket**: `ssw-pm-kunci-ujian-1` (`Kunci Soal Ujian 1 — CBTP Gino1`).
- **Total Soal Terimpor**: **40 soal** (`kunci1-q001` s.d. `kunci1-q040`), masing-masing memiliki tepat 3 pilihan (`A`, `B`, `C`), anotasi furigana `<ruby><rt>...</rt></ruby>`, dan bobot `3,75` poin (skor maksimum `150`).
- **Ilustrasi Soal yang Diekstrak (6 File Gambar Asli Tanpa Teks Soal/Watermark)**:
  1. **Soal 33 (Hal. 6)**: `assets/questions/ssw-pm-kunci-ujian-1-q033.png` (378×258 px) — Pekerja di atas tangga lipat (`脚立`) mengencangkan baut langit-langit dengan kunci pas (`レンチ`).
  2. **Soal 34 (Hal. 6)**: `assets/questions/ssw-pm-kunci-ujian-1-q034.png` (421×335 px) — Pekerja di bak truk saat *flexible container bag* (`フレコンバッグ`) diangkat dengan crane.
  3. **Soal 37 (Hal. 7)**: `assets/questions/ssw-pm-kunci-ujian-1-q037.png` (488×560 px) — Pekerja membersihkan konveyor sabuk yang sedang bergerak dengan kain lap.
  4. **Soal 38 (Hal. 7)**: `assets/questions/ssw-pm-kunci-ujian-1-q038.png` (508×542 px) — Pekerja terpeleset bunga es di lantai *freezer* (`冷凍庫`).
  5. **Soal 39 (Hal. 8)**: `assets/questions/ssw-pm-kunci-ujian-1-q039.png` (543×497 px) — Pekerja berjalan di atas *roller conveyor*.
  6. **Soal 40 (Hal. 9)**: `assets/questions/ssw-pm-kunci-ujian-1-q040.png` (584×542 px) — Pekerja memotong daging pada mesin *slicer* tanpa penutup pelindung.

### Tabel Validasi Kunci Jawaban 40 Soal (Sesuai Centang Hijau PDF)

| No | ID Soal | Hal. PDF | Kunci PDF | Ilustrasi | Status Validasi |
| :-: | :--- | :-: | :-: | :--- | :-: |
| 1 | `kunci1-q001` | 1 | **B** | — | Terverifikasi |
| 2 | `kunci1-q002` | 1 | **B** | — | Terverifikasi |
| 3 | `kunci1-q003` | 1 | **A** | — | Terverifikasi |
| 4 | `kunci1-q004` | 1 | **C** | — | Terverifikasi |
| 5 | `kunci1-q005` | 1 | **B** | — | Terverifikasi |
| 6 | `kunci1-q006` | 1 | **A** | — | Terverifikasi |
| 7 | `kunci1-q007` | 2 | **C** | — | Terverifikasi |
| 8 | `kunci1-q008` | 2 | **C** | — | Terverifikasi |
| 9 | `kunci1-q009` | 2 | **A** | — | Terverifikasi |
| 10 | `kunci1-q010` | 2 | **B** | — | Terverifikasi |
| 11 | `kunci1-q011` | 2 | **B** | — | Terverifikasi |
| 12 | `kunci1-q012` | 2 | **C** | — | Terverifikasi |
| 13 | `kunci1-q013` | 2–3 | **B** | — | Terverifikasi |
| 14 | `kunci1-q014` | 3 | **A** | — | Terverifikasi |
| 15 | `kunci1-q015` | 3 | **C** | — | Terverifikasi |
| 16 | `kunci1-q016` | 3 | **B** | — | Terverifikasi |
| 17 | `kunci1-q017` | 3 | **C** | — | Terverifikasi |
| 18 | `kunci1-q018` | 3 | **C** | — | Terverifikasi |
| 19 | `kunci1-q019` | 3 | **A** | — | Terverifikasi |
| 20 | `kunci1-q020` | 3–4 | **B** | — | Terverifikasi |
| 21 | `kunci1-q021` | 4 | **C** | — | Terverifikasi |
| 22 | `kunci1-q022` | 4 | **B** | — | Terverifikasi |
| 23 | `kunci1-q023` | 4 | **B** | — | Terverifikasi |
| 24 | `kunci1-q024` | 4 | **A** | — | Terverifikasi |
| 25 | `kunci1-q025` | 4 | **B** | — | Terverifikasi |
| 26 | `kunci1-q026` | 4–5 | **B** | — | Terverifikasi |
| 27 | `kunci1-q027` | 5 | **C** | — | Terverifikasi |
| 28 | `kunci1-q028` | 5 | **B** | — | Terverifikasi |
| 29 | `kunci1-q029` | 5 | **A** | — | Terverifikasi |
| 30 | `kunci1-q030` | 5 | **C** | — | Terverifikasi |
| 31 | `kunci1-q031` | 5 | **A** | — | Terverifikasi |
| 32 | `kunci1-q032` | 5 | **B** | — | Terverifikasi |
| 33 | `kunci1-q033` | 5–6 | **A** | `ssw-pm-kunci-ujian-1-q033.png` | Terverifikasi |
| 34 | `kunci1-q034` | 6 | **A** | `ssw-pm-kunci-ujian-1-q034.png` | Terverifikasi |
| 35 | `kunci1-q035` | 6 | **A** | — | Terverifikasi |
| 36 | `kunci1-q036` | 6–7 | **A** | — | Terverifikasi |
| 37 | `kunci1-q037` | 7 | **B** | `ssw-pm-kunci-ujian-1-q037.png` | Terverifikasi |
| 38 | `kunci1-q038` | 7–8 | **C** | `ssw-pm-kunci-ujian-1-q038.png` | Terverifikasi |
| 39 | `kunci1-q039` | 8 | **A** | `ssw-pm-kunci-ujian-1-q039.png` | Terverifikasi |
| 40 | `kunci1-q040` | 8–9 | **C** | `ssw-pm-kunci-ujian-1-q040.png` | Terverifikasi |

## 3. Hasil Pengujian Fitur Otomatis (Headless Chromium E2E)
- **Posisi Timer Header**: `headerCenter = 720.0px`, `clockCenter = 720.0px` (`diffPx = 0.0px` pada viewport 1440×900), label `SISA WAKTU UJIAN`, durasi default `70:00`.
- **Toggle Furigana (`ふりがな表示`)**: Saat `ON`, seluruh `<ruby><rt>` tampil proporsional di atas kanji; saat `OFF`, `getComputedStyle(rt).display === 'none'` dan kanji utama tetap utuh.
- **Slider Ukuran Teks Soal & Jawaban**: Menggeser slider soal ke `30px` dan jawaban ke `24px` mengubah ukuran font secara langsung tanpa reload dan tersimpan di `localStorage`.
- **Full Screen Mode**: Mendukung tombol ikon header/footer dan shortcut keyboard `F` (diabaikan saat fokus berada di dalam `input`, `textarea`, `select`, atau `contenteditable`).
- **Penyelesaian & Penilaian Ujian**: Tombol `SELESAIKAN UJIAN` menampilkan modal konfirmasi berisi total soal, terjawab, dan belum dijawab, diikuti perhitungan skor otomatis dan daftar review seluruh 40 soal.
