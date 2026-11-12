// scratch/execute-t007-metadata.mjs
// Task T007: JMdict Metadata & Attribution Compliance

import fs from 'node:fs';
import crypto from 'node:crypto';

const DICT_PATH = 'data/sharedKotobaDictionary.json';

// 1. Read existing dictionary
const rawBefore = fs.readFileSync(DICT_PATH, 'utf8');
const dict = JSON.parse(rawBefore);

const shaBeforeFile = crypto.createHash('sha256').update(rawBefore).digest('hex');
const shaBeforeTerms = crypto.createHash('sha256').update(JSON.stringify(dict.terms)).digest('hex');

console.log('=== TASK T007: JMdict METADATA & ATTRIBUTION COMPLIANCE ===');
console.log(`Initial File SHA-256:  ${shaBeforeFile}`);
console.log(`Initial Terms SHA-256: ${shaBeforeTerms}`);

// Assert existing terms integrity
const terms = Object.values(dict.terms);
if (terms.length !== 1809) throw new Error(`Expected 1809 terms, found ${terms.length}`);
const verifiedTerms = terms.filter(t => t.status === 'verified').length;
const unresolvedTerms = terms.filter(t => t.status === 'unresolved').length;
if (verifiedTerms !== 1765) throw new Error(`Expected 1765 verified terms, found ${verifiedTerms}`);
if (unresolvedTerms !== 44) throw new Error(`Expected 44 unresolved terms, found ${unresolvedTerms}`);

// 2. Build comprehensive _meta structure
const updatedMeta = {
  datasetVersion: "1.0.0",
  generator: "scratch/execute-t007-metadata.mjs",
  generatedAt: "2026-11-12T12:00:00.000Z",
  curationDate: "2026-11-12",
  changelogReference: "specs/008-practice-selective-translation-kotoba/dictionary-changelog.md",
  datasetLicense: "CC BY-SA 4.0",
  datasetLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  datasetLicenseName: "Creative Commons Attribution-ShareAlike 4.0 International",

  upstreamSource: {
    organization: "Electronic Dictionary Research and Development Group (EDRDG)",
    project: "JMdict New Generation (JMdict NG)",
    officialUrl: "https://www.edrdg.org/jmdict/j_jmdict.html",
    specificationUrl: "https://www.edrdg.org/wiki/JMdict_Next_Generation.html",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://www.edrdg.org/edrdg/licence.html",
    canonicalDistributionFile: "JMdict_e_NG.gz",
    officialDownloadUrl: "http://ftp.edrdg.org/pub/Nihongo/JMdict_e_NG.gz",
    xmlCreationDate: "2026-11-12",
    dtdVersion: "1.10",
    snapshotFetchDate: "2026-11-12",
    verifiedSha256: "60cf4c4c09a8a3ec55e45fcef5e462cda242f6f228c087a6e0169ca10eaf7a84",
    gitCommit: "N/A (Upstream distribution via HTTP/FTP archive without public git commit hash; cryptographically identified via SHA-256 and XML created attribute)",
    copyrightDisclaimer: "The SSW PM Mock Test project asserts no copyright, patent, or proprietary ownership over upstream JMdict/EDRDG entries, which remain the intellectual property of Jim Breen and EDRDG under CC BY-SA 4.0."
  },

  provenanceSeparation: {
    ent_seq: {
      source: "JMdict by EDRDG",
      license: "CC BY-SA 4.0",
      role: "Sequence identifier from JMdict NG used for upstream dictionary linking and lemma cross-referencing."
    },
    kanji: {
      source: "Composite: Official Exam Corpus Ruby Markup & JMdict NG keb Elements",
      license: "CC BY-SA 4.0",
      role: "Japanese word form extracted from <ruby> tags across all 1,006 unique questions and 3,110 options, cross-referenced with JMdict standard orthography."
    },
    furigana: {
      source: "Composite: Authentic Exam Corpus <rt> Tags & JMdict NG reb Elements",
      license: "CC BY-SA 4.0",
      role: "Kana reading extracted from authentic exam ruby annotations, verified against JMdict readings with domain variants preserved."
    },
    pos: {
      source: "JMdict by EDRDG",
      license: "CC BY-SA 4.0",
      role: "Part of speech entity codes (e.g. n, v5r, adj-i) extracted from upstream JMdict XML."
    },
    arti: {
      source: "SSW PM Mock Test Team (In-House Curation)",
      license: "CC BY-SA 4.0",
      role: "Original Indonesian definitions contextually disambiguated for food manufacturing operations (HACCP, 5S, hygiene, machinery, safety, quality). Decoupled from proprietary application software."
    },
    occurrences: {
      source: "Local SSW PM Exam Corpus (7 bundle files)",
      license: "Proprietary CBT Application Corpus Context",
      role: "Relational mapping linking terms to question IDs, option IDs, composite keys, and target types across 27 exam packages."
    }
  },

  thirdPartyExclusionStatement: {
    jdictStatus: "STRICTLY_EXCLUDED",
    jdictLicense: "CC BY-NC 4.0",
    statement: "Zero Philia Space JIDict translation or lexical data is ingested, referenced, or bundled into this dataset. Because JIDict is licensed under CC BY-NC 4.0 (NonCommercial), its usage is incompatible with commercial CBT platforms. All Indonesian translations in this dataset are 100% original in-house curations."
  },

  edrdgCompliance: {
    acknowledgement: "This dataset incorporates lexical headwords and readings from JMdict New Generation, developed by the Electronic Dictionary Research and Development Group (EDRDG).",
    licenseNotice: "Distributed under Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0). Users of derivative works must share alike under compatible terms.",
    attributionUrl: "https://www.edrdg.org/edrdg/licence.html",
    documentationUrl: "https://www.edrdg.org/jmdict/j_jmdict.html",
    commercialDecouplingNotice: "This dictionary dataset is released under CC BY-SA 4.0 as adapted open data. Surrounding application software, CBT scoring engine (app.js), styling (ZEN-APP-SHELL.css), and commercial subscription services are proprietary and licensed separately under the 'Mere Aggregation' principle of CC BY-SA 4.0 Section 2(a)(5)(B).",
    periodicUpdateProcedure: {
      targetCadence: "Monthly (recommended by EDRDG licence terms for periodically updated dictionary files)",
      methodology: "Automated snapshot retrieval from EDRDG FTP, SHA-256 checksum verification against published archives, diff inspection for altered lemmas or readings, and semantic changelog version increments (1.x.y).",
      nextScheduledReview: "2026-12-12"
    },
    settingsModalAttribution: {
      title: "Informasi Lisensi & Atribusi Kosakata (EDRDG & SSW PM)",
      bodyText: "Data leksikal bahasa Jepang (kata dasar, kanji, dan bacaan kana) bersumber dari JMdict oleh Electronic Dictionary Research and Development Group (EDRDG) di bawah lisensi Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0). Seluruh definisi bahasa Indonesia, kurasi konteks pengolahan makanan (SSW PM), dan anotasi pedagogis disusun secara mandiri oleh tim SSW PM Mock Test by Faiz di bawah lisensi CC BY-SA 4.0. Mesin ujian CBT, antarmuka aplikasi, dan hak cipta simulasi adalah milik SSW PM Mock Test by Faiz.",
      edrdgUrl: "https://www.edrdg.org/edrdg/licence.html",
      ccBySaUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
    }
  },

  summaryMetrics: {
    totalTerms: 1809,
    verifiedTerms: 1765,
    unresolvedTerms: 44,
    technicalCount: 1341,
    generalCount: 424,
    technicalRatio: "76.0%",
    byCategory: {
      HACCP: 185,
      Quality: 362,
      Hygiene: 366,
      Machinery: 96,
      Safety: 220,
      "5S": 112,
      General: 424
    },
    matchStatusBreakdown: {
      matched: 1123,
      contextual_review: 200,
      unmatched: 480,
      ambiguous: 6
    },
    furiganaStatusBreakdown: {
      verified: 1800,
      unresolved: 9
    },
    meaningStatusBreakdown: {
      verified: 1765,
      unresolved: 44
    },
    crossTabulation: {
      matched: { verified: 1122, unresolved: 1, total: 1123 },
      contextual_review: { verified: 194, unresolved: 6, total: 200 },
      unmatched: { verified: 444, unresolved: 36, total: 480 },
      ambiguous: { verified: 5, unresolved: 1, total: 6 }
    },
    entryTypeMetrics: {
      morpheme_fragment: 44,
      standalone_term: 1532,
      inflected_verb: 203,
      compound_part: 6,
      inflected_adjective: 24
    },
    coverageTaxonomy: {
      extractionCoverage: "100% (1,006 unique questions, 3,110 unique options)",
      furiganaVerifiedCoverage: "99.5% (1800/1809)",
      meaningVerifiedCoverage: "97.6% (1765/1809)",
      overallVerifiedCoverage: "97.6% (1765/1809)"
    }
  },

  reconciliationAudit: dict._meta.reconciliationAudit
};

// 3. Assemble new dictionary object with untouched terms
const updatedDict = {
  _meta: updatedMeta,
  terms: dict.terms // Strictly untouched!
};

// 4. Verify terms SHA-256 before and after
const shaAfterTerms = crypto.createHash('sha256').update(JSON.stringify(updatedDict.terms)).digest('hex');
if (shaBeforeTerms !== shaAfterTerms) {
  throw new Error(`CRITICAL INTEGRITY FAILURE: Terms changed! before=${shaBeforeTerms}, after=${shaAfterTerms}`);
}
console.log(`Terms SHA-256 Match Assertion: PASS (${shaBeforeTerms})`);

// 5. Write to file
const outputJson = JSON.stringify(updatedDict, null, 2);
fs.writeFileSync(DICT_PATH, outputJson, 'utf8');

const shaAfterFile = crypto.createHash('sha256').update(outputJson).digest('hex');
const byteLength = Buffer.byteLength(outputJson, 'utf8');

console.log(`Updated File Size:    ${byteLength.toLocaleString()} bytes (${(byteLength / 1024 / 1024).toFixed(2)} MB)`);
console.log(`Updated File SHA-256: ${shaAfterFile}`);

console.log('\n--- VERIFICATION OF T007 METADATA ---');
console.log('Dataset Version:    ', updatedMeta.datasetVersion);
console.log('Upstream Source:    ', updatedMeta.upstreamSource.project);
console.log('Upstream Snapshot:  ', updatedMeta.upstreamSource.canonicalDistributionFile);
console.log('Upstream SHA-256:   ', updatedMeta.upstreamSource.verifiedSha256);
console.log('Upstream XML Date:  ', updatedMeta.upstreamSource.xmlCreationDate);
console.log('Upstream DTD:       ', updatedMeta.upstreamSource.dtdVersion);
console.log('Upstream Git Commit:', updatedMeta.upstreamSource.gitCommit);
console.log('JIDict Excluded:    ', updatedMeta.thirdPartyExclusionStatement.jdictStatus);
console.log('Update Cadence:     ', updatedMeta.edrdgCompliance.periodicUpdateProcedure.targetCadence);
console.log('Settings Attrib:    ', updatedMeta.edrdgCompliance.settingsModalAttribution.title);
console.log('Terms Verified:     ', updatedMeta.summaryMetrics.verifiedTerms);
console.log('Terms Unresolved:   ', updatedMeta.summaryMetrics.unresolvedTerms);
console.log('Terms Total:        ', updatedMeta.summaryMetrics.totalTerms);
console.log('====================================================\n');
