# Similarity & Anti-Duplication Report — 400 Soal (10 Paket)

**Dataset:** `latsol-otaff-pm51-01` s/d `latsol-otaff-pm51-10`  
**Total Soal Dianalisis:** 400 Soal  
**Total Pasangan Soal Diuji (Pairwise Comparison):** 79,800 Pasangan (`400 × 399 / 2`)  
**Metode Evaluasi:** Exact Stem Match (`questionText`), Exact Stem+Options Match, & Character Bigram Jaccard Similarity (`questionText` + `options`)

---

## 1. Ringkasan Eksekutif Anti-Duplikasi

| Indikator Pemeriksaan | Hasil Aktual | Ambang Batas / Standar | Status |
| :--- | :---: | :---: | :---: |
| **Duplikasi Kalimat Pertanyaan Identik (`questionText`)** | **0** | `0` | **PASS** |
| **Duplikasi Kombinasi Soal + Opsi Identik** | **0** | `0` | **PASS** |
| **Kloning Soal Hanya Ganti Angka pada Kalimat Identik** | **0** | `0` | **PASS** |
| **Kloning Soal Hanya Ganti 1 Kata pada Kalimat Identik** | **0** | `0` | **PASS** |
| **Skor Kemiripan Pasangan Tertinggi (Max Jaccard)** | **0.7357** | `< 0.7500` | **PASS** |

---

## 2. Distribusi Skor Kemiripan Seluruh 79,800 Pasangan Soal

| Rentang Jaccard Similarity | Jumlah Pasangan | Persentase | Interpretasi |
| :--- | :---: | :---: | :--- |
| `0.00 – 0.20` (Sangat Berbeda) | 45,192 | 56.63% | Topik, bab, dan kosakata berbeda |
| `0.20 – 0.40` (Berbeda) | 34,333 | 43.02% | Satu bab yang sama namun subbab/konteks berbeda |
| `0.40 – 0.60` (Moderat — Subtopik Sama, Sudut Pandang Berbeda) | 254 | 0.32% | Subtopik sama tetapi menguji kompetensi berbeda (definisi vs studi kasus vs tabel) |
| `0.60 – 0.75` (Terminologi Teknis Serumpun) | 21 | 0.03% | Berbagi istilah teknis baku (mis. `次亜塩素酸ナトリウム溶液` / `特定原材料`) dengan skenario berbeda |
| `0.75 – 1.00` (Indikasi Duplikat / Hampir Identik) | 0 | 0.00% | **Nol pasangan duplikat atau hampir identik** |

---

## 3. Verifikasi Diferensiasi Konsep Berulang Antarpaket

Sesuai aturan anti-duplikasi, konsep penting dari `Bab 1-3.pdf` diuji lintas paket melalui sudut pandang kompetensi, situasi pekerjaan, dan penalaran yang berbeda:

1. **9 Alergen Wajib (`特定原材料`) & 20 Alergen Anjuran (`準ずるもの` — Revisi April 2026):**
   - *Paket 01 (Q07):* Penambahan baru `カシューナッツ` per 1 April 2026.
   - *Paket 02 (Q07, Q08):* Pemisahan talenan/pisau bahan beralergen & kombinasi 9 item wajib lengkap.
   - *Paket 03 (Q08):* Status hukum anjuran (`推奨`) pada 20 item `特定原材料に準ずるもの`.
   - *Paket 04 (Q06):* Gejala klinis reaksi alergi (`じんましん`, bengkak bibir/kelopak mata, sesak napas).
   - *Paket 05 (Q06, Q07, Q33):* Penambahan `ピスタチオ`, istilah `アレルゲン`, dan identifikasi visual gambar `カシューナッツ`.
   - *Paket 06 (Q05, Q06):* 3 jenis daging dalam 20 item anjuran & alasan hukum kewajiban label alergen.
   - *Paket 07 (Q04, Q05, Q24, Q33):* 5 hasil laut dan 5 buah dalam 20 item anjuran, alasan pencucian mesin pasca-produksi alergen, serta identifikasi visual `落花生`.
   - *Paket 08 (Q03, Q23):* Perbandingan kacang wajib vs kacang anjuran & mekanisme reaksi imun berlebih.
   - *Paket 09 (Q03, Q04, Q31, Q32):* Kuantitas 9 item wajib + 20 item anjuran (29 item), kedelai/yamaimo/gelatin, dan analisis daftar bergambar halaman 14 PDF.
   - *Paket 10 (Q03):* Memilih kombinasi murni 20 item anjuran vs 9 item wajib.

2. **Perhitungan Pengenceran Natrium Hipoklorit (`次亜塩素酸ナトリウム`) & Perencanaan Produksi (Q35–Q36):**
   - *Paket 01:* Pengenceran 5% → 200 ppm (2 L) & perhitungan rendemen kupas kentang 80% untuk 200 bungkus salad kentang.
   - *Paket 02:* Pengenceran 6% → 100 ppm (3 L) & penjadwalan waktu pendinginan 2 tahap (14:00 → 14:30 / 15:00).
   - *Paket 03:* Pengenceran 10% → 200 ppm (5 L) & perencanaan berat daging (80 g) + bawang bombai (45 g) untuk 400 hamburger.
   - *Paket 04:* Pengenceran 12% → 100 ppm (6 L) & perhitungan kapasitas optimal pengisian freezer 80%–90% dari 500 kotak.
   - *Paket 05:* Pengenceran 5% → 100 ppm (4 L) & perhitungan gramasi bumbu garam (2%) dan gula (3%) terhadap 25 kg daging ikan.
   - *Paket 06:* Pengenceran 8% → 200 ppm (4 L) & akumulasi waktu tahan pemanasan minimum 3 batch sup spora + 2 batch kerang Norovirus.
   - *Paket 07:* Pengenceran 5% → 200 ppm (3,5 L) & perhitungan jumlah karton pengiriman setelah dikurangi sampel produk (`製品サンプル`).
   - *Paket 08:* Pengenceran 10% → 100 ppm (2,5 L) & evaluasi selisih suhu penerimaan bahan baku (`品温`) terhadap tabel standar suhu.
   - *Paket 09:* Perhitungan balik konsentrasi akhir (ppm) dan durasi perendaman dari 10 ml NaClO 6% dalam 3 L, serta seleksi lot berdasarkan FIFO & `消費期限`.
   - *Paket 10:* Pengenceran 4% → 200 ppm (1,5 L) & perencanaan total jadwal waktu produksi berurutan dari persiapan hingga pemeriksaan test piece.
