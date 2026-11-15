import fs from 'node:fs';
import path from 'node:path';
import {
  hasKanji,
  isSingleKanji,
  isValidHiraganaReading,
  stripRubyAndHtml,
  extractQuestionPlainText,
  extractOptionId,
  extractOptionPlainText,
} from '../../scripts/lib/kotoba-pipeline-utils.mjs';
import {
  PURE_PARTICLES,
  HIRA_LEXICAL,
  SEGMENT_ATTACHED_PARTICLES,
  TECHNICAL_ASCII,
  cleanContextText,
  buildKnownLexiconIndex,
  validateStrictContext,
} from './validate-batch.mjs';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'deliverables/kotoba-audit-40');

const manifest = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'target-manifest.json'), 'utf8'));
const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sharedKotobaDictionary.json'), 'utf8'));
const mapping = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotobaMapping.json'), 'utf8'));

// Exclusion set for broken/fragment legacy master entries that shouldn't be auto-picked
const MASTER_EXCLUDE_KANJI = new Set([
  'ぶら', '込', '挙', '殺', '受', '応', '脱', '慣', '移', '除', '黙', '付', '対',
  '端', '油', '下', '割', '話', '業', '違', '属', '機', '器', '渡', '居', '剤', '為',
  'ぶつか', 'はなぜ', 'ければ', 'だし', '計画通', '仕組', 'とは', 'すると', 'はな', '近づ', '煮込',
  '粘着ローラ',
]);

const masterBySurface = new Map();
for (const [id, e] of Object.entries(dict.terms || {})) {
  if (!e || e.status !== 'verified' || !e.kanji) continue;
  if (e.unitType === 'morpheme_fragment' || e.entryType === 'morpheme_fragment') continue;
  if (e.furigana === 'たんご') continue;
  if (id === 'kb-u1416-3f4581a001') continue; // bad '・' reading; use kb-otaff51-0688 instead
  const k = e.kanji.trim();
  if (MASTER_EXCLUDE_KANJI.has(k)) continue;
  if (!masterBySurface.has(k)) masterBySurface.set(k, []);
  masterBySurface.get(k).push({ id, ...e });
}

function pickBestMaster(surface) {
  const hits = masterBySurface.get(surface) || [];
  if (!hits.length) return null;
  const sorted = [...hits].sort((a, b) => {
    const scoreA =
      (a.furigana && /^[\u3041-\u3096ー]+$/.test(a.furigana) ? 4 : 0) +
      (a.arti && a.arti.length <= 60 ? 2 : 0) +
      (a.id.startsWith('kb-otaff51-') ? 1 : 0);
    const scoreB =
      (b.furigana && /^[\u3041-\u3096ー]+$/.test(b.furigana) ? 4 : 0) +
      (b.arti && b.arti.length <= 60 ? 2 : 0) +
      (b.id.startsWith('kb-otaff51-') ? 1 : 0);
    return scoreB - scoreA;
  });
  return sorted[0];
}

// Parse <ruby> spans for auto-reading extraction on unknown surfaces
function parseHtmlRuby(html) {
  const s = String(html || '')
    .replace(/\*\*/g, '')
    .replace(/^(?:\[(?:イラスト|標識|図|写真|品目|保護具|画像)[A-Za-z0-9]+\]\s*)+/u, '');
  let plain = '';
  const rubySpans = [];
  let last = 0;
  const re = /<ruby>([^<]+)<rt>([^<]*)<\/rt><\/ruby>/g;
  for (const m of s.matchAll(re)) {
    if (m.index > last) {
      plain += s.slice(last, m.index).replace(/<[^>]+>/g, '');
    }
    const base = m[1].trim();
    const rt = m[2].trim();
    const start = plain.length;
    plain += base;
    rubySpans.push({ start, end: plain.length, base, rt });
    last = m.index + m[0].length;
  }
  if (last < s.length) {
    plain += s.slice(last).replace(/<[^>]+>/g, '');
  }
  return { plain, rubySpans };
}

function getReading(plain, rubySpans, start, end) {
  let out = '';
  let i = start;
  while (i < end) {
    const r = rubySpans.find(sp => sp.start === i && sp.end <= end);
    if (r) {
      out += r.rt;
      i = r.end;
    } else {
      const ch = plain[i];
      const code = ch.charCodeAt(0);
      if (code >= 0x30a1 && code <= 0x30f6) {
        out += String.fromCharCode(code - 0x60);
      } else if (ch === '・' || ch === ' ' || ch === '　') {
        // omit
      } else {
        out += ch;
      }
      i++;
    }
  }
  return out;
}

// Curated multi-word / tricky domain compounds found across 50 packages + OTAFF
const CURATED_PHRASES = [
  '特定原材料に準ずるもの', '特定原材料', '一般衛生管理', '重要管理点', '危害要因分析', '危害要因',
  'カンピロバクター属菌', 'カンピロバクター', '腸管出血性大腸菌', '黄色ブドウ球菌', 'サルモネラ菌', 'ボツリヌス菌', 'ノロウイルス', '腸炎ビブリオ', 'セレウス菌', 'ウェルシュ菌',
  '次亜塩素酸ナトリウム', '消毒用アルコール', 'ペーパータオル', 'エアーシャワー', 'エアシャワー', 'ベルトコンベア', 'ベルトコンベヤー', 'ローラーコンベヤー',
  '粘着ローラー', 'X線異物検出機', 'X線異物検出器', 'Ｘ線異物検出機', '金属探知機', '金属検査機',
  '清潔作業区域', '準清潔作業区域', '汚染作業区域', '非汚染区', '汚染区', '作業手順書', '衛生管理計画',
  '腰痛症災害防止', '腰痛症予防', '転倒災害', '労働災害', '労働安全', '安全装置', '安全標識', '安全保護具', '保護具',
  'アレルギー物質', 'アレルギー食品', '賞味期限', '消費期限', '中心温度', '加熱殺菌', '加熱調理', '異物混入', '食中毒菌', '原因菌',
  '二枚貝', '髪の毛ネット', '髪の毛', '5S活動', '３条件', '3原則', '7原則',
  'まちがっている', 'えらびなさい', 'えらんで', 'ただしい', 'おきます', 'つかった',
  '間違っている', '間違えて', '間違えた', '間違えない', '間違える', '間違って', '間違った', '間違い',
  '選びなさい', '選んで', '選び', '選びない', '正しい', '正しく', '正しくない',
  '広がりやすい', '広がり', '増えやすい', '増えない', '増やさない', 'つけない', '汚染されにくい', '転びにくい', '腐りにくい',
  '美味しく食べられる', '美味しく', '美味しい', '持ち上げ', '持ち上げる', '持ち上げて', '取り除き', '取り除きます', '取り除く', '取り出す',
  '巻き込まれそうになった', '巻き込まれそうに', '巻き込まれそう', '巻き込まれる', '巻き込まれ', '巻き込み', '引っか掛かって', '引っかかって',
  '詰め込んでは', '詰め込んで', '詰め込む', '転倒しそうに', '転倒', '立ちくらみ', 'めまい', 'ふらついて', 'ふらつき',
  '取り外して', '取り外す', '入れ換えない', '入れ換える', '使い分け', '盛り付け', '後片付け', '後始末', '切り替える', '切り替え',
  'ふきとる', 'ふき取る', '拭き取る', '拭き取って', '従います', '従う', '従うと', '定められた', '定める',
  'ストップ', 'ストッパー', 'マニュアル', 'ロッカーの鍵', 'ロッカー', 'ストップウォッチ',
  'NaClO', 'NaC1O', 'NAClO', 'NaCl', 'HACCP', 'O157', 'O111', 'CCP', 'ＣＣＰ', 'ppm', '5S', 'HA', 'KYT', 'FIFO',
].sort((a, b) => b.length - a.length);

const OKURI_VERB_ADJ = /^(?:なければならない|なければなりません|なければ|てはいけない|てはいけません|てはいけず|ていませんでした|ていません|ていました|ていなかった|ていますか|ていない|ています|ている|ていた|ておく|ておいた|ておき|ており|てしまう|てしまった|てしまい|てくる|てきた|てみる|てみた|てから|ては|ても|て|でいる|でいた|でいない|で|られる|られない|られた|られて|られず|られ|させる|させない|させた|させて|させ|せる|せない|せた|せて|われる|われ|まれない|まれる|まれて|まれた|まれますか|まれます|まれず|ないように|ないか|ないで|ないと|ない|なかった|なく|なくなる|くなり|くなった|くなる|くても|たい|たがる|たり|たら|た|ますか|ます|ました|ません|ましょう|なさい|ながら|やすい|やすく|にくい|にくく|すぎて|すぎる|すぎた|すぎ|ず|ずに|ぬ|かった|くない|ければ|しい|しく|しかった|しくない|しければ|んでいれば|んで|んだ|って|っていた|ってい|った|いて|いた|えて|えた|えても|えている|えてお|えなくて|えない|える|ける|けた|けて|けやすく|きる|きた|きて|きない|きられる|めて|めた|める|めば|ねて|ねた|ねないで|ねない|ねる|れて|れた|れる|げて|げた|げる|べて|べた|べる|せて|せた|せる|へる|おらず|おう|そう|かり|かる|かった|かりて|かれば|かりない|かし|かす|かして|かした|かさない|かさず|かさ|ばした|ばして|ばす|ばないように|ばない|まらない|まって|まった|まる|らないで|らなくて|らない|らず|らせない|らせて|らせる|らしておく|らして|らす|らし|らない|わない|わなく|わずに|わせ|やさない|やす|かせ|かせる|がる|がって|がり|なない|まない|かない|こり|こる|けば|ねば|めば|べば|せば|れば|ければ|する|した|して|しない|せず|される|され|された|されて|できる|でき|できた|できない|く|ぐ|す|つ|ぬ|ぶ|む|る|い|う|さ|み|り|き|け|ち)/;

const OKURI_SURU_ONLY = /^(?:しなければならない|しなければなりません|していませんか|していませんでした|していますか|していない|しています|している|ていた|ておく|てしまう|てしまった|てください|てから|ては|ても|しないように|しないで|しない|しないか|せず|される|され|された|されて|されない|させる|させない|させて|しやすい|しやすく|しにくい|しにくく|すぎる|すぎて|すぎた|するか|する|した|して|し)/;

const COUNTER_KANJIS = new Set(['日', '年', '月', '週', '時', '分', '秒', '件', '回', '度', '番', '倍', '割', '人', '個', '枚', '箱', '台', '本', '冊', '袋', '種', '品', '兆', '億', '万', '円']);

const VERB_ADJ_STEMS = new Set([
  '使', '見', '作', '入', '出', '書', '切', '起', '置', '知', '持', '合', '増', '決', '食', '洗', '伸', '動', '押', '取', '流', '拭', '抜', '貼', '破', '着', '飛', '死', '直', '落', '読', '呼', '過', '減', '替', '詰', '折', '戻', '広', '溶', '思', '変', '考', '飲', '凍', '続', '冷', '消', '焼', '乾', '育', '歩', '隠', '止', '立', '割', '言', '覚', '倒', '塗', '聞', '開', '守', '触', '崩', '待', '痛', '獲', '扱', '濡', '振', '積', '吸', '含', '忘', '寝', '投', '試', '行', '握', '履', '示', '保', '降', '走', '進', '防', '載', '延', '噛', '縮', '腐', '助', '鳴', '越', '撮', '蹴', '叩', '頼', '覆', '探', '燃', '飾', '怒', '留', '並', '違', '硬', '占', '遅', '届', '買', '確', '学', '束', '欠', '暖', '弱', '古', '重', '遠', '暗', '安', '厳', '近', '高', '低', '深', '細', '速', '早', '強', '軽', '新', '正', '良', '悪', '大', '小', '多', '少', '長', '短', '忙', '空', '晴', '似', '編', '計', '測', '治', '発', '吐', '困', '迷', '喜', '驚', '笑', '泣', '眠', '遊', '働', '休', '泳', '乗', '渡', '曲', '壊', '汚', '温', '熱', '沸', '焦', '煮', '炒', '揚', '蒸', '茹', '刻', '混', '巻', '包', '閉', '締', '緩', '差', '挿', '引', '掴', '抱', '担', '運', '拾', '捨', '掃', '磨', '干', '揃', '片', '整', '描', '数', '量', '調', '査', '検', '認', '判', '選', '定', '犯', '避', '逃', '救', '支', '報', '告', '連', '絡', '伝', '話', '答', '問', '尋', '断', '許', '禁', '始', '終', '繰', '返', '帰', '来', '離', '集', '散', '分', '配', '交', '換', '代', '化', '上', '下', '昇', '登', '座', '転', '滑', '挟', '踏', '殴', '刺', '残', '余', '足', '満', '塞', '漏', '溢', '柔', '鈍', '鋭', '厚', '薄', '狭', '太', '丸', '平', '危', '誤', '同', '異', '腫', '膨', '損', '照', '済', '通', '成', '求', '広', '従', '居', '渡', '乗', '緩', '転', '飛', '負', '勝', '教', '習', '働', '休', '払', '渡', '借', '貸', '返', '送', '届', '受', '配', '並', '積', '載', '降', '昇', '乗', '降り', '渡', '通', '回', '転', '傾', '倒', '崩', '壊', '破', '裂', '折', '曲', '切', '削', '磨', '洗', '拭', '掃', '乾', '冷', '凍', '溶', '温', '沸', '煮', '焼', '炒', '揚', '蒸', '冷', '凍',
]);

const COMPOUND_INFLECT_STEMS = new Set([
  '見直', '取扱', '切換', '着替', '長持', '霧吹', '引掛', '巻込', '盛付', '吹付', '噴付', '洗流', '拭取', '取出', '取除',
  '持込', '持上', '立上', '詰込', '切替', '引超', '間違', '当は', '書直', '見分', '振下', '乗越', '飛出', '飛込', '走回',
  '組立', '締付', '話合', '照合', '面白', '細長', '薄暗', '甘酸', '手早', '真新', '可愛', '見上', '見下', '見渡', '押出',
  '吸込', '飛散', '落着', '落込', '積重', '折曲', '折返', '繰返', '差込', '抜取', '振返', '立止', '寝坊', '用意', '確認',
  '美味', '横切', '入換', '取外', '後片付', '使分',
]);

function buildIdx(arr) {
  const map = new Map();
  for (const s of arr) {
    if (!s) continue;
    const c = s[0];
    if (!map.has(c)) map.set(c, []);
    map.get(c).push(s);
  }
  for (const l of map.values()) l.sort((a, b) => b.length - a.length);
  return map;
}

const MASTER_KEYS_MULTI = [...masterBySurface.keys()]
  .filter(k => [...k].length >= 2 && !PURE_PARTICLES.has(k) && k.length <= 16 && !/^\[/.test(k) && !/[A-Za-z]{4,}/.test(k));
const MASTER_INDEX = buildIdx(MASTER_KEYS_MULTI);
const CURATED_INDEX = buildIdx(CURATED_PHRASES);
const HIRA_LEX_LIST = [...HIRA_LEXICAL].sort((a, b) => b.length - a.length);
const HIRA_LEX_INDEX = buildIdx(HIRA_LEX_LIST);
const GRAMMAR_INDEX = buildIdx([...PURE_PARTICLES]);
const TECH_LIST = [...TECHNICAL_ASCII].filter(t => t.length >= 2).sort((a, b) => b.length - a.length);
const TECH_INDEX = buildIdx(TECH_LIST);
const segJa = new Intl.Segmenter('ja', { granularity: 'word' });

function tokenizeContext(html) {
  const { plain, rubySpans } = parseHtmlRuby(html);
  const found = []; // { surface, reading }
  const seenSurf = new Set();

  function add(surf, reading) {
    if (!surf || /^[0-9０-９.,\-+℃°%％~〜～・]+$/.test(surf)) return;
    if (PURE_PARTICLES.has(surf)) return;
    if (/^[A-Za-z]+$/.test(surf) && !TECHNICAL_ASCII.has(surf)) return;
    if (!seenSurf.has(surf)) {
      seenSurf.add(surf);
      found.push({ surface: surf, reading: reading || '' });
    }
  }

  let i = 0;
  while (i < plain.length) {
    const ch = plain[i];

    // Technical ASCII tokens (NaClO, O157, 5S, HACCP, ppm, ml, kg, etc.)
    let techHit = null;
    const prevCh = i > 0 ? plain[i - 1] : '';
    if (!/[A-Za-z0-9]/.test(prevCh)) {
      for (const t of (TECH_INDEX.get(ch) || [])) {
        if (plain.startsWith(t, i)) {
          const nextCh = i + t.length < plain.length ? plain[i + t.length] : '';
          if (!/[A-Za-z0-9]/.test(nextCh)) {
            techHit = t;
            break;
          }
        }
      }
    }
    if (techHit) {
      add(techHit, techHit.toLowerCase());
      i += techHit.length;
      continue;
    }

    if (/[\s、。・「」『』（）()／→：；,."'%％℃°\-+〜～【】◎×○0-9０-９①-⑩!！※\[\]．＋\?？]/.test(ch)) {
      i++;
      continue;
    }

    // 1. Curated multi-word phrases
    let cHit = null;
    for (const cp of (CURATED_INDEX.get(ch) || [])) {
      if (plain.startsWith(cp, i)) { cHit = cp; break; }
    }
    if (cHit) {
      add(cHit, getReading(plain, rubySpans, i, i + cHit.length));
      i += cHit.length;
      continue;
    }

    // 2. Existing master dictionary multi-char surface
    let mHit = null;
    for (const mk of (MASTER_INDEX.get(ch) || [])) {
      if (plain.startsWith(mk, i)) {
        const lastChar = mk[mk.length - 1];
        const afterSlice = plain.slice(i + mk.length);
        if (/[\u30a1-\u30f6]/.test(lastChar) && /^[\u30a1-\u30f6ー]/.test(afterSlice)) continue;
        if (/[A-Za-z0-9]/.test(lastChar) && /^[A-Za-z0-9]/.test(afterSlice)) continue;
        // Don't stop short before verb/adj continuation
        if (/[\u3041-\u3096]/.test(lastChar) && /^(?:やすい|やすく|にくい|にくく|すぎ|ている|ていた|て|た|る|ない|ます|はいけない|はいけません|いけない|いる|いた|いない|おり|おく|おいた|しまう|しまった|くる|きた|みる|みた)/.test(afterSlice)) continue;
        // Don't cut a kanji compound
        if (hasKanji(lastChar) && afterSlice[0] && hasKanji(afterSlice[0]) && !COUNTER_KANJIS.has(afterSlice[0])) {
          // Only stop if remaining kanji forms its own known compound, skip blindly breaking unknown compound
          if (!MASTER_INDEX.has(afterSlice[0])) continue;
        }
        mHit = mk;
        break;
      }
    }
    if (mHit) {
      add(mHit, getReading(plain, rubySpans, i, i + mHit.length));
      i += mHit.length;
      continue;
    }

    // 3. Kanji / Ruby stem + okurigana
    const rSpan = rubySpans.find(sp => sp.start === i);
    if (hasKanji(ch) || rSpan) {
      const startsCounterAfterDigit = /[0-9０-９]/.test(prevCh) && COUNTER_KANJIS.has(ch);
      let baseEnd = (rSpan && !startsCounterAfterDigit) ? rSpan.end : i + 1;
      if (!rSpan && !startsCounterAfterDigit) {
        while (baseEnd < plain.length && hasKanji(plain[baseEnd])) {
          if (COUNTER_KANJIS.has(plain[baseEnd - 1]) && /[0-9０-９]/.test(prevCh) && !['間', '目', '円', '後'].includes(plain[baseEnd])) {
            break;
          }
          baseEnd++;
        }
      } else if (startsCounterAfterDigit && baseEnd < plain.length && ['間', '目', '円', '後'].includes(plain[baseEnd])) {
        baseEnd++;
      }

      const base = plain.slice(i, baseEnd);
      const after = plain.slice(baseEnd);
      let extLen = 0;
      const isMultiKanji = [...base].length >= 2;
      if (isMultiKanji && !COMPOUND_INFLECT_STEMS.has(base)) {
        const mSuru = after.match(OKURI_SURU_ONLY);
        const isKnownPureNoun = masterBySurface.has(base) && !['確認', '洗浄', '殺菌', '加熱', '冷却', '保管', '作業', '管理', '調理', '包装', '印字', '検査', '処理', '乾燥', '消毒', '清掃', '準備', '報告', '連絡', '使用', '着用', '注意', '禁止', '防止', '翻訳', '節約', '生産', '輸出', '発表', '統一', '中止', '警戒'].includes(base);
        if (mSuru && !isKnownPureNoun && !base.endsWith('間')) {
          extLen = mSuru[0].length;
        }
      } else {
        const mOk = after.match(OKURI_VERB_ADJ);
        if (mOk) {
          const cand = mOk[0];
          const baseIsPureNoun = masterBySurface.has(base) && !VERB_ADJ_STEMS.has(base) && !COMPOUND_INFLECT_STEMS.has(base);
          if (!baseIsPureNoun && !startsCounterAfterDigit) {
            if (!['で', 'に'].includes(cand) || ['飲', '選', '進', '噛', '踏', '休', '飛', '呼', '並', '死', '遊', '読'].includes(base)) {
              if (cand.length > 1 || VERB_ADJ_STEMS.has(base) || COMPOUND_INFLECT_STEMS.has(base)) {
                extLen = cand.length;
              }
            }
          }
        }
      }
      const end = baseEnd + extLen;
      const surf = plain.slice(i, end);
      add(surf, getReading(plain, rubySpans, i, end));
      i = end;
      continue;
    }

    // 4. Katakana word (capture whole compound, even with middle dot ・ inside)
    if (/[\u30a1-\u30f6]/.test(ch)) {
      const km = plain.slice(i).match(/^[\u30a1-\u30f6ー]+(?:・[\u30a1-\u30f6ー]+)*/);
      const kw = km[0];
      add(kw, getReading(kw, [], 0, kw.length));
      i += kw.length;
      continue;
    }

    // 5. Hiragana lexical
    if (/[\u3041-\u3096ー]/.test(ch)) {
      let lexHit = null;
      for (const hw of (HIRA_LEX_INDEX.get(ch) || [])) {
        if (plain.startsWith(hw, i)) { lexHit = hw; break; }
      }
      if (lexHit) {
        add(lexHit, lexHit);
        i += lexHit.length;
        continue;
      }
      let gramHit = null;
      for (const gt of (GRAMMAR_INDEX.get(ch) || [])) {
        if (plain.startsWith(gt, i)) { gramHit = gt; break; }
      }
      if (gramHit) {
        i += gramHit.length;
        continue;
      }
      const hm = plain.slice(i).match(/^[\u3041-\u3096ー]+/);
      const chunk = hm[0];
      let pos = 0;
      while (pos < chunk.length) {
        const sub = chunk.slice(pos);
        const sc = sub[0];
        let subLex = null;
        for (const hw of (HIRA_LEX_INDEX.get(sc) || [])) {
          if (sub.startsWith(hw)) { subLex = hw; break; }
        }
        if (subLex) { add(subLex, subLex); pos += subLex.length; continue; }
        let subGram = null;
        for (const gt of (GRAMMAR_INDEX.get(sc) || [])) {
          if (sub.startsWith(gt)) { subGram = gt; break; }
        }
        if (subGram) { pos += subGram.length; continue; }
        const segs = [...segJa.segment(sub)];
        const first = segs[0]?.segment || sub[0];
        let cutsLex = false;
        for (let k = 1; k < first.length; k++) {
          const tail = sub.slice(k);
          if ((HIRA_LEX_INDEX.get(tail[0]) || []).some(hw => tail.startsWith(hw))) { cutsLex = true; break; }
        }
        if (cutsLex) { pos += 1; continue; }
        if (!PURE_PARTICLES.has(first) && HIRA_LEXICAL.has(first)) {
          add(first, first);
        }
        pos += first.length;
      }
      i += chunk.length;
      continue;
    }

    i++;
  }

  return { plain, found };
}

// Now extract surfaces across all 50 targets and check match vs curation needed!
const cohort1Actions = [];
const allSurfacesNeeded = new Map(); // surface -> { count, masterHit, autoReading, cohorts, sample }

for (const pm of manifest.packages) {
  if (pm.role !== 'target_repair_50') continue;
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, pm.sourcePath), 'utf8'));
  const qs = (Array.isArray(raw) ? raw : (raw.questions || [])).filter(q => (q.setId || raw.setId || pm.setId) === pm.setId);

  for (const q of qs) {
    const ctxs = [[q.id, q.prompt || q.questionText || extractQuestionPlainText(q), mapping.questions?.[q.id] || []]];
    for (let oi = 0; oi < (q.options || []).length; oi++) {
      const o = q.options[oi];
      const oid = extractOptionId(o, oi);
      const ck = `${q.id}::${oid}`;
      ctxs.push([ck, o.text || extractOptionPlainText(o), mapping.byCompositeKey?.[ck] || []]);
    }

    for (const [ck, html, existingIds] of ctxs) {
      if (pm.cohort === 'cohort_1_spec009_canonical') {
        const errs = validateStrictContext({ contextKey: ck, html, termIds: existingIds, dict, knownLexiconIndex: null });
        if (errs.length > 0) {
          cohort1Actions.push({ setId: pm.setId, contextKey: ck, plain: cleanContextText(html), existingIds, errs });
          for (const e of errs) {
            if (e.code === 'MISSING_LEXICAL_TERM' && e.surface) {
              const surf = e.surface;
              const rec = allSurfacesNeeded.get(surf) || { surface: surf, count: 0, master: pickBestMaster(surf), autoReading: '', cohorts: new Set(), sample: cleanContextText(html).slice(0, 70) };
              rec.count++;
              rec.cohorts.add(pm.cohort);
              allSurfacesNeeded.set(surf, rec);
            }
          }
        }
      } else {
        const { plain, found } = tokenizeContext(html);
        for (const tok of found) {
          const rec = allSurfacesNeeded.get(tok.surface) || {
            surface: tok.surface,
            count: 0,
            master: pickBestMaster(tok.surface),
            autoReading: tok.reading,
            cohorts: new Set(),
            sample: plain.slice(0, 70),
          };
          rec.count++;
          if (!rec.autoReading && tok.reading) rec.autoReading = tok.reading;
          rec.cohorts.add(pm.cohort);
          allSurfacesNeeded.set(tok.surface, rec);
        }
      }
    }
  }
}

const totalUnique = allSurfacesNeeded.size;
const matched = [...allSurfacesNeeded.values()].filter(x => x.master !== null);
const needsCuration = [...allSurfacesNeeded.values()].filter(x => x.master === null).sort((a, b) => b.count - a.count);

const out = {
  summary: {
    totalUniqueSurfacesInTargets: totalUnique,
    matchedInExistingMasterDict: matched.length,
    needingNewDictionaryCuration: needsCuration.length,
    cohort1ContextsWithV2Errors: cohort1Actions.length,
  },
  needingCuration: needsCuration.map(x => ({ ...x, cohorts: [...x.cohorts] })),
  cohort1Actions,
};

fs.writeFileSync(path.join(OUT_DIR, 'phase3-surface-extraction-report.json'), JSON.stringify(out, null, 2) + '\n');
console.log('=== PHASE 3 EXTRACTION SUMMARY ===');
console.log(out.summary);
console.log('\n--- NEEDING NEW DICTIONARY CURATION (' + needsCuration.length + ') ---');
for (let i = 0; i < needsCuration.length; i++) {
  const x = needsCuration[i];
  console.log(`${i + 1}. ${x.surface} | furi:${x.autoReading} | n:${x.count} | ${x.sample}`);
}
