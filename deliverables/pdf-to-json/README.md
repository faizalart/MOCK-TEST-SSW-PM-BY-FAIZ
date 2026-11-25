# `pdf-to-json` — Gemini Web Agent Skill

Paket Skill ini dirancang untuk diunggah ke **Gemini Web (Gemini Skills)** agar dapat mengonversi berbagai dokumen PDF modul belajar atau soal ujian SSW (特定技能1号) menjadi **integration bundle** (paket JSON soal, 3 file delta Kotoba tersinkronisasi, aset PNG ter-crop, dan laporan audit QA) yang kompatibel dengan website Mock Test SSW PM.

---

## Struktur Paket Skill

Root arsip ZIP (`pdf-to-json-gemini-skill.zip`) berisi struktur berikut tanpa lapisan folder induk tambahan:

```text
├── SKILL.md
├── README.md
├── INTEGRATION-GUIDE.md
├── FINAL-ACCEPTANCE-REPORT.md
├── validators/
│   ├── validate_kotoba_completeness.py
│   └── test_kotoba_validator_regression.py
├── references/
│   ├── website-json-schema.md
│   ├── gold-standard-nguyen-example.json
│   ├── gold-standard-kunci-ujian-16-example.json
│   ├── kotoba-standard.md
│   ├── image-processing-standard.md
│   ├── question-generation-standard.md
│   ├── academic-validation-standard.md
│   ├── calculation-validation-standard.md
│   └── output-package-standard.md
└── examples/
    ├── example-question.json
    └── example-assets/
        ├── nguyen01-q032.png
        ├── nguyen01-q039-option-a.png
        ├── nguyen01-q039-option-b.png
        └── nguyen01-q039-option-c.png
```

---

## Panduan Penggunaan di Gemini Web (Gemini Skills)

### 1. Cara Upload Skill ke Gemini Web
1. Buka **`gemini.google.com`** di browser Anda.
2. Buka menu **Customize** di bilah samping / pengaturan.
3. Pilih **Skills**.
4. Klik **Create**, lalu pilih **Upload**.
5. Unggah file **`pdf-to-json-gemini-skill.zip`** (atau unggah folder yang berisi `SKILL.md` langsung di root).
6. Tinjau instruksi pada `SKILL.md` serta seluruh file di folder `references/` dan `examples/` untuk memastikan semuanya terbaca dengan benar.
7. Klik **Create** untuk menyimpan Skill **`pdf-to-json`**.

### 2. Cara Memanggil Skill dalam Chat
1. Buka percakapan baru di Gemini Web.
2. Aktifkan / panggil Skill **`pdf-to-json`** melalui pemilih Skills di kolom input chat.

### 3. Cara Mengunggah PDF
Klik tombol **+** / **Upload File** di kolom chat, lalu unggah dokumen PDF sumber Anda (misalnya modul resmi **OTAFF SSW Pengolahan Makanan v5.1** atau PDF soal ujian SSW bidang lainnya).

### 4. Contoh Memberikan Parameter Pekerjaan
Setelah PDF terunggah, kirim parameter pekerjaan Anda. Contoh untuk menghasilkan **200 soal (5 paket × 40 soal)** dari **OTAFF SSW PM Modul 5.1 (Bab 1–3)**:

```yaml
Jalankan skill pdf-to-json pada PDF terlampir dengan parameter berikut:

industry: SSW_PENGOLAHAN_MAKANAN
source_module: OTAFF_SSW_PM
module_version: "5.1"
chapters:
  - 1
  - 2
  - 3
package_count: 5
questions_per_package: 40
total_questions: 200
language: Japanese
furigana: required
indonesian_translation: required
kotoba_extraction: comprehensive
question_images: cropped_assets
option_images: separate_files
output: ZIP
```

*(Untuk bidang SSW lain seperti Konstruksi, Restoran, atau Kaigo, ubah `industry`, `source_module`, `chapters`, `package_count`, dan `questions_per_package` sesuai kebutuhan.)*

### 5. Cara Memeriksa Hasil
Sebelum mengintegrasikan hasil ke website, selalu periksa:
1. **`generation-audit-report.md`:** Cek jumlah soal, distribusi bab, status cakupan Kotoba, serta daftar item **`REVIEW_REQUIRED`** (kunci jawaban yang butuh pemeriksaan ulang) atau **`NEEDS_IMAGE_PROCESSING`** (gambar yang belum ter-crop).
2. **File JSON Paket (`<pkg-XX>.json`):** Pastikan `setId` dan `setName` konsisten, `totalQuestions === questions.length`, dan terjemahan Indonesia terisi lengkap.
3. **File Delta Kotoba:** Pastikan ketiga file (`sharedKotobaDictionary-delta.json`, `kotobaMapping-delta.json`, `kotoba-tambahan-delta.json`) tersedia dan saling sinkron.

### 6. Cara Mengunduh Hasil ZIP (Jika File Generation Aktif)
- Jika sesi Gemini Web Anda mendukung pembuatan file ZIP, klik tautan unduhan **`.zip`** yang diberikan oleh Gemini dan simpan ke folder `_incoming/` di workspace lokal Anda.
- Jika fitur binary ZIP tidak tersedia pada sesi tersebut, unduh atau salin file JSON dan laporan yang dihasilkan Gemini secara terpisah.

### 7. Cara Menangani Aset Gambar yang Belum Diproses (`NEEDS_IMAGE_PROCESSING`)
Jika Gemini menandai beberapa soal sebagai **`NEEDS_IMAGE_PROCESSING`** (karena keterbatasan crop gambar presisi di sesi browser):
1. Baca daftar halaman PDF dan deskripsi crop pada **`generation-audit-report.md`**.
2. Ekstrak/crop gambar secara presisi (Kategori 1 untuk diagram soal, Kategori 2 terpisah per opsi A–D; **dilarang** screenshot 1 halaman penuh) menggunakan alat lokal atau serahkan daftar tersebut ke **Antigravity IDE** untuk di-crop secara otomatis dari PDF asli.
3. Ikuti panduan penggabungan data di **[INTEGRATION-GUIDE.md](INTEGRATION-GUIDE.md)** sebelum menjalankan tes di website lokal.
