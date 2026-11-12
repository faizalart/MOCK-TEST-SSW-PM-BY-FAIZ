# Phase 0 Research: Practice Mode Selective Translation & Kotoba Reveal (Pathway B Provenance Architecture)

**Feature**: `specs/008-practice-selective-translation-kotoba`  
**Date**: 2026-11-12 (Updated: Verified JMdict Technical Specifications & Provenance Audit)  
**Status**: Decided — Pathway B with Decoupled Provenance Architecture (T001 Verified)  
**Target Branch**: `feat/practice-selective-translation-kotoba`

---

## 1. Executive Summary & Strategic Decision

Feature 008 introduces granular Sentence Translation and technical vocabulary (Kotoba) reveal for untimed CBT Practice Mode across **all 1,006 unique questions and 3,110 unique answer options across all 27 packages**.

### Strategic Decision: Pathway B with Strict Provenance Separation
1. **Zero JIDict CC BY-NC 4.0 Ingestion**: The project strictly rejects bundling or relying upon Philia Space JIDict data to avoid commercial restriction conflicts with the platform's commercial and subscription features.
2. **JMdict (EDRDG) Integration**: Uses JMdict strictly for base Japanese lemmas, kanji standard forms, and kana readings (furigana), operating in compliance with **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**.
3. **Decoupled Field Provenance**: Field-by-field provenance tracking cleanly separates upstream lemma data from Indonesian pedagogical definitions.
4. **Original Indonesian Curation**: All Indonesian definitions are authored and contextually disambiguated specifically for the SSW Food Manufacturing domain (特定技能1号・飲食料品製造業), cross-checked with official exam textbooks.
5. **Ruby Annotation Cross-Check**: Leverages the pre-existing `<ruby><rt>` markup in the 1,006 questions and 3,110 options as primary empirical evidence to cross-verify kanji-furigana pairings against JMdict.
6. **No "100% Copyright-Clear" False Claims**: We do not claim this strategy is "copyright-free" or "100% clean IP without conditions". All legal obligations imposed by CC BY-SA 4.0 (Attribution and ShareAlike on derivative datasets) are explicitly documented, engineered, and maintained.

---

## 2. CC BY-SA 4.0 Legal Impact & Architectural Decoupling

### 2.1 Understanding ShareAlike (SA) on Lexicographical Data
Under CC BY-SA 4.0:
- **ShareAlike Clause**: If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original (CC BY-SA 4.0).
- **Impact on Dataset**: A vocabulary database combining JMdict lemmas with curated Indonesian definitions constitutes an *Adapted Material / Derivative Database*. Therefore, the vocabulary dataset asset itself (`sharedKotobaDictionary.json`) **must be released under CC BY-SA 4.0**, permitting others to share and adapt the dictionary data with proper attribution.

### 2.2 Commercial Viability & Subscription Model Protection (Decoupling via Mere Aggregation)
- **Software vs. Data Separation (Mere Aggregation)**:
  Under international copyright jurisprudence and Creative Commons guidelines, bundling an open CC BY-SA dataset with proprietary application code does **not** "infect" or copyleft the surrounding application software, provided there is a clear architectural boundary:
  - **Proprietary Application Layer**: `app.js`, CBT examination engine, user session management, IndexedDB storage wrapper, UI styling (`ZEN-APP-SHELL.css`), scoring algorithms, and commercial/subscription access control remain strictly proprietary under all-rights-reserved commercial terms.
  - **Open Lexicographical Dataset Layer**: `sharedKotobaDictionary.json` is treated as a modular, standalone lexicographical asset licensed under CC BY-SA 4.0.
- **Result**: The project can monetize access to the CBT Mock Test platform, charge subscriptions for simulation features, and maintain commercial software while maintaining full compliance with EDRDG's ShareAlike mandate.

---

## 3. Attribution Delivery & Web UI Placement

### 3.1 EDRDG Attribution Requirements
EDRDG mandates that any product using JMdict data must provide clear attribution and a link to the EDRDG license page.

### 3.2 UI Delivery Points
1. **Exam Settings Modal (`⚙`)**:
   A dedicated collapsible section labeled **"Informasi Lisensi & Atribusi Kosakata"** within the CBT Settings Popover.
2. **Review & About / Footer Modal**:
   An accessible legal attribution block displayed on the Settings/About page.
3. **Exact Attribution Notice**:
   > *"Data leksikal bahasa Jepang (kata dasar, kanji, dan bacaan kana) bersumber dari **JMdict** oleh **Electronic Dictionary Research and Development Group (EDRDG)** di bawah lisensi [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).  
   > Seluruh terjemahan bahasa Indonesia, kurasi konteks pengolahan makanan (SSW PM), dan anotasi pedagogis disusun secara mandiri oleh tim SSW PM Mock Test by Faiz. Dataset kosakata ini dilisensikan kembali di bawah CC BY-SA 4.0. Mesin ujian CBT, antarmuka aplikasi, dan hak cipta simulasi adalah milik SSW PM Mock Test by Faiz."*

---

## 4. Technical Specifications: JMdict Upstream Verification (T001 Final)

### 4.1 Upstream Source & Canonical Distribution
- **Entity**: Electronic Dictionary Research and Development Group (EDRDG), spearheaded by Jim Breen.
- **Official Home & Documentation**: [https://www.edrdg.org/jmdict/j_jmdict.html](https://www.edrdg.org/jmdict/j_jmdict.html)
- **Official License Terms**: [https://www.edrdg.org/edrdg/licence.html](https://www.edrdg.org/edrdg/licence.html)
- **Official NG Specification**: [https://www.edrdg.org/wiki/JMdict_Next_Generation.html](https://www.edrdg.org/wiki/JMdict_Next_Generation.html)
- **Canonical Distribution File Selected**: `JMdict_e_NG.gz` (HTTP: `http://ftp.edrdg.org/pub/Nihongo/JMdict_e_NG.gz`, FTP: `ftp://ftp.edrdg.org/pub/Nihongo/JMdict_e_NG.gz`).

### 4.2 Comparison: Legacy `JMdict_e.gz` vs New Generation `JMdict_e_NG.gz`

Pada 8 Mei 2026, EDRDG secara resmi meluncurkan **JMdict New Generation (NG)**, sebuah perombakan struktural pertama dalam dua dekade:

| Parameter Evaluasi | Legacy `JMdict_e.gz` | New Generation `JMdict_e_NG.gz` (Selected) |
| :--- | :--- | :--- |
| **Status Upstream** | Legacy / Deprecated | **Standar Aktif Resmi EDRDG** |
| **Versi DTD** | DTD Rev 1.09 | **DTD Rev 1.10 ("XML Next Generation")** |
| **Atribut Root Element** | `<JMdict>` (tanpa atribut) | **`<JMdict created="2026-11-12" version="1.10">`** |
| **Struktur `<xref>`** | Teks polos tanpa referensi id | **Atribut terstruktur (`type`, `seq`, `dict`, `sno`, `xk`, `xr`)** |
| **Struktur `<lsource>`** | Di dalam elemen `<sense>` | **Dipindahkan ke level `<entry>`** |
| **Elemen `<info>`** | Tidak ada pada level entry | **Tersedia pada level `<entry>`** |
| **Ukuran File (gzip)** | 10.596.524 bytes | **11.035.752 bytes** |
| **Integritas SHA-256** | `d2e7dcfa4a155cd00db9c995373465b3782f71cbb1e35a83ef3101f0400c9535` | **`60cf4c4c09a8a3ec55e45fcef5e462cda242f6f228c087a6e0169ca10eaf7a84`** |
| **Kompatibilitas Lema** | `<keb>` & `<reb>` standar | **`<keb>` & `<reb>` standar 100% identik** |

**Keputusan & Rekomendasi**:
Proyek mengadopsi **`JMdict_e_NG.gz`** sebagai satu-satunya sumber data leksikal kanonis. Format NG adalah standar masa depan EDRDG dan menyediakan atribut `created` serta `version` bawaan di root XML untuk verifikasi snapshot yang deterministik.

### 4.3 Provenance & Identitas Artefak Snapshot Terverifikasi
- **Nama File**: `JMdict_e_NG.gz`
- **URL Sumber Resmi**: `http://ftp.edrdg.org/pub/Nihongo/JMdict_e_NG.gz`
- **Tanggal Pembuatan dalam XML**: `2026-11-12` (atribut `created="2026-11-12"`)
- **Versi DTD**: `1.10` (atribut `version="1.10"`)
- **Tanggal Pengambilan (Fetch Date)**: `2026-11-12`
- **SHA-256 File**: `60cf4c4c09a8a3ec55e45fcef5e462cda242f6f228c087a6e0169ca10eaf7a84`
- **Upstream Git Commit Hash / Tag**: **Tidak Tersedia (N/A)**. Distribusi resmi EDRDG dilakukan melalui snapshot build arsip HTTP/FTP tanpa Git commit hash publik. Identitas kanonis artefak dipatok secara kriptografis menggunakan **SHA-256 hash** dan atribut XML `created`.

### 4.4 Multi-Language Policy & JIDict Rejection
EDRDG secara resmi menyatakan:
> *"The copyright of the translations into French, German, Russian, etc. is held by the respective compilers."*

**Implikasi untuk Feature 008**:
- JIDict (Philia Space) adalah kompilasi terpisah di bawah **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.
- Atribusi **tidak membatalkan** larangan NonCommercial.
- Menyertakan data JIDict ke dalam simulator CBT dengan fitur langganan/komersial melanggar lisensi CC BY-NC.
- Oleh karena itu, Feature 008 murni menggunakan **lema & bacaan JMdict NG (CC BY-SA 4.0) + Kurasi Mandiri Bahasa Indonesia (CC BY-SA 4.0)**.

### 4.5 Upstream Snapshot Tracking in Metadata
In `sharedKotobaDictionary._meta`:
```json
{
  "datasetVersion": "1.0.0",
  "jmdictArtifact": "JMdict_e_NG.gz",
  "jmdictCreationDate": "2026-11-12",
  "jmdictDtdVersion": "1.10",
  "jmdictFetchDate": "2026-11-12",
  "jmdictSha256": "60cf4c4c09a8a3ec55e45fcef5e462cda242f6f228c087a6e0169ca10eaf7a84",
  "jmdictGitCommit": "N/A (Upstream distribution via HTTP/FTP archive without public git commit)",
  "license": "CC BY-SA 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
  "upstreamAttributionUrl": "https://www.edrdg.org/edrdg/licence.html"
}
```

### 4.5 Maintenance & Errata Procedure
1. **Quarterly Review**: Periodic review of EDRDG errata logs for corrections to kanji standard forms or readings.
2. **Versioned Asset Delivery**: Dictionary updates increment semantic versions (`1.0.0` -> `1.1.0`) stored in the static asset directory and cached via Service Worker (`sw.js`).
3. **Change Logging**: All modifications, corrections to readings, or additions of new Indonesian contextual definitions are documented in `specs/008-practice-selective-translation-kotoba/dictionary-changelog.md`.

---

## 5. Ruby Cross-Check Methodology

The 1,006 unique questions and 3,110 unique options contain authentic `<ruby><rt>` tags extracted directly from official SSW PM exam source documents:
- Example: `<ruby>衛生<rt>えいせい</rt></ruby>`, `<ruby>原材料<rt>げんざいりょう</rt></ruby>`, `<ruby>整頓<rt>せいとん</rt></ruby>`.
- **Validation Pipeline**:
  1. Extract `(kanji, furigana)` pairs directly from the exam prompt and option markup.
  2. Query JMdict base records to verify that the reading matches standard Japanese lexicography.
  3. Where an exam reading represents a domain-specific standard or okurigana variant, log it as verified against exam corpus.
  4. Author the Indonesian definition in-house matching SSW Food Manufacturing requirements.

---

## 6. Contextual Disambiguation in Food Manufacturing

Polysemous Japanese words must be disambiguated to reflect industrial food processing operations:
- `仕込み`: Must resolve to *"persiapan bahan / proses peracikan awal"* (bukan *"persiapan panggung/teater"*).
- `盛付け`: Must resolve to *"penataan porsi / plating makanan"* (bukan sekadar *"dekorasi"*).
- `揚げる`: Must resolve to *"menggoreng (dengan minyak banyak / deep fry)"* (bukan *"mengibarkan/menaikkan"*).
- `だま`: Must resolve to *"gumpalan tepung / adonan yang belum larut"*.
- `芯`: Must resolve to *"bagian tengah / pusat (makanan / suhu pusat)"*.

### Handling Unresolved Entries
- Any term that cannot be cross-verified against official textbook context is marked `status: 'unresolved'`.
- Machine translation results (e.g. Google Translate, DeepL, or zero-shot LLM prompts) MUST NOT be deemed verified data.
- Unresolved terms are tracked transparently in the audit ledger and omitted from UI render.
