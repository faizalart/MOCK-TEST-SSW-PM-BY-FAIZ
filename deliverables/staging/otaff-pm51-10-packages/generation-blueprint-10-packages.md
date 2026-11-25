# Generation Blueprint — 10 Paket Latsol OTAFF SSW PM Modul 5.1 (400 Soal)

**Dokumen Sumber:** `Bab 1-3.pdf` — *飲食料品製造業特定技能1号評価試験 学習用テキスト 第5.1版* (April 2026, 一般社団法人 外国人食品産業技能評価機構 / OTAFF)  
**Target Produksi:** 10 Paket (`latsol-otaff-pm51-01` s/d `latsol-otaff-pm51-10`) × 40 Soal = **400 Soal** (1.200 Objek Opsi `A`–`C`)  
**Skor Maksimal per Paket:** **150 Poin** | **Durasi Simulasi:** **70 Menit**

---

## 1. Struktur Resmi Ujian Setiap Paket (Nomor 1–40)

Setiap paket (`latsol-otaff-pm51-01.json` hingga `latsol-otaff-pm51-10.json`) mematuhi struktur resmi evaluasi SSW Pengolahan Makanan (飲食料品製造業特定技能1号評価試験):

| Rentang Nomor | Bagian Ujian | Cakupan Bab | Jumlah Soal | Bobot per Soal | Subtotal Poin | Fokus Kompetensi |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **No. 1–25** | Pengetahuan Bidang Utama (*学科試験・主たる業務の知識*) | Bab 1 & Bab 2 | 25 | 3 poin | 75 poin | Konsep industri pangan, keamanan pangan, faktor bahaya (fisik, kimia, biologis), manajemen higiene umum (5S, fasilitas, pekerja, bahan baku/proses), dan 7 prinsip HACCP |
| **No. 26–30** | Pengetahuan Keselamatan Kerja (*学科試験・労働安全の知識*) | Bab 1(2) & Bab 3 | 5 | 5 poin | 25 poin | Statistik kecelakaan kerja, 8 jenis kecelakaan utama, 5S keselamatan, pakaian kerja & APD, prosedur mesin (fail-safe, fool-proof, LOTO), bahan kimia, kondisi abnormal, Hiyari-Hatto & KYT |
| **No. 31–34** | Praktik Judgment Bidang Utama (*実技試験・判断試験 主たる業務*) | Bab 2 | 4 | 5 poin | 20 poin | Pengambilan keputusan berbasis ilustrasi pakaian kerja/cuci tangan, pembacaan tabel suhu penyimpanan/pemanasan, inspeksi detektor logam/sinar-X, dan tindakan korektif penyimpangan CCP |
| **No. 35–36** | Praktik Planning Bidang Utama (*実技試験・計画立案試験 主たる業務*) | Bab 2 | 2 | 5 poin | 10 poin | Perhitungan pengenceran larutan NaClO (ppm & ml), perencanaan berat bahan baku (kg/g & rasio), kapasitas batch, dan perencanaan waktu/suhu sterilisasi & pendinginan |
| **No. 37–40** | Praktik Judgment Keselamatan Kerja (*実技試験・判断試験 労働安全*) | Bab 3 & Lampiran | 4 | 5 poin | 20 poin | Analisis visual kasus Hiyari-Hatto/kecelakaan kerja, identifikasi bahaya KYT (Manusia vs Benda), pemilihan APD visual, dan pengenalan rambu keselamatan (*安全標識*) |
| **TOTAL** | **Seluruh Paket** | **Bab 1, 2, 3 & Lampiran** | **40 Soal** | **3 / 5 poin** | **150 Poin** | **3 Opsi (A, B, C) — Tanpa Opsi D** |

---

## 2. Matriks Distribusi Materi per Paket dan Keseluruhan 400 Soal

Tabel berikut memetakan distribusi soal per subbab pada masing-masing paket (`P01`–`P10`) sehingga seluruh subbab Bab 1, Bab 2, dan Bab 3 terwakili secara merata tanpa ada satu bab yang mendominasi secara timpang:

| Kode Subbab | Topik & Subbab Modul OTAFF 5.1 (Halaman PDF) | P01 | P02 | P03 | P04 | P05 | P06 | P07 | P08 | P09 | P10 | Total 10 Paket |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Bab 1.1** | Jenis Industri & Statistik Nilai Produksi Pangan Jepang (PDF hal. 6–7) | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | **10** |
| **Bab 1.2** | Keterampilan SSW 1: Keamanan Pangan & Keselamatan Kerja (PDF hal. 8) | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | **10** |
| **Bab 2.1** | Prinsip Dasar Higiene Pangan, Manajemen Higiene Umum vs HACCP (PDF hal. 10–11) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | **20** |
| **Bab 2.2(1)** | Faktor Bahaya Fisik (*物理的危害要因*), Benda Asing Keras & Lunak (PDF hal. 12–13) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | **20** |
| **Bab 2.2(2)** | Faktor Bahaya Kimia: 9 Alergen Wajib (Revisi 2026: Kacang Mete) & 20 Anjuran (Pistachio), Histamin, Solanin, Bahan Kimia (PDF hal. 13–15) | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **30** |
| **Bab 2.2(3)** | Faktor Bahaya Biologis: 8 Bakteri Keracunan Pangan, Spora, 3 Prinsip Bakteri, Norovirus (4 Prinsip), Kapang, Anisakis (PDF hal. 15–19) | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | **50** |
| **Bab 2.3(1)** | Kegiatan 5S dalam Manajemen Higiene Umum (PDF hal. 20–21) | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | **10** |
| **Bab 2.3(2)** | Higiene Fasilitas, Peralatan, Zoning (*区分衛生管理*), Pencucian/Disinfeksi, Manajemen Bahan Kimia (PDF hal. 21–23) | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **30** |
| **Bab 2.3(3)** | Higiene Pekerja: Cek Kesehatan, Pakaian Kerja, Urutan Memakai, Cuci Tangan, Sarung Tangan, Aturan Perilaku (PDF hal. 23–32) | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | **40** |
| **Bab 2.3(4)** | Higiene Bahan Baku & Produk: Inspeksi Penerimaan, Tabel Suhu, Tanggal Kedaluwarsa, FIFO, Thawing, Pemanasan, Pendinginan, NaClO, Detektor Logam/X-Ray, Uji Mikroba, Sampel (PDF hal. 32–42) | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 6 | **60** |
| **Bab 2.4** | Manajemen Higiene Berbasis HACCP: 7 Prinsip, 5 CCP Utama, Penyimpangan (*逸脱*), Tindakan Korektif, Pencatatan (PDF hal. 42–46) | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **30** |
| **Bab 3.1** | Kecelakaan Kerja Industri Pangan: Pekerja Kurang Berpengalaman, Statistik Grafik Lingkaran, 8 Jenis Kecelakaan (PDF hal. 48–50) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | **20** |
| **Bab 3.2** | Pencegahan Kecelakaan: 5S, Pakaian & 10 APD, Prosedur & Aturan, Inspeksi Awal, Tombol Darurat, Fail-Safe, Fool-Proof, LOTO, Bahan Kimia (PDF hal. 50–57) | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **30** |
| **Bab 3.3–3.4** | Penanganan Kondisi Abnormal, Bahaya Sekunder, Studi Kasus, Hukum Heinrich (1:29:300), KYT (PDF hal. 57–61) | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | **10** |
| **Bab 3.5 & Lamp.** | Studi Kasus Visual Hiyari-Hatto (8 Kategori) & 15 Kelompok Rambu Keselamatan Kerja (PDF hal. 61–70) | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **30** |
| **TOTAL** | **Seluruh Bab 1, Bab 2, Bab 3, dan Lampiran** | **40** | **40** | **40** | **40** | **40** | **40** | **40** | **40** | **40** | **40** | **400** |

### Ringkasan Proporsi Bab per Paket:
- **Bab 1 (Pengantar Industri & Kompetensi SSW 1):** 2 soal/paket (**20 soal** total / 5,0%)
- **Bab 2 (Higiene Pangan / 食品衛生 — Pengetahuan + Judgment + Planning):** 29 soal/paket (**290 soal** total / 72,5%)
- **Bab 3 & Lampiran (Keselamatan Kerja / 労働安全 — Pengetahuan + Judgment):** 9 soal/paket (**90 soal** total / 22,5%)

---

## 3. Matriks Variasi Soal Praktik (Judgment, Planning, Perhitungan, & Gambar) Nomor 31–40

Setiap paket memiliki desain skenario praktik, perhitungan, dan aset visual yang berbeda agar tidak mengulang pola yang sama:

| Paket | Q31–Q34: Judgment Bidang Utama (Visual/Tabel/Kasus Bab 2) | Q35–Q36: Planning & Perhitungan Bidang Utama (Bab 2) | Q37–Q40: Judgment Keselamatan Kerja (Visual/Rambu/KYT Bab 3) |
| :--- | :--- | :--- | :--- |
| **Paket 01** | Q31: Diagram pakaian kerja (`questionImage`)<br>Q32: Tabel suhu penyimpanan bahan baku (`questionImage`)<br>Q33: Urutan cuci tangan (`optionImage` A–C)<br>Q34: Penyimpangan suhu sterilisasi CCP & tindakan korektif | Q35: Pengenceran NaClO 5% menjadi 200 ppm sebanyak 2 L (ml larutan & air)<br>Q36: Perencanaan berat bahan baku bersih (kg ke g setelah penyusutan kupas) | Q37: Kasus Hiyari-Hatto terpeleset lantai basah (`questionImage`)<br>Q38: Kasus mesin pengemas macet (`questionImage`)<br>Q39: Pemilihan rambu larangan menyentuh (`optionImage` A–C)<br>Q40: Pemilihan APD kerja ketinggian vs bahan kimia (`optionImage` A–C) |
| **Paket 02** | Q31: Pemeriksaan pemakaian masker & topi (`questionImage`)<br>Q32: Tabel suhu & waktu pemanasan mikroba (`questionImage`)<br>Q33: Kondisi sarung tangan layak pakai (`optionImage` A–C)<br>Q34: Penyimpangan detektor logam & penanganan produk | Q35: Pengenceran NaClO 6% menjadi 100 ppm sebanyak 3 L (ml larutan & air)<br>Q36: Perencanaan jadwal waktu pendinginan 2 tahap (30 menit 20°C / 60 menit 10°C) & sterilisasi | Q37: Kasus Hiyari-Hatto membawa tumpukan kotak roti (`questionImage`)<br>Q38: Kasus membersihkan konveyor berjalan (`questionImage`)<br>Q39: Pemilihan rambu bahaya terjepit (`optionImage` A–C)<br>Q40: Postur mengangkat beban berat yang benar vs salah (`optionImage` A–C) |
| **Paket 03** | Q31: Diagram piramida manajemen HACCP (`questionImage`)<br>Q32: Gambar tangki sterilisasi kimia sayuran (`questionImage`)<br>Q33: Urutan pemakaian pakaian kerja di ruang ganti (`optionImage` A–C)<br>Q34: Judgment penerimaan bahan baku (suhu & tanggal kedaluwarsa) | Q35: Pengenceran NaClO 10% menjadi 200 ppm sebanyak 5 L (ml larutan & air)<br>Q36: Perhitungan kebutuhan bahan baku (kg & g) untuk target produksi 400 bungkus | Q37: Kasus Hiyari-Hatto memotong roti dengan slicer (`questionImage`)<br>Q38: Kasus memotong ikan beku dengan pisau (`questionImage`)<br>Q39: Pemilihan rambu bahaya luka bakar/permukaan panas (`optionImage` A–C)<br>Q40: Pemilihan sarung tangan pelindung potong vs panas (`optionImage` A–C) |
| **Paket 04** | Q31: Penggunaan rol perekat & air shower (`questionImage`)<br>Q32: Mesin detektor logam & pemeriksaan test piece (`questionImage`)<br>Q33: Identifikasi benda asing keras vs lunak (`optionImage` A–C)<br>Q34: Judgment konsentrasi & durasi perendaman NaClO (100 ppm vs 200 ppm) | Q35: Pengenceran NaClO 12% menjadi 100 ppm sebanyak 6 L (ml larutan & air)<br>Q36: Perencanaan kapasitas pengisian freezer (80%–90%) & konversi berat batch (kg) | Q37: Kasus Hiyari-Hatto turun dari tangga lipat/kyatatsu (`questionImage`)<br>Q38: Kasus memegang loyang oven panas dengan tangan kosong (`questionImage`)<br>Q39: Pemilihan rambu awas terpeleset/jatuh (`optionImage` A–C)<br>Q40: Diagram tanda-tanda kondisi abnormal mesin (`questionImage`) |
| **Paket 05** | Q31: Pemeriksaan kuku jari tangan pekerja (`questionImage`)<br>Q32: Mesin detektor benda asing sinar-X (`questionImage`)<br>Q33: Identifikasi bahan baku wajib label alergen (`optionImage` A–C)<br>Q34: Judgment prosedur pencatatan HACCP & larangan manipulasi | Q35: Pengenceran NaClO 5% menjadi 100 ppm sebanyak 4 L (ml larutan & air)<br>Q36: Perhitungan rasio bumbu (garam/gula dalam % dan gram) terhadap berat daging (kg) | Q37: Kasus Hiyari-Hatto nyeri pinggang mengangkat ketel (`questionImage`)<br>Q38: Kasus gejala sengatan panas/heatstroke (`questionImage`)<br>Q39: Pemilihan rambu bahaya terlilit benda berputar (`optionImage` A–C)<br>Q40: Piramida Hukum Heinrich 1:29:300 & analisis rasio (`questionImage`) |
| **Paket 06** | Q31: Pemakaian celemek dan pelindung lengan (`questionImage`)<br>Q32: Tabel bakteri penyebab keracunan makanan (`questionImage`)<br>Q33: Tahapan mencuci tangan dengan sabun vs alkohol (`optionImage` A–C)<br>Q34: Judgment pencegahan kontaminasi silang antar zona kerja | Q35: Pengenceran NaClO 8% menjadi 200 ppm sebanyak 4 L (ml larutan & air)<br>Q36: Perencanaan waktu pemanasan spora (120°C ≥4 menit) vs Norovirus (85–90°C ≥90 detik) untuk beberapa batch | Q37: Kasus Hiyari-Hatto forklift di pintu gudang (`questionImage`)<br>Q38: Pelanggaran merangkak di bawah konveyor (`questionImage`)<br>Q39: Pemilihan rambu larangan masuk, larangan berlari, & pintu tertutup (`optionImage` A–C)<br>Q40: Bagan KYT potensi bahaya "Manusia" vs "Benda" (`questionImage`) |
| **Paket 07** | Q31: Grafik tren nilai produksi industri pangan (`questionImage`)<br>Q32: Grafik komposisi subsektor industri pangan (`questionImage`)<br>Q33: Identifikasi alergen wajib vs anjuran (`optionImage` A–C)<br>Q34: Judgment prosedur pencairan (*thawing*) air mengalir saat plastik bocor | Q35: Pengenceran NaClO 5% menjadi 200 ppm sebanyak 3,5 L (ml larutan & air)<br>Q36: Perencanaan jumlah karton & pak produk jadi berdasarkan berat total bahan (kg ke g) | Q37: Pelanggaran mengobrol/lengah saat mengoperasikan mesin (`questionImage`)<br>Q38: Prosedur tunjuk-sebut (*shisa koshou*) pada panel sakelar (`questionImage`)<br>Q39: Pemilihan rambu bahaya sengatan listrik, terbentur kepala, & terpotong (`optionImage` A–C)<br>Q40: Pemilihan pelindung mata, penyumbat telinga, & sepatu keselamatan (`optionImage` A–C) |
| **Paket 08** | Q31: Pekerja membaca prosedur kerja & manual (`questionImage`)<br>Q32: Tabel benda asing keras & sumber kontaminasinya (`questionImage`)<br>Q33: Langkah pemeriksaan akhir pakaian kerja di depan cermin (`optionImage` A–C)<br>Q34: Judgment pembasmian parasit Anisakis (pemanasan vs pembekuan -20°C 24 jam) | Q35: Pengenceran NaClO 10% menjadi 100 ppm sebanyak 2,5 L (ml larutan & air)<br>Q36: Perhitungan selisih suhu penyimpanan aktual terhadap standar tabel suhu bahan baku | Q37: Penggunaan tombol berhenti darurat pada panel operasi (`questionImage`)<br>Q38: Grafik kecelakaan kerja berdasarkan jenis kecelakaan (`questionImage`)<br>Q39: Pemilihan rambu wajib kacamata pelindung, pintu darurat, & APAR (`optionImage` A–C)<br>Q40: Evaluasi tindakan saat menemukan rekan kerja pingsan (pencegahan bahaya sekunder) |
| **Paket 09** | Q31: Daftar bergambar 9 alergen wajib label 2026 (`questionImage`)<br>Q32: Daftar bergambar 20 alergen anjuran label 2026 (`questionImage`)<br>Q33: Peralatan pembersih debu rambut: rol perekat vs air shower (`optionImage` A–C)<br>Q34: Judgment penanganan pipa peralatan produksi yang masih menyisakan air | Q35: Perhitungan konsentrasi akhir (ppm) jika 10 ml NaClO 6% dicampur air hingga total 3 L<br>Q36: Perencanaan urutan penggunaan bahan baku berdasarkan prinsip FIFO & batas tanggal | Q37: Tabel daftar alat pelindung diri (APD) pabrik pangan (`questionImage`)<br>Q38: Ilustrasi penanganan pertama pekerja terkena heatstroke (`questionImage`)<br>Q39: Perbandingan rambu "Sedang Pemeriksaan Jangan Nyalakan Sakelar" vs rambu lainnya (`optionImage` A–C)<br>Q40: Pemilihan sepatu bot berpenutup vs sepatu keselamatan vs sarung tangan rantai (`optionImage` A–C) |
| **Paket 10** | Q31: Ilustrasi pencatatan dokumen & verifikasi HACCP (`questionImage`)<br>Q32: Tabel suhu penyimpanan daging, ikan, telur, dan produk susu (`questionImage`)<br>Q33: Identifikasi kesalahan pemakaian sarung tangan kerja (`optionImage` A–C)<br>Q34: Judgment prosedur pemotongan kemasan bahan baku (*切れ端*) agar tidak tercampur | Q35: Pengenceran NaClO 4% menjadi 200 ppm sebanyak 1,5 L (ml larutan & air)<br>Q36: Perencanaan total waktu produksi (persiapan, pemanasan, pendinginan cepat, dan pemeriksaan test piece) | Q37: Ilustrasi perbandingan postur angkat beban benar vs salah (`questionImage`)<br>Q38: Ilustrasi kecelakaan terjepit pada mesin pengemas & konveyor (`questionImage`)<br>Q39: Identifikasi rambu peringatan jatuh dari bukaan lantai (*開口部注意*) vs jatuh dari tangga (`optionImage` A–C)<br>Q40: Analisis komprehensif KYT pada area penggorengan/oven & penggunaan alkohol disinfektan |

---

## 4. Standar Anti-Duplikasi 400 Soal

1. **Keunikan Stem & Skenario:** Seluruh 400 soal memiliki stem kalimat bahasa Jepang (`questionText`) yang unik (0% duplikasi identik antarpaket).
2. **Diferensiasi Sudut Pandang Kompetensi:** Ketika suatu subbab diuji di beberapa paket, setiap paket menguji dimensi yang berbeda:
   - *Definisi istilah* vs *Alasan/tujuan prosedur* vs *Identifikasi pengecualian (`間違っているもの`)* vs *Tindakan saat terjadi penyimpangan di lapangan* vs *Interpretasi visual/tabel*.
3. **Diferensiasi Soal Hitungan:** Soal perencanaan/perhitungan (Q35–Q36 di setiap paket, serta variasi numerik lainnya) tidak sekadar mengganti angka pada kalimat yang sama, melainkan memvariasikan konteks pekerjaan (disinfeksi alat dengan 200 ppm, sterilisasi sayuran dengan 100 ppm, pengecekan konsentrasi balik, perhitungan rendemen bahan baku bersih, rasio bumbu, kapasitas ruang beku, dan penjadwalan suhu-waktu).
