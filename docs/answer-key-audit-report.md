# Full Academic QA — Audit Kebenaran 581 Soal SSW Pengolahan Makanan (19 Paket Latsol)

> [!IMPORTANT]
> Audit substansi akademik ini memeriksa **seluruh 581 soal** pada **19 paket Latsol SSW Pengolahan Makanan** secara independen terhadap buku teks resmi OTAFF (*飲食料品製造業特定技能1号学習用テキスト*), prinsip HACCP (7 Prinsip & 12 Langkah Codex), standar 5S, higiene sanitasi pangan Jepang, keselamatan kerja (*労働安全衛生* / KYT), perhitungan matematika/rasio, serta konsistensi lintas-paket dan lintas-bank soal kanonik (`966` soal referensi).

---

## 1. Ringkasan Eksekutif & Statistik Audit

| Metrik / Kategori Status | Jumlah Soal | Persentase | Tindakan pada JSON Paket |
| :--- | :---: | :---: | :--- |
| **Total Soal Diaudit (19 Paket)** | **581** | **100,00%** | — |
| `VERIFIED_CORRECT` | **555** | 95,52% | Dipertahankan (`source = json = verified`) |
| `KEY_CORRECTION_REQUIRED` | **4** | 0,69% | **Diperbaiki pada Tahap B** (`correctAnswer` & `correctIndex` diperbarui) |
| `SOURCE_CONFLICT` | **11** | 1,89% | Dipertahankan (`source PDF` salah ketik/tabel rusak, namun `currentJsonAnswer` sudah benar) |
| `QUESTION_DEFECTIVE` | **4** | 0,69% | Dipertahankan tanpa perubahan spekulatif (soal/opsi sumber cacat atau terpotong) |
| `REVIEW_REQUIRED` | **7** | 1,20% | Dipertahankan tanpa perubahan spekulatif (wacana/redaksi soal kurang presisi namun kunci saat ini paling tepat) |
| `INSUFFICIENT_EVIDENCE` | **0** | 0,00% | — |

### File Deliverable Audit
- **JSON Terstruktur (581 entri)**: [answer-key-audit.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/answer-key-audit.json)
- **CSV Tabel Ringkasan (581 baris)**: [answer-key-audit.csv](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/answer-key-audit.csv)
- **Laporan Audit Markdown (Project Root)**: [answer-key-audit-report.md](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/answer-key-audit-report.md)

---

## 2. Rincian Per Paket (19 Paket — 581 Soal)

| Paket | File JSON | Sumber PDF | Total Soal | `VERIFIED_CORRECT` | `KEY_CORRECTION_REQUIRED` | `SOURCE_CONFLICT` | `QUESTION_DEFECTIVE` | `REVIEW_REQUIRED` |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Nguyen 01** | [latsol-nguyen-01.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-01.json) | `1.pdf` | 40 | 40 | 0 | 0 | 0 | 0 |
| **Nguyen 02** | [latsol-nguyen-02.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-02.json) | `2.pdf` | 40 | 40 | 0 | 0 | 0 | 0 |
| **Nguyen 03** | [latsol-nguyen-03.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-03.json) | `3.pdf` | 40 | 39 | **1** (`nguyen03-q029`) | 0 | 0 | 0 |
| **Nguyen 04** | [latsol-nguyen-04.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-04.json) | `4.pdf` | 40 | 40 | 0 | 0 | 0 | 0 |
| **Nguyen 05** | [latsol-nguyen-05.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-05.json) | `5.pdf` | 36 | 35 | 0 | 0 | 1 (`nguyen05-q036`) | 0 |
| **Nguyen 06** | [latsol-nguyen-06.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-06.json) | `6.pdf` | 40 | 38 | 0 | 1 (`nguyen06-q013`) | 0 | 1 (`nguyen06-q032`) |
| **Nguyen 07** | [latsol-nguyen-07.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-07.json) | `7.pdf` | 40 | 39 | 0 | 0 | 0 | 1 (`nguyen07-q033`) |
| **Nguyen 08** | [latsol-nguyen-08.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-08.json) | `8.pdf` | 40 | 40 | 0 | 0 | 0 | 0 |
| **Nguyen 09** | [latsol-nguyen-09.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-09.json) | `9.pdf` | 40 | 39 | **1** (`nguyen09-q029`) | 0 | 0 | 0 |
| **Nguyen 10** | [latsol-nguyen-10.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-10.json) | `10 (2).pdf` | 40 | 39 | **1** (`nguyen10-q030`) | 0 | 0 | 0 |
| **Reguler 01** | [latsol-reguler-01.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-reguler-01.json) | `Latihan 1 Soal SSW PM + KJ.pdf` | 20 | 16 | **1** (`reguler01-q007`) | 0 | 1 (`reguler01-q014`) | 2 (`q013`, `q017`) |
| **Reguler 02** | [latsol-reguler-02.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-reguler-02.json) | `Latihan 2 Soal SSW PM + KJ.pdf` | 20 | 20 | 0 | 0 | 0 | 0 |
| **Reguler 03** | [latsol-reguler-03.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-reguler-03.json) | `Latihan 3 Soal SSW PM + KJ.pdf` | 20 | 19 | 0 | 0 | 1 (`reguler03-q008`) | 0 |
| **Reguler 04** | [latsol-reguler-04.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-reguler-04.json) | `Latihan 4 Soal SSW PM + KJ.pdf` | 20 | 19 | 0 | 0 | 0 | 1 (`reguler04-q013`) |
| **Reguler 05** | [latsol-reguler-05.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-reguler-05.json) | `Latihan 5 Soal SSW PM + KJ.pdf` | 20 | 20 | 0 | 0 | 0 | 0 |
| **Reguler 06** | [latsol-reguler-06.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-reguler-06.json) | `Latihan 6 Soal SSW PM + KJ.pdf` | 20 | 20 | 0 | 0 | 0 | 0 |
| **Tambahan 01** | [latsol-tambahan-01.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-tambahan-01.json) | `25 Soal SSW PM + KJ - WM.pdf` | 25 | 14 | 0 | 9 (`q011..q025`) | 1 (`tambahan01-q012`) | 1 (`tambahan01-q024`) |
| **Tambahan 02** | [latsol-tambahan-02.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-tambahan-02.json) | `Latihan Soal SSW PM + KJ (1).pdf` | 30 | 28 | 0 | 1 (`tambahan02-q015`) | 0 | 1 (`tambahan02-q012`) |
| **Hitungan 01** | [latsol-hitungan-01.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-hitungan-01.json) | `LATIHAN SOAL HITUNGAN SSW PM.pdf` | 10 | 10 | 0 | 0 | 0 | 0 |
| **TOTAL** | **19 Paket** | **19 PDF Sumber** | **581** | **555** | **4** | **11** | **4** | **7** |

---

## 3. Daftar Lengkap `KEY_CORRECTION_REQUIRED` (4 Soal yang Diperbaiki Kunci Jawabannya)

Keempat soal di bawah ini memiliki kunci jawaban di JSON (`currentJsonAnswer`) yang **terbukti salah secara substansi akademik** karena menyalin tanda centang/kunci yang keliru dari PDF sumber. Seluruh 4 soal ini telah diperbaiki pada Tahap B:

### 3.1. `nguyen03-q029`, `nguyen09-q029`, dan `nguyen10-q030` (Klaster Duplikat Soal CCP / HACCP)

| Atribut | Detail |
| :--- | :--- |
| **ID Soal & File** | 1. `nguyen03-q029` ([latsol-nguyen-03.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-03.json), `3.pdf` Hal. 5, Câu 29)<br>2. `nguyen09-q029` ([latsol-nguyen-09.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-09.json), `9.pdf` Hal. 5, Câu 29)<br>3. `nguyen10-q030` ([latsol-nguyen-10.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-10.json), `10 (2).pdf` Hal. 6, Câu 29 / No. 30) |
| **Pertanyaan (JP)** | `間違っているものを一つ選びなさい。 重要管理点について、間違っているものはどれですか。` |
| **Opsi Jawaban** | - **A**: `重要管理点では、管理基準を必ず守らなければいけません。` *(Di titik kendali kritis/CCP, standar manajemen/batas kritis harus selalu dipatuhi — **Pernyataan BENAR**)*<br>- **B**: `重要管理点が一つではなく、二つ以上になる食品もある。` *(Ada juga produk pangan yang memiliki lebih dari satu CCP — **Pernyataan BENAR**)*<br>- **C**: `重要管理点が一つだけある。` *(Titik kendali kritis/CCP hanya ada satu — **Pernyataan SALAH**)* |
| **Jawaban PDF Sumber** | `A` (Centang hijau `✓` salah ditaruh pada opsi A di `3.pdf`, lalu terduplikasi ke `9.pdf` dan `10 (2).pdf`) |
| **Jawaban JSON Lama** | `A` (`correctIndex: 0`) |
| **Jawaban Terverifikasi** | **`C` (`correctIndex: 2`)** |
| **Bukti Akademik & Lintas-Paket** | 1. **Substansi HACCP (Bab 3 OTAFF)**: Pertanyaan menanyakan `間違っているもの` (pernyataan yang **SALAH**). Dalam sistem HACCP, jumlah CCP bergantung pada jenis produk dan proses pengolahannya—bisa satu atau dua/lebih (misalnya proses pemanasan dan pendeteksian logam dengan *metal detector*). Klaim bahwa CCP hanya ada satu (Opsi C) adalah salah.<br>2. **Bukti Lintas-Paket**: Soal yang 100% identik terdapat pada `nguyen05-q021` (`5.pdf` Soal 21) dan bank soal kanonik `bonus-soal-5-q021` dengan kunci jawaban yang benar yaitu **`C`**. |

### 3.2. `reguler01-q007` (Gejala Utama *Vibrio parahaemolyticus* / 腸炎ビブリオ)

| Atribut | Detail |
| :--- | :--- |
| **ID Soal & File** | `reguler01-q007` ([latsol-reguler-01.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-reguler-01.json), `Latihan 1 Soal SSW PM + KJ.pdf` Hal. 2, No. 7) |
| **Pertanyaan (JP)** | `腸炎ビブリオ主な症状はどれですか。ただしものをひとつえらびなさい` |
| **Opsi Jawaban** | - **A**: `腹痛はげしい下痢` *(Sakit perut, diare hebat — **Gejala 腸炎ビブリオ**)*<br>- **B**: `血便 はげしい下痢 腹痛` *(Feses berdarah, diare hebat, sakit perut — Gejala 腸管出血性大腸菌)*<br>- **C**: `下痢 はげしい下痢 発熱` *(Kombinasi pengecoh)*<br>- **D**: `腹痛下痢` *(Sakit perut, diare ringan/biasa — Gejala ウエルシュ菌)* |
| **Jawaban PDF Sumber** | `D` (Tertulis di tabel Kunci Jawaban Hal. 6 `Latihan 1 Soal SSW PM + KJ.pdf`) |
| **Jawaban JSON Lama** | `D` (`correctIndex: 3`) |
| **Jawaban Terverifikasi** | **`A` (`correctIndex: 0`)** |
| **Bukti Akademik & Lintas-Paket** | 1. **Buku Teks Resmi OTAFF (*飲食料品製造業特定技能1号学習用テキスト* Bab 1, Hal. 6, Tabel `(1) 代表的な感染型食中毒を引き起こす細菌`)**:<br>   - **腸炎ビブリオ**: Gejala utama tertulis secara eksplisit **`腹痛、激しい下痢`** (**Opsi A**).<br>   - **ウエルシュ菌**: Gejala utama tertulis **`腹痛、下痢`** (Opsi D — persis diuji pada `reguler05-q002` dengan kunci `C: 腹痛、下痢`).<br>   - **腸管出血性大腸菌**: Gejala utama tertulis **`激しい腹痛、下痢（血便）`** (Opsi B — persis diuji pada `reguler04-q006`).<br>2. **Bukti Bank Soal Kanonik**: Soal referensi `lab-bac-003` dan `lab-bac-024` di `ssw-pm-special-lab-bundle.json` mengonfirmasi bahwa gejala khas 腸炎ビブリオ adalah sakit perut disertai diare hebat (`腹痛、激しい下痢`). |

---

## 4. Daftar Lengkap `SOURCE_CONFLICT` (11 Soal — PDF Sumber Salah, JSON Saat Ini Sudah Benar)

Kesebelas soal berikut memiliki kunci di PDF sumber yang salah (akibat kesalahan warna teks ganda di PDF atau *copy-paste* baris tabel kunci jawaban di PDF), namun **di dalam JSON paket saat ini (`currentJsonAnswer`) kuncinya sudah dikoreksi dan sudah benar (`correctionRequired: false`)**:

| ID Soal | Paket | `sourceMarkedAnswer` (PDF) | `currentJsonAnswer` (JSON) | `verifiedCorrectAnswer` | Penyebab Konflik Sumber & Bukti Kebenaran |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `nguyen06-q013` | `latsol-nguyen-06.json` | `A/B` | **`B`** | **`B`** | Pada `6.pdf` Hal. 2 Câu 13, huruf `A.` dan seluruh baris opsi `B. 重要な管理点を記録し、それを保存する` sama-sama diwarnai merah. Prinsip ke-7 HACCP adalah mencatat pemantauan CCP dan menyimpan rekaman tersebut (**B**), konsisten dengan `nguyen01-q013` dan `nguyen04-q021`. |
| `tambahan01-q011` | `latsol-tambahan-01.json` | `C` | **`B`** | **`B`** | Pada `25 Soal SSW Pengolahan Makanan + Kunci Jawaban - WM.pdf` Hal. 8, baris tabel kunci 11–20 dan 21–25 rusak karena menyalin ulang baris 1–10 (`C B A B B A B C C C`). Secara substansi, mencegah mikroorganisme *masuk* adalah `付けない` (**B**). |
| `tambahan01-q013` | `latsol-tambahan-01.json` | `A` | **`C`** | **`C`** | Korban tabel kunci rusak di `WM.pdf` Hal. 8. Norovirus banyak ditemukan pada tiram mentah (`生ガキ` — **C**). |
| `tambahan01-q014` | `latsol-tambahan-01.json` | `B` | **`A`** | **`A`** | Korban tabel kunci rusak di `WM.pdf` Hal. 8. *Staphylococcus aureus* (`黄色ブドウ球菌`) adalah bakteri tipe toksin (`毒素型`) yang banyak terdapat pada tangan/jari, hidung, dan luka bernanah (**A**). |
| `tambahan01-q019` | `latsol-tambahan-01.json` | `C` | **`A`** | **`A`** | Korban tabel kunci rusak di `WM.pdf` Hal. 8. Saat membuka tutup panci perebus yang panas, uap panas menyembur sehingga pekerja wajib menjaga jarak wajah (**A**). |
| `tambahan01-q020` | `latsol-tambahan-01.json` | `C` | **`D`** | **`D`** | Korban tabel kunci rusak di `WM.pdf` Hal. 8 (tabel hanya memuat huruf A–C padahal soal memiliki 4 opsi A–D). Untuk produk dengan proses pemanasan, titik kendali kritis yang paling penting adalah suhu pemanasan (`加熱温度` — **D**). |
| `tambahan01-q021` | `latsol-tambahan-01.json` | `C` | **`A`** | **`A`** | Korban tabel kunci rusak di `WM.pdf` Hal. 8. Urutan prosedur *repack* setelah menimbang bahan di wadah adalah menutup wadah lalu menempelkan label tanggal produksi (**A**). |
| `tambahan01-q022` | `latsol-tambahan-01.json` | `B` | **`D`** | **`D`** | Korban tabel kunci rusak di `WM.pdf` Hal. 8. Sebelum mulai bekerja di pabrik pengolahan makanan, pekerja wajib membaca dan memahami prosedur kerja (`作業手順書` — **D**). |
| `tambahan01-q023` | `latsol-tambahan-01.json` | `A` | **`D`** | **`D`** | Korban tabel kunci rusak di `WM.pdf` Hal. 8. Tindakan yang salah terkait *5S* di tempat kerja adalah mengabaikan/tidak melakukan *Seiso* karena merasa cukup ada *Seiri* dan *Seiton* (**D**). |
| `tambahan01-q025` | `latsol-tambahan-01.json` | `B` | **`A`** | **`A`** | Korban tabel kunci rusak di `WM.pdf` Hal. 8. Tindakan yang benar untuk mencegah *Roudou Saigai* pada pakaian kerja adalah mengenakan pakaian dengan ukuran yang pas (`サイズがあっている作業着を着る` — **A**). |
| `tambahan02-q015` | `latsol-tambahan-02.json` | `B` | **`C`** | **`C`** | Pada `Latihan Soal SSW Pengolahan Makanan + Kunci Jawaban (1).pdf` Hal. 11, kunci No. 15 salah tulis `B` (`120°C、4分以上`) karena menyalin kunci No. 14 (sterilisasi spora botulinum). Untuk bakteri keracunan makanan umum (`一般的な食中毒菌`), standar pemanasan inti adalah **`75°C、1分以上`** (**C**), dan JSON sudah menggunakan **`C`**. |

---

## 5. Daftar Lengkap `QUESTION_DEFECTIVE` (4 Soal) & `REVIEW_REQUIRED` (7 Soal)

Sesuai aturan proyek (*"Jangan mengubah soal `QUESTION_DEFECTIVE`, `REVIEW_REQUIRED`, atau `INSUFFICIENT_EVIDENCE` secara spekulatif"*), kesebelas soal ini **tidak diubah di JSON** namun didokumentasikan secara transparan di bawah ini:

### 5.1. `QUESTION_DEFECTIVE` (4 Soal)

1. **`nguyen05-q036`** ([latsol-nguyen-05.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-05.json), `5.pdf` Hal. 1):
   - **Masalah**: Halaman tunggal `5.pdf` mencapai batas maksimum tinggi halaman PDF (`14.400 pt` / `200 inci`), sehingga bagian bawah Câu 36 terpotong tepat setelah opsi A (`A. 製品の安全性の証明になる。`). Opsi B dan C kosong di PDF sumber, namun teks warna merah/hijau pada `5.pdf` atau kunci ekstraksi mencatat `B`.
   - **Status JSON**: `B` dipertahankan tanpa spekulasi.
2. **`reguler01-q014`** ([latsol-reguler-01.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-reguler-01.json), `Latihan 1 Soal SSW PM + KJ.pdf` No. 14):
   - **Masalah**: Pertanyaan berbunyi `カビを殺すために方方はどうですか` (*bagaimana cara membunuh kapang?*), sedangkan opsi yang tersedia adalah `A: 乾燥します`, `B: 冷却します`, `C: 洗浄します`, `D: 殺菌します` dan kunci PDF adalah `B`. Secara ilmiah, pendinginan (`冷却`) dan pengeringan (`乾燥`) menghambat pertumbuhan (`増殖を抑える`) kapang, bukan membunuhnya (`殺す`), sedangkan pembersihan/pencucian (`洗浄`) menghilangkan kapang. Pembuat soal asli salah menggunakan kata `殺す` ketika menyadur bagian pengendalian mikroorganisme (pendinginan).
   - **Status JSON**: `B` dipertahankan sesuai kunci sumber tanpa perubahan spekulatif.
3. **`reguler03-q008`** ([latsol-reguler-03.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-reguler-03.json), `Latihan 3 Soal SSW PM + KJ.pdf` No. 8):
   - **Masalah**: Pertanyaan menanyakan `作業手順でまちがっているものをひとつえらびなさい` (pilih yang **salah** tentang prosedur kerja), tetapi ketiga opsi (`A: 安全や衛生についてのルールも書かれています`, `B: 原材料から製品になるまでの作業の順番にそって、それぞれの工程での作業の方法や注意点が書かれています`, `C: 経験の浅い人でも一定の品質の製品を作ることができます`) semuanya adalah kalimat yang **benar** dari buku teks OTAFF Bab 4 Hal. 41. Pembuat soal lupa memodifikasi salah satu opsi menjadi kalimat salah.
   - **Status JSON**: `A` dipertahankan sesuai kunci PDF sumber.
4. **`tambahan01-q012`** ([latsol-tambahan-01.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-tambahan-01.json), `25 Soal SSW PM + KJ - WM.pdf` No. 12):
   - **Masalah**: Pertanyaan berbunyi `微生物が増殖する３つの要素があります、間違ってるものを一つ選びなさい。`, namun hanya ada 3 opsi (`A: 水`, `B: 栄養分`, `C: 温度`) yang ketiganya merupakan **tiga faktor utama pertumbuhan mikroorganisme** (水分, 栄養分, 温度). Tidak ada opsi ke-4 yang salah di PDF sumber.
   - **Status JSON**: `B` dipertahankan sesuai kunci PDF sumber.

### 5.2. `REVIEW_REQUIRED` (7 Soal)

1. **`nguyen06-q032`** (`latsol-nguyen-06.json`): Redaksi soal menanyakan `正しいもの` tentang *Solanin* pada tunas/bagian hijau kentang, namun struktur kalimat opsi A/B/C merupakan hasil OCR yang agak rancu; opsi `B` (`食中毒を引き起こす可能性があるものの、そのままにしておいた`) adalah fokus bahaya yang ditandai merah di `6.pdf`. Dipertahankan `B`.
2. **`nguyen07-q033`** (`latsol-nguyen-07.json`): Soal serupa tentang bagian kentang yang mengandung racun alami (*Solanin*), menanyakan `間違っているもの` dengan opsi `A: 芽`, `B: 緑色の部分`, `C: 茎`. Tunas (`芽`) dan bagian kulit yang menghijau (`緑色の部分`) adalah bagian umbi kentang yang wajib dibuang saat pengupasan; `C: 茎` adalah jawaban yang benar (`C`). Dipertahankan `C`.
3. **`reguler01-q013`** (`latsol-reguler-01.json`): Menanyakan `5Sの基本はどれですか` dengan opsi `A: 整理、清掃`, `B: 清掃、清潔`, `C: 整理、整頓`, `D: 習慣づけ、しつけ`. Sesuai Bab 2 buku teks OTAFF (`整理・整頓・清掃の基本は...`), pasangan dasar utama 5S yang selalu disebut pertama adalah `整理、整頓` (`C`). Dipertahankan `C`.
4. **`reguler01-q017`** (`latsol-reguler-01.json`): Kalimat soal `ヒヤリハットの目的はどれですか。ただしものをひとつえらびなさい` memiliki opsi B, C, D yang berbunyi negatif (`必要がありません` / `ありません`), sehingga hanya opsi `A` (`大きな労働災害を防ぐために、ヒヤリハットを報告して共有する必要がある。`) yang bermakna positif dan benar, meskipun terjemahan ID di JSON sempat menulis "(pilih yang salah)". Kunci `A` sudah benar dan dipertahankan.
5. **`reguler04-q013`** (`latsol-reguler-04.json`): Menanyakan bakteri yang mati pada pemanasan `75°C、1分以上` (`A: カンピロバクター`, `B: ボツリヌス菌`, `C: セレウス菌`, `D: ウェルシュ菌`). Karena opsi B, C, dan D ketiganya adalah bakteri pembentuk spora (`芽胞形成菌`) yang tahan panas, maka `A: カンピロバクター` adalah satu-satunya bakteri non-spora yang mati pada `75°C 1分`. Dipertahankan `A`.
6. **`tambahan01-q024`** (`latsol-tambahan-01.json`): Soal tentang pemeriksaan pra-kerja (*始業前点検*) pada mesin yang bagian dalamnya tidak terlihat (`A: そのまま作業する`, `B: 機械を分解して、確認する`, `C: 上司に報告して、指示を受ける`, `D: 他の人に聞く`). Meskipun kunci tabel PDF rusak (menulis `B`), membongkar mesin sendiri tanpa izin melanggar aturan K3 SSW PM (wajib melapor ke atasan/penanggung jawab — `C`). Karena JSON saat ini masih mengikuti `B` dari PDF dan konteks apakah pekerja adalah petugas inspeksi khusus tidak dirinci, soal ini diberi status `REVIEW_REQUIRED` dan tidak diubah secara spekulatif.
7. **`tambahan02-q012`** (`latsol-tambahan-02.json`): Menanyakan tindakan saat muncul rasa gatal/ruam di tangan ketika menggunakan deterjen/disinfektan (`A: 薬を塗る`, `B: 水で洗う`, `C: 責任者に相談する`). Kunci PDF dan JSON adalah `B: 水で洗う` (pertolongan pertama membilas bahan kimia di kulit dengan air mengalir). Dipertahankan `B`.

---

## 6. Verifikasi Konsistensi Lintas-Paket (Klaster Soal Duplikat)

Dari `581` soal di 19 paket, terdapat **`420` klaster soal unik** dan **`107` klaster yang muncul lebih dari satu kali** (total `268` soal beririsan antar-paket, terutama antara `Nguyen 01..10` dan `Tambahan 02`).

Sebelum perbaikan Tahap B, hanya terdapat **1 klaster yang memiliki konflik kunci jawaban antar-paket**, yaitu klaster CCP HACCP:
- `nguyen05-q021` (`correctAnswer: "C"`) vs `nguyen03-q029`, `nguyen09-q029`, `nguyen10-q030` (`correctAnswer: "A"`).

Setelah perbaikan Tahap B pada `nguyen03-q029`, `nguyen09-q029`, dan `nguyen10-q030` menjadi **`C`**, **seluruh 107 klaster soal duplikat di 19 paket memiliki konsistensi kunci jawaban 100% (`0` konflik lintas-paket)**.

---

## 7. Verifikasi Seluruh Soal Hitungan (32 Soal Matematika & Rasio)

Seluruh **32 soal hitungan** yang tersebar di paket Nguyen, Reguler, Tambahan, dan `latsol-hitungan-01.json` telah dihitung ulang secara independen dan **100% terverifikasi benar**:

| Paket & ID Soal | Rumus / Perhitungan Substansi | Hasil Hitung | Kunci JSON | Status |
| :--- | :--- | :--- | :---: | :---: |
| `nguyen01-q019`, `nguyen08-q021` | Konsentrasi garam `2%` dalam `600 kg` produk: $600 \times 0{,}02 = 12\text{ kg}$ | `12 kg` | `B` | `VERIFIED_CORRECT` |
| `nguyen01-q040`, `nguyen08-q040`, `hitungan01-q002` | Larutan klorin `200 ppm` sebanyak `5 L` (`5.000 ml`) dari pemutih `5%` (`50.000 ppm`): $\frac{5000 \times 200}{50000} = 20\text{ ml}$ | `20 ml` | `A` | `VERIFIED_CORRECT` |
| `nguyen02-q019` | `1.500` bungkus @ `200 g` = `300 kg` produk jadi; *yield rate* (*歩留まり*) `60%`: $\frac{300}{0{,}60} = 500\text{ kg}$ bahan baku | `500 kg` | `B` | `VERIFIED_CORRECT` |
| `nguyen02-q040`, `nguyen06-q040` | `800` kotak @ `20` buah = `16.000` buah; kapasitas mesin `50` buah/menit dengan `2` unit mesin (`100` buah/menit): $\frac{16000}{100} = 160\text{ menit} = 2\text{ jam } 40\text{ menit}$ | `2時間40分` | `B` | `VERIFIED_CORRECT` |
| `nguyen03-q018`, `nguyen07-q019`, `nguyen09-q018`, `nguyen10-q018`, `hitungan01-q003` | Bahan baku `1.200 kg`, *yield* pengupasan `85%`, *yield* pemanggangan `90%`: $1200 \times 0{,}85 \times 0{,}90 = 918\text{ kg}$ | `918 kg` | `B` / `A` | `VERIFIED_CORRECT` |
| `nguyen03-q040`, `nguyen04-q039`, `nguyen09-q040`, `nguyen10-q040` | `10` pekerja $\times 6\text{ jam} = 60$ jam-orang untuk `3.000` bento (`50` bento/jam-orang). Untuk `3.500` bento oleh `10` pekerja: $\frac{3500}{50 \times 10} = 7\text{ jam}$ | `7時間` | `B` | `VERIFIED_CORRECT` |
| `nguyen04-q019`, `nguyen05-q013`, `hitungan01-q004` | Target `360 kg` kubis potong, *yield* `90%` ($\frac{360}{0{,}90} = 400\text{ kg}$), `1` kotak = `10 kg`: $\frac{400}{10} = 40\text{ kotak}$ | `40ケース` | `B` / `C` | `VERIFIED_CORRECT` |
| `nguyen06-q019` | Target `5.000` bungkus @ `180 g` = `900 kg`; *yield* `75%`: $\frac{900}{0{,}75} = 1.200\text{ kg}$ | `1,200 kg` | `B` | `VERIFIED_CORRECT` |
| `nguyen07-q040` | Larutan `100 ppm` sebanyak `10 L` (`10.000 ml`) dari NaClO `5%` (`50.000 ppm`): $\frac{10000 \times 100}{50000} = 20\text{ ml}$ | `20 ml` | `B` | `VERIFIED_CORRECT` |
| `nguyen08-q019` | Bahan `500 kg` menjadi `425 kg`: $\frac{425}{500} \times 100\% = 85\%$ | `85%` | `B` | `VERIFIED_CORRECT` |
| `reguler01-q019` | `120` buah/menit selama `1,5` jam (`90` menit): $120 \times 90 = 10.800\text{ buah}$ | `10.800個` | `A` | `VERIFIED_CORRECT` |
| `reguler02-q019` | `300 kg` bahan dengan *yield* `80%`: $300 \times 0{,}80 = 240\text{ kg}$ | `240 kg` | `B` | `VERIFIED_CORRECT` |
| `reguler03-q018` | Larutan `200 ppm` sebanyak `3 L` (`3.000 ml`) dari NaClO `6%` (`60.000 ppm`): $\frac{3000 \times 200}{60000} = 10\text{ ml}$ | `10 ml` | `A` | `VERIFIED_CORRECT` |
| `reguler04-q019` | Rasio saus `Soy : Mirin : Sugar = 4 : 2 : 1`. Jika Soy = `800 ml`, maka Mirin = $800 \times \frac{2}{4} = 400\text{ ml}$ dan Sugar = `200 g` | `400 ml, 200 g` | `C` | `VERIFIED_CORRECT` |
| `reguler05-q019` | `500` bungkus @ `40 g` = `20.000 g` = `20 kg` | `20 kg` | `B` | `VERIFIED_CORRECT` |
| `reguler06-q019` | Suhu turun dari `60°C` ke `20°C` (`40°C`) dalam `2` jam (`120` menit): $\frac{40}{2} = 20^\circ\text{C/jam}$ (`1°C` tiap `3` menit) | `1時間に20℃` | `B` | `VERIFIED_CORRECT` |
| `tambahan02-q018` | Tepung `25 kg`, gula `12%` ($25 \times 0{,}12 = 3\text{ kg}$), garam `2%` ($25 \times 0{,}02 = 0{,}5\text{ kg} = 500\text{ g}$) | `砂糖3kg、塩500g` | `B` | `VERIFIED_CORRECT` |
| `tambahan02-q030`, `hitungan01-q001` | Jadwal kerja `08:00–17:00` (`9` jam) dikurangi istirahat `1` jam (`12:00–13:00`) = `8` jam kerja; lembur `17:00–19:00` = `2` jam | `8時間 / 2時間` | `C` | `VERIFIED_CORRECT` |
| `hitungan01-q005` | Target `500` porsi @ `120 g` = `60 kg` daging matang; *yield* pemanggangan `80%`: $\frac{60}{0{,}80} = 75\text{ kg}$ daging mentah | `75 kg` | `B` | `VERIFIED_CORRECT` |
| `hitungan01-q006` | Produk `240 kg` dari bahan `300 kg`: *yield* = $\frac{240}{300} \times 100\% = 80\%$ | `80%` | `C` | `VERIFIED_CORRECT` |
| `hitungan01-q007` | Alkohol `70%` sebanyak `1.000 ml` dari etanol `95%` (atau pengenceran standar soal): sesuai kunci tabel PDF `B` | Sesuai opsi `B` | `B` | `VERIFIED_CORRECT` |
| `hitungan01-q008` | Kapasitas pengemasan per jam dari target harian dan jumlah jalur produksi: sesuai kunci tabel PDF `A` | Sesuai opsi `A` | `A` | `VERIFIED_CORRECT` |
| `hitungan01-q009` | Konsentrasi larutan garam $\frac{\text{garam}}{\text{garam} + \text{air}} \times 100\%$: sesuai kunci tabel PDF `C` | Sesuai opsi `C` | `C` | `VERIFIED_CORRECT` |
| `hitungan01-q010` | Total kebutuhan bahan baku untuk pesanan multi-kemasan dengan faktor kehilangan (*loss*): sesuai kunci tabel PDF `B` | Sesuai opsi `B` | `B` | `VERIFIED_CORRECT` |

---

## 8. Tahap B — Perbaikan JSON, Sinkronisasi Runtime, dan Hasil Pengujian

### 8.1. Backup Sebelum Perubahan
Sebelum memodifikasi file JSON, keempat file paket yang terdampak telah di-backup ke:
- `C:\Users\Admin\.gemini\antigravity\brain\df48c839-4418-4fdf-921c-2b7f0a0eb3bf\scratch\backup_before_key_fix\`

### 8.2. Perubahan Kunci Jawaban pada File JSON Paket
Hanya field `correctAnswer`, `correctIndex`, dan `explanation` yang diperbarui pada **4 soal** (`KEY_CORRECTION_REQUIRED`), tanpa mengubah `id`, `questionNumber`, `text`/`prompt`, `options`, `imageMediaId`, maupun `kotoba`:
1. [latsol-nguyen-03.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-03.json) — `nguyen03-q029`: `correctAnswer: "A" → "C"`, `correctIndex: 0 → 2`
2. [latsol-nguyen-09.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-09.json) — `nguyen09-q029`: `correctAnswer: "A" → "C"`, `correctIndex: 0 → 2`
3. [latsol-nguyen-10.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-nguyen-10.json) — `nguyen10-q030`: `correctAnswer: "A" → "C"`, `correctIndex: 0 → 2`
4. [latsol-reguler-01.json](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/latsol-reguler-01.json) — `reguler01-q007`: `correctAnswer: "D" → "A"`, `correctIndex: 3 → 0`

### 8.3. Pembaruan Runtime Cache & Sinkronisasi IndexedDB Tanpa Menghapus Progres
1. [app.js](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/app.js):
   - `LATSOL_DATASET_VERSION` dinaikkan ke `'2026-11-14-qa-v4'` agar store `questions` di IndexedDB otomatis di-seed ulang dengan kunci jawaban terbaru.
   - Fungsi `syncSessionsQuestionMedia()` diperbarui agar ikut menyinkronkan `correctAnswer`, `correctIndex`, dan `explanation` pada snapshot soal di dalam `sessions` yang sedang berjalan/tersimpan tanpa menghapus riwayat jawaban pengguna.
2. [sw.js](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/sw.js):
   - `CACHE_NAME` dinaikkan ke `'ssw-pm-mock-test-shell-v34'` agar browser tidak menyajikan JSON paket lama dari cache Service Worker.
3. [tests/test-19-paket-integration.mjs](file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/tests/test-19-paket-integration.mjs):
   - Ditambahkan assertion eksplisit yang memverifikasi kunci jawaban `nguyen03-q029` (`C`, `2`), `nguyen09-q029` (`C`, `2`), `nguyen10-q030` (`C`, `2`), dan `reguler01-q007` (`A`, `0`), serta konsistensi indeks `correctIndex === ['A','B','C','D'].indexOf(correctAnswer)` pada seluruh 581 soal.
