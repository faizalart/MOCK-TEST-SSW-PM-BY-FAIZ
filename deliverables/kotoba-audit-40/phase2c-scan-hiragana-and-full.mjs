import fs from 'node:fs';
import {
  hasKanji,
  stripRubyAndHtml,
  extractQuestionPlainText,
  extractOptionId,
  extractOptionPlainText,
} from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const manifest = JSON.parse(fs.readFileSync('deliverables/kotoba-audit-40/target-manifest.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('data/kotobaMapping.json', 'utf8'));

// Known particles / auxiliary verb endings that should NOT trigger false positives
const PURE_GRAMMAR = new Set([
  'を', 'の', 'に', 'が', 'は', 'で', 'と', 'や', 'も', 'へ', 'か', 'ね', 'よ', 'な', 'だ', 'て', 'た', 'ば', 'ず',
  'する', 'し', 'した', 'して', 'しない', 'せず', 'される', 'され', 'された', 'されて', 'できる', 'でき', 'できた', 'できない',
  'いる', 'い', 'いた', 'いて', 'いない', 'おり', 'いては', 'いても', 'いないか',
  'ある', 'あり', 'あっ', 'あった', 'あって', 'ありません', 'あります',
  'なる', 'なり', 'なっ', 'なった', 'なって', 'なら', 'なります', 'ならない',
  'ない', 'なく', 'なかっ', 'なかった', 'ないで', 'ないか',
  'です', 'ます', 'ました', 'ません', 'ませんでした', 'でした', 'ですか', 'ますか', 'ませんか', 'ましょう',
  'である', 'であり', 'であった', 'ではない', 'ではなく', 'でない', 'ではないか',
  'から', 'まで', 'より', 'における', 'についての', 'について', 'に対して', 'にとって', 'として', 'とは',
  'ながら', 'たり', 'だり', 'ても', 'でも', 'なら', 'しかし', 'また', 'および', 'または', 'なお', 'つまり',
  'この', 'その', 'あの', 'どの', 'ここ', 'そこ', 'あそこ', 'そんな', 'こんな', 'あんな', 'どんな',
  'って', 'る', 'れる', 'られる', 'せる', 'させる', 'ておく', 'おく', 'おき', 'おいて', 'しまう', 'しまい', 'しまった', 'くれる',
  'よう', 'ように', 'ような', 'そう', 'そうに', 'という', 'といった', 'とか', 'だけ', 'しか', 'ばかり', 'ほど', 'くらい', 'ぐらい', 'こそ', 'さえ', 'ごと', 'ごとに',
  'のです', 'ためです', 'からです', 'おらず', 'だろう', 'ところ', 'とおり', 'どおり', 'あたり', 'わけ', 'はず', 'べき', 'べく',
  'ください', 'なさい', 'なさいませ', 'もの', 'こと', 'ため', 'ためです', 'などに', 'など', 'ので', 'のに', 'ほか', 'ほかの',
  'よい', 'いい', 'よいか', 'いいか', 'ています', 'ていない', 'ている', 'ていた', 'てはいけません', 'てはいけない',
  'なければなりません', 'なければならない', 'なければ', 'なくても', 'なくてもよい', 'てもよい', 'てもいい',
  'られます', 'られる', 'れます', 'れる', 'させます', 'させる', 'されました', 'された', 'される',
  'ましょうか', 'でしょうか', 'ですか', 'ますか', 'ませんか',
]);

// Build set of ALL >=2 char verified dict surfaces
const dictByFirstChar = new Map();
for (const e of Object.values(dict.terms || {})) {
  if (!e || e.status !== 'verified' || !e.kanji || [...e.kanji].length < 2) continue;
  if (PURE_GRAMMAR.has(e.kanji)) continue;
  const c = e.kanji[0];
  if (!dictByFirstChar.has(c)) dictByFirstChar.set(c, []);
  dictByFirstChar.get(c).push(e.kanji);
}
for (const arr of dictByFirstChar.values()) arr.sort((a, b) => b.length - a.length);

const segJa = new Intl.Segmenter('ja', { granularity: 'word' });
const PREFIX_MARKER_RE = /^(?:\[(?:イラスト|標識|図|写真|品目|保護具)[A-Za-z0-9]+\]\s*)+/u;

const unmappedHiraFreq = new Map();
const unmappedKnownDictIn50 = new Map();

for (const pm of manifest.packages) {
  if (pm.role !== 'target_repair_50') continue;
  const raw = JSON.parse(fs.readFileSync(pm.sourcePath, 'utf8'));
  const qs = (Array.isArray(raw) ? raw : raw.questions || []).filter(q => (q.setId || raw.setId || pm.setId) === pm.setId);

  for (const q of qs) {
    const ctxs = [[q.id, q.prompt || q.questionText || extractQuestionPlainText(q), mapping.questions?.[q.id] || []]];
    for (let i = 0; i < (q.options || []).length; i++) {
      const o = q.options[i];
      const oid = extractOptionId(o, i);
      const ck = `${q.id}::${oid}`;
      ctxs.push([ck, o.text || extractOptionPlainText(o), mapping.byCompositeKey?.[ck] || []]);
    }

    for (const [ck, html, ids] of ctxs) {
      const plain = stripRubyAndHtml(String(html).replace(/\*\*/g, '')).replace(PREFIX_MARKER_RE, '');
      const mask = new Uint8Array(plain.length);
      for (const id of ids) {
        const k = dict.terms[id]?.kanji;
        if (!k) continue;
        let idx = plain.indexOf(k);
        while (idx !== -1) {
          for (let p = idx; p < idx + k.length; p++) mask[p] = 1;
          idx = plain.indexOf(k, idx + 1);
        }
      }

      // Check uncovered segments that are pure hiragana (>=2 chars)
      for (const seg of segJa.segment(plain)) {
        const w = seg.segment;
        if (!/^[\u3041-\u3096ー]{2,}$/.test(w)) continue;
        let anyCov = false;
        for (let p = seg.index; p < seg.index + w.length; p++) {
          if (mask[p]) { anyCov = true; break; }
        }
        if (anyCov) continue;
        if (PURE_GRAMMAR.has(w)) continue;
        const rec = unmappedHiraFreq.get(w) || { count: 0, sample: plain.slice(0, 70), cohorts: new Set() };
        rec.count++;
        rec.cohorts.add(pm.cohort);
        unmappedHiraFreq.set(w, rec);
      }

      // Check known >=2-char dict words appearing cleanly in Cohorts 2, 3, 4 ONLY (not Cohort 1 where already audited differently)
      if (pm.cohort !== 'cohort_1_spec009_canonical') {
        let i = 0;
        while (i < plain.length) {
          if (mask[i]) { i++; continue; }
          const cands = dictByFirstChar.get(plain[i]) || [];
          let hit = null;
          for (const cand of cands) {
            if (!plain.startsWith(cand, i)) continue;
            let ok = true;
            for (let p = i; p < i + cand.length; p++) if (mask[p]) { ok = false; break; }
            if (!ok) continue;
            const prev = i > 0 ? plain[i - 1] : '';
            const next = i + cand.length < plain.length ? plain[i + cand.length] : '';
            if (hasKanji(cand[0]) && hasKanji(prev)) continue;
            if (hasKanji(cand[cand.length - 1]) && hasKanji(next)) continue;
            if (/^[\u3041-\u3096]+$/.test(cand) && (/[\u3041-\u3096]/.test(prev) || /[\u3041-\u3096]/.test(next))) continue;
            hit = cand;
            break;
          }
          if (hit) {
            const rec = unmappedKnownDictIn50.get(hit) || { count: 0, sample: plain.slice(0, 60) };
            rec.count++;
            unmappedKnownDictIn50.set(hit, rec);
            i += hit.length;
          } else i++;
        }
      }
    }
  }
}

console.log('=== TOP 100 UNCOVERED >=2-CHAR HIRAGANA SEGMENTS ACROSS 50 TARGETS ===');
for (const [w, r] of [...unmappedHiraFreq.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 100)) {
  console.log(`${w} (${r.count}) [${[...r.cohorts].join(',')}] -> ${r.sample}`);
}

console.log('\n=== TOP 60 UNCOVERED KNOWN DICT TERMS IN COHORTS 2+3+4 ===');
for (const [w, r] of [...unmappedKnownDictIn50.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 60)) {
  console.log(`${w} (${r.count}) -> ${r.sample}`);
}
