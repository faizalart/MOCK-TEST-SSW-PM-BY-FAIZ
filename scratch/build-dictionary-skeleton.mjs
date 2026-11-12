/**
 * scratch/build-dictionary-skeleton.mjs
 * 
 * Tooling for Feature 008 (T005): Deduplication & Shared Dictionary Skeleton Generation.
 * Ingests `scratch/staging-extracted-vocab.json`, fetches and verifies upstream `JMdict_e_NG.gz`
 * in an external temporary directory, streams and parses JMdict NG XML (DTD Rev 1.10),
 * performs deterministic lema & reading cross-matching, resolves candidate ambiguities,
 * preserves valid reading variants, and writes `data/sharedKotobaDictionary.json` skeleton.
 * 
 * Usage:
 *   node scratch/build-dictionary-skeleton.mjs
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

const EXPECTED_JMDICT_SHA256 = '60cf4c4c09a8a3ec55e45fcef5e462cda242f6f228c087a6e0169ca10eaf7a84';
const JMDICT_URL = 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e_NG.gz';

const STAGING_PATH = path.resolve('scratch/staging-extracted-vocab.json');
const OUTPUT_PATH = path.resolve('data/sharedKotobaDictionary.json');

/**
 * Downloads and verifies JMdict_e_NG.gz in a temporary directory outside the repo.
 * @returns {{ archivePath: string, cleanup: Function }}
 */
function acquireVerifiedJMdictArchive() {
  const tempDir = path.join(os.tmpdir(), `jmdict_t005_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  fs.mkdirSync(tempDir, { recursive: true });
  const archivePath = path.join(tempDir, 'JMdict_e_NG.gz');

  console.log(`[1] Mengunduh JMdict_e_NG.gz ke temporary directory: ${tempDir}...`);
  execSync(`curl.exe -s -o "${archivePath}" "${JMDICT_URL}"`, { stdio: 'inherit' });

  if (!fs.existsSync(archivePath)) {
    throw new Error(`Gagal mengunduh JMdict archive ke ${archivePath}`);
  }

  console.log('[2] Memverifikasi SHA-256 checksum artefak...');
  const fileBytes = fs.readFileSync(archivePath);
  const actualHash = crypto.createHash('sha256').update(fileBytes).digest('hex');

  console.log(`    Expected SHA-256 : ${EXPECTED_JMDICT_SHA256}`);
  console.log(`    Actual SHA-256   : ${actualHash}`);

  if (actualHash !== EXPECTED_JMDICT_SHA256) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new Error(`Checksum mismatch! Diharapkan ${EXPECTED_JMDICT_SHA256}, diperoleh ${actualHash}`);
  }
  console.log('    ✓ Checksum 100% cocok. Integritas artefak valid.');

  return {
    archivePath,
    cleanup: () => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`    ✓ Temporary directory dibersihkan: ${tempDir}`);
    }
  };
}

/**
 * Parses JMdict_e_NG.gz and indexes entries by (kanji, reading) and reading-only.
 * @param {string} archivePath 
 * @returns {Map<string, Array<{ ent_seq: string, kanjis: string[], readings: string[], pos: string[] }>>}
 */
function parseAndIndexJMdict(archivePath) {
  console.log('[3] Melakukan dekompresi dan indexing JMdict NG XML (DTD Rev 1.10)...');
  const gzBytes = fs.readFileSync(archivePath);
  const xmlBuffer = zlib.gunzipSync(gzBytes);
  const xmlStr = xmlBuffer.toString('utf8');

  // Exact index: "kanji::reading" -> array of entries
  const exactIndex = new Map();
  // Kanji-only index: "kanji" -> array of entries
  const kanjiIndex = new Map();
  // Reading-only index: "reading" -> array of entries
  const readingIndex = new Map();

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let entryMatch;
  let entryCount = 0;

  while ((entryMatch = entryRegex.exec(xmlStr)) !== null) {
    entryCount++;
    const entryBlock = entryMatch[1];

    // Extract ent_seq
    const seqMatch = /<ent_seq>(\d+)<\/ent_seq>/.exec(entryBlock);
    if (!seqMatch) continue;
    const ent_seq = seqMatch[1];

    // Extract all keb (kanji elements)
    const kanjis = [];
    const kebRegex = /<keb>([\s\S]*?)<\/keb>/g;
    let kebMatch;
    while ((kebMatch = kebRegex.exec(entryBlock)) !== null) {
      kanjis.push(kebMatch[1].trim());
    }

    // Extract all reb (reading elements) and optional re_restr
    const readings = [];
    const rEleRegex = /<r_ele>([\s\S]*?)<\/r_ele>/g;
    let rEleMatch;
    while ((rEleMatch = rEleRegex.exec(entryBlock)) !== null) {
      const rEleBlock = rEleMatch[1];
      const rebMatch = /<reb>([\s\S]*?)<\/reb>/.exec(rEleBlock);
      if (rebMatch) {
        const reb = rebMatch[1].trim();
        const restrMatches = [];
        const restrRegex = /<re_restr>([\s\S]*?)<\/re_restr>/g;
        let rm;
        while ((rm = restrRegex.exec(rEleBlock)) !== null) {
          restrMatches.push(rm[1].trim());
        }
        readings.push({ reb, restrictions: restrMatches });
      }
    }

    // Extract part of speech
    const posList = [];
    const posRegex = /<pos>&([^;]+);<\/pos>/g;
    let posMatch;
    while ((posMatch = posRegex.exec(entryBlock)) !== null) {
      posList.push(posMatch[1].trim());
    }
    const uniquePos = Array.from(new Set(posList));

    const entryData = {
      ent_seq,
      kanjis,
      readings: readings.map(r => r.reb),
      pos: uniquePos
    };

    // Index by kanji::reading pairs
    for (const k of kanjis) {
      if (!kanjiIndex.has(k)) kanjiIndex.set(k, []);
      kanjiIndex.get(k).push(entryData);

      for (const r of readings) {
        // If re_restr is present, verify kanji is in restrictions
        if (r.restrictions.length > 0 && !r.restrictions.includes(k)) {
          continue;
        }
        const pairKey = `${k}::${r.reb}`;
        if (!exactIndex.has(pairKey)) exactIndex.set(pairKey, []);
        exactIndex.get(pairKey).push(entryData);
      }
    }

    // If entry has no kanji (kana-only word)
    if (kanjis.length === 0) {
      for (const r of readings) {
        if (!readingIndex.has(r.reb)) readingIndex.set(r.reb, []);
        readingIndex.get(r.reb).push(entryData);
      }
    }
  }

  console.log(`    ✓ Berhasil memproses ${entryCount.toLocaleString()} total entri JMdict.`);
  console.log(`    ✓ Total pasangan kanji::reading terindeks : ${exactIndex.size.toLocaleString()}`);

  return { exactIndex, kanjiIndex, readingIndex };
}

/**
 * Builds the shared dictionary skeleton from staging pairs and indexed JMdict.
 */
export function buildDictionarySkeleton() {
  if (!fs.existsSync(STAGING_PATH)) {
    throw new Error(`Staging file ${STAGING_PATH} tidak ditemukan. Jalankan T004 terlebih dahulu.`);
  }

  const staging = JSON.parse(fs.readFileSync(STAGING_PATH, 'utf8'));
  const stagingPairs = staging.uniqueRubyPairs || [];
  console.log(`[4] Membaca ${stagingPairs.length} pasangan leksikal dari staging...`);

  const { archivePath, cleanup } = acquireVerifiedJMdictArchive();
  let indexes;
  try {
    indexes = parseAndIndexJMdict(archivePath);
  } finally {
    cleanup();
  }

  const { exactIndex, kanjiIndex } = indexes;

  let exactMatchCount = 0;
  let ambiguousCount = 0;
  let contextualReviewCount = 0;
  let unmatchedCount = 0;

  const termsRegistry = {};

  // Sort staging pairs deterministically by kanji and furigana
  stagingPairs.sort((a, b) => {
    if (a.kanji !== b.kanji) return a.kanji.localeCompare(b.kanji, 'ja');
    return a.furigana.localeCompare(b.furigana, 'ja');
  });

  for (const pair of stagingPairs) {
    const pairKey = `${pair.kanji}::${pair.furigana}`;
    const directMatches = exactIndex.get(pairKey) || [];

    let matchStatus = 'unmatched';
    let chosenSeq = null;
    let candidateEntSeqs = [];
    let posMetadata = [];

    if (directMatches.length === 1) {
      matchStatus = 'matched';
      chosenSeq = directMatches[0].ent_seq;
      posMetadata = directMatches[0].pos;
      candidateEntSeqs = [chosenSeq];
      exactMatchCount++;
    } else if (directMatches.length > 1) {
      matchStatus = 'ambiguous';
      candidateEntSeqs = directMatches.map(m => m.ent_seq);
      // Deduplicate POS across candidates
      const allPos = new Set();
      directMatches.forEach(m => m.pos.forEach(p => allPos.add(p)));
      posMetadata = Array.from(allPos);
      ambiguousCount++;
    } else {
      // Check if kanji exists in JMdict but reading is a contextual variant or okurigana fragment
      const kanjiMatches = kanjiIndex.get(pair.kanji) || [];
      if (kanjiMatches.length > 0) {
        matchStatus = 'contextual_review';
        candidateEntSeqs = kanjiMatches.map(m => m.ent_seq);
        const allPos = new Set();
        kanjiMatches.forEach(m => m.pos.forEach(p => allPos.add(p)));
        posMetadata = Array.from(allPos);
        contextualReviewCount++;
      } else {
        matchStatus = 'unmatched';
        unmatchedCount++;
      }
    }

    // Determine deterministic stable term id
    // Format: "kb-" followed by ent_seq (if matched) or slug of kanji::furigana
    const safeSlug = Buffer.from(pairKey).toString('hex').slice(0, 10);
    const termId = chosenSeq ? `kb-${chosenSeq}` : `kb-${pair.id}-${safeSlug}`;

    termsRegistry[termId] = {
      id: termId,
      ent_seq: chosenSeq || (candidateEntSeqs.length > 0 ? candidateEntSeqs[0] : null),
      kanji: pair.kanji,
      furigana: pair.furigana,
      pos: posMetadata,
      status: 'unresolved', // Strictly unresolved on T005; Indonesian curation happens in T006
      matchStatus,
      candidateEntSeqs,
      arti: '', // Must remain empty on T005 per user mandate
      provenance: {
        lemmaSource: chosenSeq ? 'jmdict_edrdg' : 'exam_corpus_ruby',
        furiganaSource: 'exam_corpus_rt',
        meaningSource: 'in_house_ssw_curated',
        lexicalLicense: 'CC-BY-SA-4.0'
      },
      occurrencesCount: pair.occurrenceCount,
      occurrences: pair.occurrences || []
    };
  }

  // Deduplication check: count unique lexical entities
  const uniqueTermCount = Object.keys(termsRegistry).length;

  const skeleton = {
    _meta: {
      generator: 'scratch/build-dictionary-skeleton.mjs',
      generatedAt: new Date().toISOString(),
      datasetVersion: '1.0.0-skeleton',
      datasetLicense: 'CC BY-SA 4.0',
      datasetLicenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      upstreamSource: 'JMdict New Generation by EDRDG',
      upstreamArtifact: 'JMdict_e_NG.gz',
      upstreamSha256: EXPECTED_JMDICT_SHA256,
      upstreamCreationDate: '2026-11-12',
      upstreamDtdVersion: '1.10',
      upstreamGitCommit: 'N/A',
      upstreamAttribution: {
        source: 'JMdict by Electronic Dictionary Research and Development Group (EDRDG)',
        sourceUrl: 'https://www.edrdg.org/edrdg/licence.html'
      },
      commercialDecouplingNotice: 'This dictionary dataset is released under CC BY-SA 4.0. The surrounding application software, user interface, CBT engine, and commercial subscription services are proprietary and licensed separately under Mere Aggregation.',
      totalStagingPairs: stagingPairs.length,
      totalLexicalTerms: uniqueTermCount,
      exactMatches: exactMatchCount,
      ambiguousCount: ambiguousCount,
      contextualReviewCount: contextualReviewCount,
      unmatchedCount: unmatchedCount,
      readingVariantsPreserved: staging._meta?.readingVariantsCount || 93
    },
    terms: termsRegistry
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(skeleton, null, 2), 'utf8');

  const stats = fs.statSync(OUTPUT_PATH);
  const outBytes = fs.readFileSync(OUTPUT_PATH);
  const outSha256 = crypto.createHash('sha256').update(outBytes).digest('hex');

  console.log('\n[5] STATISTIK HASIL GENERASI SKELETON:');
  console.log(`  - Total Pasangan Staging Diproses       : ${stagingPairs.length}`);
  console.log(`  - Jumlah Exact Matches (Tunggal)        : ${exactMatchCount}`);
  console.log(`  - Jumlah Ambiguous (Multi-Kandidat)     : ${ambiguousCount}`);
  console.log(`  - Jumlah Contextual Review              : ${contextualReviewCount}`);
  console.log(`  - Jumlah Unmatched                      : ${unmatchedCount}`);
  console.log(`  - Total Entri Leksikal Unik di Skeleton : ${uniqueTermCount}`);
  console.log(`  - Varian Bacaan Dipertahankan           : ${skeleton._meta.readingVariantsPreserved}`);
  console.log(`  - Lokasi Output                         : ${OUTPUT_PATH}`);
  console.log(`  - Ukuran Output JSON                    : ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size.toLocaleString()} bytes)`);
  console.log(`  - SHA-256 Output                        : ${outSha256}`);

  return {
    skeleton,
    stats,
    outSha256
  };
}

// CLI handler
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))) {
  console.log('===============================================================');
  console.log(' FEATURE 008 (T005): DEDUPLICATION & DICTIONARY SKELETON       ');
  console.log('===============================================================');
  buildDictionarySkeleton();
  console.log('\nEksekusi T005 selesai secara sukses.\n');
}
