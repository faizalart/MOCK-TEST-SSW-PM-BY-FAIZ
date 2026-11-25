# Generation Audit Report — 10 Paket Latsol OTAFF SSW PM Modul 5.1 (400 Soal)

**Tanggal Audit:** 2026-11-15  
**Sumber PDF:** `Bab 1-3.pdf` (*飲食料品製造業特定技能1号評価試験 学習用テキスト 第5.1版*, April 2026, OTAFF, 86 halaman)  
**Target Produksi:** 10 Paket × 40 Soal = **400 Soal** (1.200 Objek Opsi `A`–`C`)  
**Status Bundle:** `ZIP_CREATED` / `IMAGE_CROPPED` (Siap diintegrasikan ke website mengikuti `INTEGRATION-GUIDE.md`)

---

## 1. Ringkasan Kuantitatif Paket & Skor

| Paket | `setId` | Nama File JSON | Jumlah Soal | Soal Aktif | Opsi per Soal | Distribusi Kunci (A / B / C) | Skor Maksimal | Durasi |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 01 | `latsol-otaff-pm51-01` | `data/latsol-otaff-pm51-01.json` | 40 | 40 | 3 (`A`–`C`) | 15 / 15 / 10 | 150 poin | 70 menit |
| 02 | `latsol-otaff-pm51-02` | `data/latsol-otaff-pm51-02.json` | 40 | 40 | 3 (`A`–`C`) | 14 / 13 / 13 | 150 poin | 70 menit |
| 03 | `latsol-otaff-pm51-03` | `data/latsol-otaff-pm51-03.json` | 40 | 40 | 3 (`A`–`C`) | 14 / 13 / 13 | 150 poin | 70 menit |
| 04 | `latsol-otaff-pm51-04` | `data/latsol-otaff-pm51-04.json` | 40 | 40 | 3 (`A`–`C`) | 14 / 14 / 12 | 150 poin | 70 menit |
| 05 | `latsol-otaff-pm51-05` | `data/latsol-otaff-pm51-05.json` | 40 | 40 | 3 (`A`–`C`) | 13 / 14 / 13 | 150 poin | 70 menit |
| 06 | `latsol-otaff-pm51-06` | `data/latsol-otaff-pm51-06.json` | 40 | 40 | 3 (`A`–`C`) | 14 / 13 / 13 | 150 poin | 70 menit |
| 07 | `latsol-otaff-pm51-07` | `data/latsol-otaff-pm51-07.json` | 40 | 40 | 3 (`A`–`C`) | 13 / 14 / 13 | 150 poin | 70 menit |
| 08 | `latsol-otaff-pm51-08` | `data/latsol-otaff-pm51-08.json` | 40 | 40 | 3 (`A`–`C`) | 15 / 12 / 13 | 150 poin | 70 menit |
| 09 | `latsol-otaff-pm51-09` | `data/latsol-otaff-pm51-09.json` | 40 | 40 | 3 (`A`–`C`) | 14 / 14 / 12 | 150 poin | 70 menit |
| 10 | `latsol-otaff-pm51-10` | `data/latsol-otaff-pm51-10.json` | 40 | 40 | 3 (`A`–`C`) | 13 / 15 / 12 | 150 poin | 70 menit |
| **TOTAL** | **10 Paket** | **10 File JSON** | **400** | **400** | **1.200 Opsi** | **139 / 137 / 124** | **1.500 Poin** | **70 Menit/Paket** |

---

## 2. Distribusi Bab & Struktur Ujian Resmi

- **Bab 1 (*飲食料品製造業で必要な技能*):** 2 soal × 10 paket = **20 soal** (5,0%)
- **Bab 2 (*食品衛生* — Pengetahuan + Judgment + Planning):** 29 soal × 10 paket = **290 soal** (72,5%)
- **Bab 3 & Lampiran (*労働安全 & 安全標識* — Pengetahuan + Judgment):** 9 soal × 10 paket = **90 soal** (22,5%)

### Rincian Bobot Skor per Paket:
- **Nomor 1–25 (Pengetahuan Bidang Utama):** 25 soal × 3 poin = **75 poin**
- **Nomor 26–30 (Pengetahuan Keselamatan Kerja):** 5 soal × 5 poin = **25 poin**
- **Nomor 31–34 (Praktik Judgment Bidang Utama):** 4 soal × 5 poin = **20 poin**
- **Nomor 35–36 (Praktik Planning Bidang Utama):** 2 soal × 5 poin = **10 poin**
- **Nomor 37–40 (Praktik Judgment Keselamatan Kerja):** 4 soal × 5 poin = **20 poin**
- **Total Skor Setiap Paket:** **150 poin** (`maxScore: 150`)

---

## 3. Ringkasan Aset Gambar (`IMAGE_CROPPED` vs `NEEDS_IMAGE_PROCESSING`)

- **Status Pemrosesan Gambar:** **`IMAGE_CROPPED`** (Seluruh 122 file PNG telah di-crop secara individual dari `Bab 1-3.pdf` dan diverifikasi secara fisik)
- **Soal dengan Gambar Pertanyaan (Category 1 — `questionImage`):** **41 soal** (41 file PNG individual)
- **Soal dengan Gambar Opsi A, B, C Terpisah (Category 2 — `optionImage` / `mediaId`):** **27 soal** (81 file PNG opsi terpisah, dengan `questionImage: ""` sesuai standar)
- **Total File PNG di `assets/questions/`:** **122 file PNG**
- **Jumlah `NEEDS_IMAGE_PROCESSING`:** **0**
- **Jumlah Screenshot Halaman Penuh:** **0**

---

## 4. Log Audit Soal Perhitungan & Perencanaan (Nomor 35–36 di Setiap Paket = 20 Soal)

| ID Soal | Paket | Hal. PDF | Ringkasan Perhitungan / Perencanaan | Kunci | Hasil Terverifikasi | Status |
| :--- | :---: | :---: | :--- | :---: | :--- | :---: |
| `otaff-pm51-01-q035` | P01 | 39 | Pengenceran NaClO 5% → 200 ppm sebanyak 2 L (2.000 ml) | `A` | Larutan pekat `8 ml`, Air `1.992 ml` | `VERIFIED` |
| `otaff-pm51-01-q036` | P01 | 37 | Berat kotor kentang (rendemen kupas 80%) untuk 200 bungkus × 150 g | `B` | `30,0 kg / 0,80 = 37,5 kg` | `VERIFIED` |
| `otaff-pm51-02-q035` | P02 | 39 | Pengenceran NaClO 6% → 100 ppm sebanyak 3 L (3.000 ml) | `B` | Larutan pekat `5 ml`, Air `2.995 ml` | `VERIFIED` |
| `otaff-pm51-02-q036` | P02 | 39 | Jadwal batas waktu pendinginan cepat selesai masak pukul 14:00 | `C` | `14:30` (≤20°C, 30 mnt) / `15:00` (≤10°C, 60 mnt) | `VERIFIED` |
| `otaff-pm51-03-q035` | P03 | 39 | Pengenceran NaClO 10% → 200 ppm sebanyak 5 L (5.000 ml) | `A` | Larutan pekat `10 ml`, Air `4.990 ml` | `VERIFIED` |
| `otaff-pm51-03-q036` | P03 | 40 | Kebutuhan daging (80 g) & bawang bombai (45 g) untuk 400 hamburger | `B` | Daging `32,0 kg`, Bawang bombai `18,0 kg` | `VERIFIED` |
| `otaff-pm51-04-q035` | P04 | 39 | Pengenceran NaClO 12% → 100 ppm sebanyak 6 L (6.000 ml) | `C` | Larutan pekat `5 ml`, Air `5.995 ml` | `VERIFIED` |
| `otaff-pm51-04-q036` | P04 | 35 | Kapasitas pengisian optimal freezer 80%–90% dari 500 kotak | `B` | `400 kotak – 450 kotak` | `VERIFIED` |
| `otaff-pm51-05-q035` | P05 | 39 | Pengenceran NaClO 5% → 100 ppm sebanyak 4 L (4.000 ml) | `A` | Larutan pekat `8 ml`, Air `3.992 ml` | `VERIFIED` |
| `otaff-pm51-05-q036` | P05 | 37 | Takaran garam (2%) & gula (3%) untuk 25 kg (25.000 g) daging ikan | `C` | Garam `500 g`, Gula `750 g` | `VERIFIED` |
| `otaff-pm51-06-q035` | P06 | 39 | Pengenceran NaClO 8% → 200 ppm sebanyak 4 L (4.000 ml) | `B` | Larutan pekat `10 ml`, Air `3.990 ml` | `VERIFIED` |
| `otaff-pm51-06-q036` | P06 | 38 | Total waktu tahan pemanasan 3 batch spora (4 mnt) + 2 batch Norovirus (90 dtk) | `A` | `12 menit + 3 menit = 15 menit` | `VERIFIED` |
| `otaff-pm51-07-q035` | P07 | 39 | Pengenceran NaClO 5% → 200 ppm sebanyak 3,5 L (3.500 ml) | `B` | Larutan pekat `14 ml`, Air `3.486 ml` | `VERIFIED` |
| `otaff-pm51-07-q036` | P07 | 42 | Jumlah kotak kirim (24 bks/kotak) dari 150 kg (@250 g) dikurangi 12 sampel | `C` | `600 - 12 = 588 bks = 24 kotak + sisa 12 bks` | `VERIFIED` |
| `otaff-pm51-08-q035` | P08 | 39 | Pengenceran NaClO 10% → 100 ppm sebanyak 2,5 L (2.500 ml) | `A` | Larutan pekat `2,5 ml`, Air `2.497,5 ml` | `VERIFIED` |
| `otaff-pm51-08-q036` | P08 | 34 | Evaluasi suhu penerimaan telur cair (`液卵` 12°C) terhadap batas tabel (≤8°C) | `C` | Melebihi standar sebesar `+4°C` (`12°C - 8°C`) | `VERIFIED` |
| `otaff-pm51-09-q035` | P09 | 39 | Konsentrasi akhir (ppm) & durasi rendam dari 10 ml NaClO 6% dalam 3.000 ml | `B` | `200 ppm`, durasi `5 menit` | `VERIFIED` |
| `otaff-pm51-09-q036` | P09 | 36 | Perencanaan pemakaian Lot X, Y, Z berdasarkan `消費期限` & FIFO | `A` | Buang Lot X (lewat batas), gunakan Lot Y dulu | `VERIFIED` |
| `otaff-pm51-10-q035` | P10 | 39 | Pengenceran NaClO 4% → 200 ppm sebanyak 1,5 L (1.500 ml) | `C` | Larutan pekat `7,5 ml`, Air `1.492,5 ml` | `VERIFIED` |
| `otaff-pm51-10-q036` | P10 | 39 | Total waktu produksi 4 tahap (45 + 20 + 60 + 35 menit) mulai pukul 09:00 | `A` | Selesai pukul `11:40` (`160 menit = 2 jam 40 menit`) | `VERIFIED` |

---

## 5. Audit Sinkronisasi 3 Sidecar Kotoba (400 Soal & 1.200 Opsi)

- **`data/sharedKotobaDictionary-delta.json`:** **753 istilah terverifikasi** (`status: "verified"`, 100% bacaan Hiragana murni, 0 istilah `"unresolved"`).
- **`data/kotobaMapping-delta.json`:**
  - `questions`: **400 question ID** terpetakan (100% cakupan prompt & instruksi, 0 array kosong).
  - `options`: **400 question ID × 3 opsi (`A`, `B`, `C`) = 1.200 konteks opsi** terpetakan (100% cakupan opsi, 0 array kosong).
  - `byCompositeKey`: **1.200 kunci komposit (`<qId>::A`, `<qId>::B`, `<qId>::C`)** identik 100% dengan `options[qId][optId]`.
  - **Dangling `termId`:** **0** (seluruh `termId` pada mapping tersedia di `sharedKotobaDictionary-delta.json`).
- **`data/kotoba-tambahan-delta.json`:** **400 entri soal** (`kotobaU.length === kotobaV.length`, tanda kurung Jepang lebar penuh `（ ）`, `status: "FIXED"`).

---

## 6. Kunci Jawaban `REVIEW_REQUIRED` & Validasi Akademik

- **Jumlah Kunci Jawaban `REVIEW_REQUIRED`:** **0** (Seluruh 400 soal diturunkan langsung dari fakta eksplisit, tabel, grafik, dan prosedur pada `Bab 1-3.pdf` dengan kutipan halaman di `explanation`).
- **Validasi Opsi:** Tepat 3 opsi (`A`, `B`, `C`) pada seluruh 400 soal; **0 opsi `D`**.
- **Catatan Integrasi Website:** File `*-delta.json` di dalam bundle ini adalah *staging delta* yang harus digabungkan (*merge*) ke dalam file master `data/sharedKotobaDictionary.json`, `data/kotobaMapping.json`, dan `data/kotoba-dan-kategori-tambahan.json`, serta ke-10 file paket JSON perlu didaftarkan pada `utils.js`, `app.js`, dan `sw.js` sesuai panduan pada `INTEGRATION-GUIDE.md`.
