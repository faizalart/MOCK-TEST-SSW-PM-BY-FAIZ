# SSW PM Mock Test by Faiz — 特定技能1号・飲食料品製造業 (食品製造)

Simulator ujian CBT independen **SSW PM Mock Test by Faiz** khusus untuk persiapan ujian keterampilan **特定技能1号・飲食料品製造業 (Pengolahan Makanan / 食品製造)**. Seluruh bank soal, anotasi furigana (`<ruby><rt>`), ilustrasi gambar, pengaturan layar ujian, dan riwayat hasil disimpan secara lokal di perangkat Anda menggunakan IndexedDB dan `localStorage` tanpa ketergantungan server eksternal maupun CDN.

## Fitur Utama

1. **Khusus SSW PM (特定技能1号・飲食料品製造業)**
   - Fokus 100% pada simulasi ujian SSW Pengolahan Makanan tanpa pencampuran struktur/bagian JFT-Basic.
   - Navigasi ringkas 5 menu utama: **Beranda**, **Mulai Mock Test**, **Bank Soal**, **Riwayat Hasil**, dan **Backup & Data**.

2. **Dua Paket Bank Soal SSW PM Terintegrasi (Total 80 Soal)**
   - **Paket 1 (Utama): `Kunci Soal Ujian 1 — CBTP Gino1` (40 Soal)**
     - Diekstrak dari dokumen sumber `Kunci Soal Ujian 1.pdf` (Halaman 1–9, Câu 1–40).
     - Teks bahasa Jepang asli dipertahankan secara presisi lengkap dengan rekonstruksi furigana `<ruby><rt>...</rt></ruby>` pada pertanyaan, instruksi, serta pilihan jawaban A, B, dan C.
     - Kunci jawaban terverifikasi 100% mengikuti penanda centang hijau pada PDF.
     - 6 ilustrasi keselamatan kerja dan prosedur mesin (`ssw-pm-kunci-ujian-1-q033.png`, `q034.png`, `q037.png`, `q038.png`, `q039.png`, `q040.png`) telah dipisahkan/di-crop bersih dari objek asli PDF tanpa teks soal/watermark.
   - **Paket 2 (Tambahan): `Latsol Tipe 2 SSW PM — Đề 7 Thực Phẩm GINO1` (40 Soal)**
     - Paket latihan SSW PM Tipe 2 tetap dipertahankan secara terpisah dan tidak tertimpa.

3. **Layar Ujian CBT SSW PM & Pengaturan Interaktif**
   - **Timer Tepat di Tengah Header (`SISA WAKTU UJIAN`)**: Menggunakan layout CSS Grid 3 kolom seimbang sehingga posisi timer selalu berada tepat di titik tengah horizontal layar, berbasis *deadline* absolut (tetap akurat saat halaman di-refresh), dengan durasi default **70 menit**.
   - **Full Screen Mode (`F` & Tombol Ikon)**: Menggunakan Browser Fullscreen API. Tekan tombol **`F`** pada keyboard saat ujian berlangsung (aman, tidak mengintervensi saat mengetik di kolom input/editor) atau klik tombol **Full Screen** pada header/footer ujian. Tekan **`Esc`** untuk keluar.
   - **Toggle Furigana (`ふりがな表示` ON/OFF)**: Tampilkan atau sembunyikan seluruh anotasi bacaan furigana (`<rt>`) secara instan pada soal dan pilihan jawaban A, B, C tanpa menghilangkan kanji maupun hiragana kalimat asli.
   - **Slider Ukuran Font Soal & Jawaban**: Panel **Pengaturan Ujian (`⚙`)** menyediakan dua slider interaktif terpisah:
     - **Ukuran Teks Soal**: `18 px` – `36 px` (default `22 px`).
     - **Ukuran Teks Jawaban (A, B, C)**: `16 px` – `30 px` (default `17 px`).
     - Perubahan langsung berlaku secara *real-time* tanpa reload halaman dan tersimpan otomatis di `localStorage`.
   - **Navigasi Soal Global (`1 — 2 — ... — 40`)**: Berpindah bebas antarsoal dengan indikator status: *Belum dijawab*, *Sudah dijawab*, *Sedang dibuka*, dan *Ditandai untuk ditinjau (`⚑`)*.
   - **Konfirmasi `SELESAIKAN UJIAN` & Skoring SSW PM**: Menampilkan ringkasan jumlah soal, jumlah terjawab, dan jumlah belum dijawab sebelum mengakhiri ujian. Hasil menampilkan jumlah benar dari 40 soal, persentase jawaban benar, skor bobot PDF (`3,75 poin × benar` dari maksimal `150`), waktu pengerjaan, dan daftar review seluruh soal.

## Cara Menjalankan secara Lokal

1. Ekstrak file ZIP proyek.
2. Buka terminal di dalam direktori proyek (`ssw-pm-mock-test`).
3. Jalankan server statis lokal:
   ```bash
   python3 -m http.server 4176
   ```
4. Buka browser modern (Chrome, Edge, Firefox, Safari) ke alamat `http://localhost:4176`.
5. Aplikasi juga dilengkapi fallback seed lokal (`js/seed-data.js`) dan Service Worker (`sw.js`) untuk penggunaan offline penuh.
