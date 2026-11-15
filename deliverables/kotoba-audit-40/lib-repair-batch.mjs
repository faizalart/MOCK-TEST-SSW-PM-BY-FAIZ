import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
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
  TECHNICAL_ASCII,
  cleanContextText,
  buildKnownLexiconIndex,
  validateStrictContext,
  validatePackagesList,
  verifyProtectedAndImmutability,
  isBannedFragmentEntry,
} from './validate-batch.mjs';
import { auditSentenceSpans } from '../../scripts/audit-kotoba-coverage.mjs';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'deliverables/kotoba-audit-40');

export const PATCHED_DEFECTIVE_TERMS = {
  'kb-1580260': { arti: 'luka pada tangan/kulit (risiko kontaminasi bakteri)' },
  'kb-1382440': { arti: 'batu/kerikil (benda asing keras dari bahan pertanian)' },
  'kb-1499720': { arti: 'angin / hembusan angin (risiko menerbangkan debu)' },
  'kb-1559160': { arti: 'latihan / simulasi kerja atau prosedur darurat' },
  'kb-1371260': { arti: 'air bersih / air standar air minum' },
  'kb-1426680': { arti: 'serangga / hama (pembawa kontaminan dan benda asing)' },
  'kb-1538160': { arti: 'obat-obatan medis (dilarang di area produksi pangan)' },
  'kb-ext-0584-e885b03a3a': { arti: 'pinggang / punggung bawah (pencegahan nyeri K3)' },
  'kb-1487320': { arti: 'lutut (ditekuk saat mengangkat beban berat)' },
  'kb-1349380': { arti: 'lantai pabrik (harus bersih, kering, tidak licin)' },
  'kb-1402930': { arti: 'bunga es di freezer (harus dicairkan/defrost)' },
  'kb-1217730': { arti: 'wajah (dilarang menyentuh wajah saat mengolah pangan)' },
  'kb-u1416-3f4581a001': { furigana: 'きれこすれ' },
  'kb-1502840': { arti: 'menit (satuan durasi waktu)' },
};

// Bad/fragment surfaces never auto-picked by tokenizer
export const EXCLUDED_MASTER_SURFACES = new Set([
  'ぶら', '込', '挙', '殺', '受', '応', '脱', '慣', '移', '除', '黙', '付', '対',
  '端', '割', '話', '業', '違', '属', '機', '器', '渡', '居', '剤',
  'ぶつか', 'はなぜ', 'ければ', 'だし', '計画通', '仕組', 'とは', 'はな', '近づ', '煮込',
  '及', '取り', '下さ', '込ま', '込まれ', 'くだ',
  'でしょ', 'しょ', 'にくい', '必', '取', '選', '巻', '置', '代', '滑', '防', '多', '感', '一',
  'びなさい', 'き込まれそうに', '呼ばれま', '洗い流', 'えら', '当た',
  'サル', 'ネラ', 'トリウム', 'ビブリ', 'ント', 'ぞれ',
  '全部書', '自動的止', '古', '刺', '閉', '望', '擦', '浴', '適',
  '蹴飛', '行', '混', '失', '終', '離', '使用す',
  '粉漏', '時自分', '飛',
  '週間長', '作業中口',
  'す', 'れ', 'ら', 'うに',
]);

// Curated phrase priority table (longest-first during tokenization)
export const EXTRA_CURATED_PHRASES = [
  '特定原材料に準ずるもの', '特定原材料', '一般衛生管理者', '一般衛生管理', '重要管理点', '危害要因分析', '危害要因',
  'カンピロバクター属菌', 'カンピロバクター', '腸管出血性大腸菌', '黄色ブドウ球菌', 'サルモネラ属菌', 'サルモネラ菌', 'サルモネラ属', 'ボツリヌス菌', 'ノロウイルス', '腸炎ビブリオ', 'セレウス菌', 'ウェルシュ菌',
  '次亜塩素酸ナトリウム', '消毒用アルコール', 'ペーパータオル', 'エアータオル', 'エアーシャワー', 'エアシャワー', 'エアーカーテン',
  'ベルトコンベア', 'ベルトコンベヤー', 'ローラーコンベヤー', '粘着ローラー', '粘着ローラ',
  'X線異物検出機', 'X線異物検出器', 'Ｘ線異物検出機', '金属探知機', '金属検査機',
  '清潔作業区域', '準清潔作業区域', '汚染作業区域', '非汚染区', '汚染区', '作業手順書', '衛生管理計画',
  '腰痛症災害防止', '腰痛症予防', '転倒災害', '労働災害', '労働安全', '安全装置', '安全標識', '安全保護具', '保護具',
  'アレルギー物質', 'アレルギー食品', '賞味期限', '消費期限', '中心温度', '加熱殺菌', '加熱調理', '異物混入', '食中毒菌', '原因菌',
  '二枚貝', '髪の毛ネット', '髪の毛', 'ヘアーネット', 'エアコンフィルター', 'フォークリフト', 'ストップウォッチ', 'ロッカーの鍵',
  '5S活動', '３条件', '3原則', '7原則', 'NaClO', 'NaC1O', 'NAClO', 'NaCl', 'HACCP', 'O157', 'O111', 'CCP', 'ＣＣＰ', 'ppm', '5S', 'HA', 'KYT', 'FIFO',
  // Verbs / phrases / hiragana compounds across batches
  'まちがっている', 'えらびなさい', 'えらんで', 'ただしい', 'おきます', 'つかった',
  '間違っている', '間違えて', '間違えた', '間違えない', '間違える', '間違って', '間違った', '間違い', '間違えている',
  '選びなさい', '選んで', '選び', '選びない', '正しい', '正しく', '正しくない', '正し',
  '広がりやすい', '広がり', '増えやすい', '増えない', '増やさない', '増えた', 'つけない',
  '汚染されにくい', '転びにくい', '腐りにくい', '気づきにくい', '乗りやすく', '乗りにくい', 'すべりやすくなっていた', 'すべりやすい',
  '美味しく食べられる', '美味しく', '美味しい', '持ち上げた', '持ち上げ', '持ち上げる', '持ち上げて', '持ち込ませない', '持ち込まない', '持ち込まれた',
  '取り除き', '取り除きます', '取り除く', '取り出す', '取りはずせる', '取り外して', '取り外す',
  '巻き込まれそうになった', '巻き込まれそうに', '巻き込まれそう', '巻き込まれる', '巻き込まれ', '巻き込み',
  '引っか掛かって', '引っかかって', '詰め込んでは', '詰め込んで', '詰め込む',
  '転倒しそうに', '転倒', '立ちくらみ', 'めまい', 'ふらついて', 'ふらつき',
  '入れ換えない', '入れ換えます', '入れ換える', '使い分け', '盛り付け', '後片付け', '後始末', '切り替える', '切り替え', 'その日', '主な',
  'ふき取ったら', 'ふきとらない', 'ふきとる', 'ふき取る', '拭き取る', '拭き取って', '洗いながす', '洗い流し', '洗い流す',
  '従います', '従う', '従うと', '従わなく', '定められた', '定める', '決められた', 'きめられた', '下さい',
  '殺す', '及び', '渡ろう', '付けない', 'つかない', 'ついた', 'ついて', 'ついている', 'つけていない',
  '早めに', '遅い', '緩めて', 'ゆるめて', '緩め', '履く', '乗る', '乗らない', '重ねない', '開く',
  '絞って', '触って', '触ってみる', '乾かして', 'こわしたり', 'いたかった', 'とけていたら', 'とまる', '止まる', '止めて', '止める', '止めない',
  '動かした', '動かすべきだ', '動かす', '動いている', 'うごいている', '動いてる', '動く',
  '直す', '直した', '思い', '思った', '聞いて', '聞いた', '帰った', '働いて', '働き', '休みたい', '休んで', '休み',
  '守らないで', '守らなければ', '守る', 'まもる', 'まもること', '求められる', '求めて', '求める', '生まれさせない', '生まれる',
  '伸ばした', '伸ばして', '伸ばす', '抱え', '下ろした', '立ち上がる', '滑って', '滑った', '転んで', '転んだり', '壊れて', '崩す', '痛める',
  '進めて', '進める', 'はずして', 'はずせる', 'はずす', 'そうじする', 'そうじ',
  // All-hiragana domain nouns/compounds found in tambahan-02 & reguler
  'きかいそうさ', 'ちゅういじこう', 'きがいてきがいよういん', 'きがいよういんぶんせき', 'きがいよういん', 'てがいよういん', 'けんこうきがいよういん',
  'がほうきん', 'おうしょくブドウ', 'おうしょく', 'かねつおんど', 'じゅうようかんりてん', 'けんしょうほうほう',
  'ひつようなもの', 'ふようなもの', 'いぶつこんにゅう', 'しようきぐ', 'しようした', 'しようしない',
  'せんじょうそうち', 'せんじょうざい', 'さっきんざい', 'しょうどく', 'しょどくえき', 'しょどく', 'せんざい', 'すりこみ',
  'つかいすて', 'けいじぶつ', 'けいぶつ', 'いちじていし', 'しさこしょう', 'しょくざい', 'ちょくせつ',
  'いりぐちまえ', 'いりぐち', '２じゅう', 'ふあんてい', 'きゃたつ', 'てんばん', 'たたない', 'あしもと', 'ぜんぽう',
  'ねっとう', 'おおなべ', 'ふたり', 'はこぶ', 'りょうて', 'ふさがった', 'ふさがらない', 'じょうたい', 'いどうじ', 'いどうした', 'いどう',
  'じょうきょう', 'ちゅうい', 'はらう', 'げんそく', 'せってい', 'きそく', 'けってい', 'けんしょう', 'かんし', 'けっか', 'きろく',
  'もうはつ', 'はみでている', 'おんせんく', 'ひおんせんく', 'ていでん', 'ばあい', 'うんてん', 'ほうほう', 'そうさしません', 'そうさ',
  'きかい', 'きぐ', 'とめってない', 'てをいれる', 'かまいません', 'ぜんぶ', 'ちがい', 'しょうじょう', 'おうと', 'ふくつう', 'はきけ',
  'ぞうしょく', 'おんど', 'みじかく', 'じゅうよう', 'じゅうような', 'すみやか', 'こうおん', 'ほかん', 'れいきゃく', 'れいぞう', 'れいとう',
  'ていきてき', 'こかん', 'せんじょう', 'かたずけます', 'やぶれ', 'やぶれた', 'けんいん', 'げんいん', 'たいさく',
  'まえかけ', 'めがね', 'ほごぐ', 'ぬれた', 'ぬれている', 'ゆか', 'しも', 'そうこ', 'かくじつ', 'ていし', 'かくにん', 'せいそう',
  'かいてん', 'ぶぶん', 'ささえる', 'せんよう', 'どうぐ', 'つねに', 'せいかつ', 'せいけつ', 'せいとん', 'せいり',
  'ふくそう', 'とくに', 'すべり', 'だれにも', 'だれ', 'あらいます', 'びんづめ', 'あいだ', 'はげしい', 'すばやく', 'なかなか',
  'ほうこく', 'もどします', 'ボルト', 'しめるとき', 'ちから', 'しせい', 'さける', 'てくび', 'あたま', 'たまご', 'ピナッツ', 'まめ',
  'さいに', 'ぶどう', 'こしょう', 'フォークリフト', 'スライサー', 'スイッチを入れるな', 'スイッチ', 'エアーカーテン',
  '誰か', '他の', '後で', '次に', '後に', '時に', '普通', '居て',
  '日付検査機', '一般生菌数', '時間管理', '一番多い', '汚れないように', '分析', '時計', '指輪', '危険要因',
].sort((a, b) => [...b].length - [...a].length || b.length - a.length);

const OKURI_VERB_ADJ = /^(?:なければならない|なければなりません|なければ|てはいけない|てはいけません|てはいけず|ていませんでした|ていません|ていました|ていなかった|ていますか|ていない|ています|ている|ていた|ておく|ておいた|ておき|ており|てしまう|てしまった|てしまい|てくる|てきた|てみる|てみた|てから|ては|ても|て|でいる|でいた|でいない|で|られる|られない|られた|られて|られず|られ|させる|させない|させた|させて|させ|せる|せない|せた|せて|われる|われ|まれない|まれる|まれて|まれた|まれますか|まれます|まれず|ないように|ないか|ないで|ないと|ない|なかった|なく|なくなる|くなり|くなった|くなる|くても|たい|たがる|たり|たら|た|ますか|ます|ました|ません|ましょう|ませない|ませ|なさい|ながら|やすい|やすく|にくい|にくく|すぎて|すぎる|すぎた|すぎ|ず|ずに|ぬ|かった|くない|ければ|しい|しく|しかった|しくない|しければ|んでいれば|んで|んだ|って|っていた|ってい|った|いて|いた|えて|えた|えても|えている|えてお|えなくて|えない|えます|えました|える|ける|けた|けて|けやすく|けます|けました|けない|けません|きる|きた|きて|きない|きられる|めて|めた|める|めば|めます|めました|めなかった|めない|めません|ねて|ねた|ねないで|ねない|ねる|れない|れて|れた|れる|とします|としました|としません|とす|とさない|とした|として|とせる|げて|げた|げる|べて|べた|べる|せて|せた|せる|へる|おらず|おう|そう|かり|かる|かった|かりて|かれば|かりない|かし|かす|かして|かした|かさない|かさず|かさ|ばした|ばして|ばす|ばないように|ばない|まらない|まって|まった|まる|らないで|らなくて|らない|らず|らせます|らせました|らせない|らせて|らせた|らせる|らせ|らしておく|らして|らす|らし|らない|わない|わなく|わずに|わせ|やさない|やす|かせ|かせる|がる|がって|がり|なない|まない|かない|こり|こる|けば|ねば|めば|べば|せば|れば|ければ|されている|されていた|される|され|された|されて|する|した|して|しない|せず|できる|でき|できた|できない|く|ぐ|す|つ|ぬ|ぶ|む|る|い|う|さ|み|り|き|け|ち)/;
const OKURI_SURU_ONLY = /^(?:しなければならない|しなければなりません|しなければ|していませんか|していませんでした|していますか|していない|しています|している|してあります|しております|ていた|ておく|てしまう|てしまった|てください|てから|ては|ても|しないように|しないで|しない|しないか|せず|される|され|された|されて|されない|させる|させない|させて|しやすい|しやすく|しにくい|しにくく|すぎる|すぎて|すぎた|したり|しよう|するか|する|した|して|し)/;
const COUNTER_KANJIS = new Set(['日', '年', '月', '週', '時', '分', '秒', '件', '回', '度', '番', '倍', '割', '人', '個', '枚', '箱', '台', '本', '冊', '袋', '種', '品', '兆', '億', '万', '円']);
const VERB_ADJ_STEMS = new Set(['使', '見', '作', '入', '出', '書', '切', '起', '置', '知', '持', '合', '増', '決', '食', '洗', '伸', '動', '押', '取', '流', '拭', '抜', '貼', '破', '着', '飛', '死', '直', '落', '読', '呼', '過', '減', '替', '詰', '折', '戻', '広', '溶', '思', '変', '考', '飲', '凍', '続', '冷', '消', '焼', '乾', '育', '歩', '隠', '止', '立', '割', '言', '覚', '倒', '塗', '聞', '開', '守', '触', '崩', '待', '痛', '獲', '扱', '濡', '振', '積', '吸', '含', '忘', '寝', '投', '試', '行', '握', '履', '示', '保', '降', '走', '進', '防', '載', '延', '噛', '縮', '腐', '助', '鳴', '越', '撮', '蹴', '叩', '頼', '覆', '探', '燃', '飾', '怒', '留', '並', '違', '硬', '占', '遅', '届', '買', '確', '学', '束', '欠', '暖', '弱', '古', '重', '遠', '暗', '安', '厳', '近', '高', '低', '深', '細', '速', '早', '強', '軽', '新', '正', '良', '悪', '大', '小', '多', '少', '長', '短', '忙', '空', '晴', '似', '編', '計', '測', '治', '発', '吐', '困', '迷', '喜', '驚', '笑', '泣', '眠', '遊', '働', '休', '泳', '乗', '渡', '曲', '壊', '汚', '温', '熱', '沸', '焦', '煮', '炒', '揚', '蒸', '茹', '刻', '混', '巻', '包', '閉', '締', '緩', '差', '挿', '引', '掴', '抱', '担', '運', '拾', '捨', '掃', '磨', '干', '揃', '片', '整', '描', '数', '量', '調', '査', '検', '認', '判', '選', '定', '犯', '避', '逃', '救', '支', '報', '告', '連', '絡', '伝', '話', '答', '問', '尋', '断', '許', '禁', '始', '終', '繰', '返', '帰', '来', '離', '集', '散', '分', '配', '交', '換', '代', '化', '上', '下', '昇', '登', '座', '転', '滑', '挟', '踏', '殴', '刺', '残', '余', '足', '満', '塞', '漏', '溢', '柔', '鈍', '鋭', '厚', '薄', '狭', '太', '丸', '平', '危', '誤', '同', '異', '腫', '膨', '損', '照', '済', '通', '成', '求', '従', '居', '勝', '負', '教', '習', '払', '借', '貸', '送', '傾', '削', '喋', '任', '表', '生', '儲', '揃']);
const COMPOUND_INFLECT_STEMS = new Set(['見直', '取扱', '切換', '着替', '長持', '霧吹', '引掛', '巻込', '盛付', '吹付', '噴付', '洗流', '拭取', '取出', '取除', '持込', '持上', '立上', '詰込', '切替', '引超', '間違', '当は', '書直', '見分', '振下', '乗越', '飛出', '飛込', '走回', '組立', '締付', '話合', '照合', '面白', '細長', '薄暗', '甘酸', '手早', '真新', '可愛', '見上', '見下', '見渡', '押出', '吸込', '飛散', '落着', '落込', '積重', '折曲', '折返', '繰返', '差込', '抜取', '振返', '立止', '寝坊', '用意', '確認', '美味', '横切', '入換', '取外', '後片付', '使分', '義務付', '色分', '箱詰', '前掛', '引抜', '金もう']);

function buildIdx(arr) {
  const m = new Map();
  for (const s of arr) {
    if (!s) continue;
    const c = s[0];
    if (!m.has(c)) m.set(c, []);
    m.get(c).push(s);
  }
  for (const l of m.values()) l.sort((a, b) => b.length - a.length);
  return m;
}

function parseHtmlRuby(html) {
  const s = String(html || '')
    .replace(/\*\*/g, '')
    .replace(/^(?:\[(?:イラスト|標識|図|写真|品目|保護具|画像)[A-Za-z0-9]+\]\s*)+/u, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/([\u3041-\u3096\u30A1-\u30F6\u4E00-\u9FFF々○])\r?\n(?![ア-オ][\u3041-\u3096\u30A1-\u30F6ー]{2,})(?=[\u3041-\u3096\u30A1-\u30F6\u4E00-\u9FFF々○])/gu, '$1');
  let plain = '';
  const rubySpans = [];
  let last = 0;
  const re = /<ruby>([^<]+)<rt>([^<]*)<\/rt><\/ruby>/g;
  for (const m of s.matchAll(re)) {
    if (m.index > last) plain += s.slice(last, m.index).replace(/<[^>]+>/g, '');
    const base = m[1].trim();
    const rt = m[2].trim();
    const start = plain.length;
    plain += base;
    rubySpans.push({ start, end: plain.length, base, rt });
    last = m.index + m[0].length;
  }
  if (last < s.length) plain += s.slice(last).replace(/<[^>]+>/g, '');
  return { plain, rubySpans };
}

function getReading(plain, rubySpans, start, end) {
  let out = '';
  let i = start;
  while (i < end) {
    const r = rubySpans.find(sp => sp.start === i && sp.end <= end);
    if (r) { out += r.rt; i = r.end; }
    else {
      const ch = plain[i];
      const code = ch.charCodeAt(0);
      if (code >= 0x30a1 && code <= 0x30f6) out += String.fromCharCode(code - 0x60);
      else if (ch !== '・' && ch !== ' ' && ch !== '　') out += ch;
      i++;
    }
  }
  return out;
}

export function buildMasterLookup(dict) {
  const bySurface = new Map();
  for (const [id, e] of Object.entries(dict.terms || {})) {
    if (!e || e.status !== 'verified' || !e.kanji || e.furigana === 'たんご') continue;
    if (e.unitType === 'morpheme_fragment' || e.entryType === 'morpheme_fragment') continue;
    if (isBannedFragmentEntry(id, e)) continue;
    if (hasKanji(e.kanji) && (!e.furigana || !isValidHiraganaReading(e.furigana) || !/^[\u3041-\u3096ー]+$/.test(e.furigana))) continue;
    if (!e.arti || e.arti.length > 60) continue;
    if ((e.unitType === 'inflected_verb' || e.unitType === 'inflected_adj') && !e.dictForm) continue;
    const k = e.kanji.trim();
    if (/^[\u3041-\u3096\u30A1-\u30F6ー]$/.test(k) && id !== 'kb-latsol-tsu') continue;
    if (/^[ぁぃぅぇぉゃゅょゎっァィゥェォャュョヮッー]+$/.test(k)) continue;
    if (['kb-ext-0165-e4b88b3a3a', 'kb-ext-1710-e6b2b93a3a', 'kb-ext-0369-e6b1823a3a'].includes(e.id)) continue; // prefer full reading/noun over stem fragment
    if (EXCLUDED_MASTER_SURFACES.has(k)) continue;
    if (!bySurface.has(k)) bySurface.set(k, []);
    bySurface.get(k).push({ id, ...e });
  }
  for (const list of bySurface.values()) {
    list.sort((a, b) => {
      const sA = (a.id.startsWith('kb-otaff51-') ? 4 : 0) + (a.id.startsWith('kb-audit-') ? 3 : 0) + (['kb-latsol-liter', 'kb-latsol-tsu', 'kb-latsol-celsius'].includes(a.id) ? 1 : 0) + (a.entryType !== 'inflected_verb' ? 2 : 0) + (a.arti.length <= 45 ? 1 : 0);
      const sB = (b.id.startsWith('kb-otaff51-') ? 4 : 0) + (b.id.startsWith('kb-audit-') ? 3 : 0) + (['kb-latsol-liter', 'kb-latsol-tsu', 'kb-latsol-celsius'].includes(b.id) ? 1 : 0) + (b.entryType !== 'inflected_verb' ? 2 : 0) + (b.arti.length <= 45 ? 1 : 0);
      return sB - sA;
    });
  }
  return bySurface;
}

function matchUnitAt(plain, i) {
  const ch = plain[i];
  if (ch === '℃') return { surface: '℃', reading: 'ど', len: 1 };
  if (ch === '㎏') return { surface: '㎏', reading: 'きろぐらむ', len: 1 };
  if (ch === '%') return { surface: '%', reading: '', len: 1 };
  if (ch === '％') return { surface: '％', reading: '', len: 1 };
  if ((plain.startsWith('°C', i) || plain.startsWith('ºC', i)) && !/[A-Za-z0-9]/.test(plain[i + 2] || '')) {
    return { surface: plain.slice(i, i + 2), reading: 'ど', len: 2 };
  }
  const beforeTrim = plain.slice(0, i).replace(/[ \u3000]+$/, '');
  const digitAttached = /[0-9０-９]$/.test(beforeTrim) && !/[A-Za-z][0-9０-９]+$/.test(beforeTrim);
  if (digitAttached) {
    if (ch === 'つ' && /^(?:$|[\s、。・「」『』（）(),.!！?？をのにはがではとだもやか]|あり(?:ます|ません))/.test(plain.slice(i + 1))) {
      return { surface: 'つ', reading: 'つ', len: 1 };
    }
    for (const u of ['ppm', 'ml', 'kg', 'Kg', 'L', 'l', 'g', 'm', 'CC']) {
      if (plain.startsWith(u, i) && !/[A-Za-z0-9]/.test(plain[i + u.length] || '')) {
        return { surface: u, reading: u.toLowerCase(), len: u.length };
      }
    }
  }
  return null;
}

function hasCrossBoundaryCollision(mk, text, pos) {
  const prevCh = pos > 0 ? text[pos - 1] : '';
  const afterSlice = text.slice(pos + mk.length);
  const nextCh = afterSlice[0] || '';
  if (mk === 'まず' && prevCh === 'つ') return true;
  if (mk === 'します' && text.slice(Math.max(0, pos - 2), pos) === '指さ') return true;
  if (mk === 'たこ' && prevCh === 'っ') return true;
  if (mk === 'です' && nextCh === 'べ') return true;
  if (mk === 'のみ' && text.startsWith('のみず', pos)) return true;
  if (mk === 'かんし' && (prevCh === 'じ' || prevCh === 'う' || nextCh === 'ょ' || nextCh === 'ゅ')) return true;
  if (mk === 'はな' && nextCh === 'ん') return true;
  if (mk === 'どの' && prevCh === 'う') return true;
  if (mk === 'なし' && nextCh === 'ょ') return true;
  if (mk === 'つかう' && prevCh === 'あ') return true;
  if (mk === 'うし' && prevCh === 'ゅ') return true;
  if (mk === 'うち' && (prevCh === 'う' || prevCh === 'そ')) return true;
  if (mk === 'だい' && afterSlice.startsWith('ちょう')) return true;
  if (mk === 'はさみ' && afterSlice.startsWith('そうに')) return true;
  if (mk === 'ひじ' && afterSlice.startsWith('ょう')) return true;
  if (mk === 'に対し' && nextCh === 'て') return true;
  if (mk === 'ただ' && nextCh === 'し') return true;
  if (mk === 'とし' && !/^(?:[、。.,\s」』）()]|$)/.test(nextCh)) return true;
  if (mk === 'あた' && nextCh !== 'を') return true;
  if (mk === 'たらく' && prevCh === 'は') return true;
  if (mk === 'なく' && /^(?:て|なる|なり|なっ|す|し)/.test(afterSlice)) return true;
  return false;
}

export function repairContextList({ dict, mapping, kt, packageIds, applyCuratedMap = {}, dryRun = false }) {
  const manifest = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'target-manifest.json'), 'utf8'));

  // 1. Apply any defective master patches (only non-protected IDs!) + curated additions
  for (const [id, patch] of Object.entries(PATCHED_DEFECTIVE_TERMS)) {
    if (dict.terms[id]) Object.assign(dict.terms[id], patch);
  }
  for (const [surface, entry] of Object.entries(applyCuratedMap)) {
    dict.terms[entry.id] = entry;
  }

  const masterBySurface = buildMasterLookup(dict);
  const masterKeysMulti = [...masterBySurface.keys()].filter(k => [...k].length >= 2 && !PURE_PARTICLES.has(k) && k.length <= 36 && !/^\[/.test(k) && (!/[A-Za-z]{4,}/.test(k) || k.includes('Ôn nhanh')));
  const c1KeysMulti = [...masterBySurface.keys()].filter(k => [...k].length >= 2 && k.length <= 36);
  const curatedAll = new Set(EXTRA_CURATED_PHRASES);
  for (const k of Object.keys(applyCuratedMap || {})) {
    if ([...k].length >= 2) curatedAll.add(k);
  }
  const CURATED_INDEX = buildIdx([...curatedAll]);
  const MASTER_INDEX = buildIdx(masterKeysMulti);
  const C1_MULTI_INDEX = buildIdx(c1KeysMulti);
  const HIRA_INDEX = buildIdx([...HIRA_LEXICAL].sort((a, b) => b.length - a.length));
  const GRAMMAR_INDEX = buildIdx([...PURE_PARTICLES]);
  const TECH_INDEX = buildIdx([...TECHNICAL_ASCII].filter(t => t.length >= 2).sort((a, b) => b.length - a.length));
  const segJa = new Intl.Segmenter('ja', { granularity: 'word' });

  const C1_PARTICLE_SURFACES = new Set(['を', 'が', 'と', 'に', 'の', 'で', 'も', 'へ', 'や', 'は', 'な', 'か', 'ア', 'イ', 'ウ', 'エ', 'オ', 'つ', '≫', '−', '‐', 'A', 'B', 'C', 'Ｓ', 'S', '；', '＝', '→', 'l', 'L']);
  const c1ParticleBySurface = new Map();
  for (const [id, e] of Object.entries(dict.terms || {})) {
    if (!e || e.status !== 'verified' || !e.kanji) continue;
    const k = e.kanji.trim();
    if (!C1_PARTICLE_SURFACES.has(k)) continue;
    if (isBannedFragmentEntry(id, e)) continue;
    if (!e.arti || e.arti.length > 60) continue;
    if (k === 'つ' && id !== 'kb-latsol-tsu') continue;
    if (!c1ParticleBySurface.has(k)) c1ParticleBySurface.set(k, []);
    c1ParticleBySurface.get(k).push(e);
  }
  for (const list of c1ParticleBySurface.values()) {
    list.sort((a, b) => {
      const sA = (a.unitType === 'particle' ? 4 : 0) + (a.id.startsWith('kb-v2-p1-') ? 2 : 0) + (a.arti.length <= 40 ? 1 : 0);
      const sB = (b.unitType === 'particle' ? 4 : 0) + (b.id.startsWith('kb-v2-p1-') ? 2 : 0) + (b.arti.length <= 40 ? 1 : 0);
      return sB - sA;
    });
  }
  const pickC1ParticleId = (s) => {
    const hits = c1ParticleBySurface.get(s);
    return hits && hits.length ? hits[0].id : null;
  };

  const pickBestId = (surface) => {
    const hits = masterBySurface.get(surface);
    return hits && hits.length ? hits[0].id : null;
  };
  const knownIdx = buildKnownLexiconIndex(dict);

  function tokenizeToSurfaces(html, isCohort1 = false) {
    const preNormalizedHtml = String(html || '').replace(/(<\/ruby>|[\u3041-\u3096\u30A1-\u30F6ー\u4E00-\u9FFF々○])\s*(?:<br\s*\/?>|\r?\n)\s*(?![ア-オ](?:ヘアーネット|ブラッシング|[\u3041-\u3096ー]{2,}))(?=[\u3041-\u3096ー])/giu, '$1');
    const { plain, rubySpans } = parseHtmlRuby(preNormalizedHtml);
    const out = [];
    const seen = new Set();
    const push = (s, r) => {
      if (!s || /^[0-9０-９.,\-+°~〜～・]+$/.test(s)) return;
      if (!isCohort1 && PURE_PARTICLES.has(s)) return;
      if (/^[A-Za-z]+$/.test(s) && !TECHNICAL_ASCII.has(s)) return;
      if (!seen.has(s)) { seen.add(s); out.push({ surface: s, reading: r || '' }); }
    };

    let i = 0;
    while (i < plain.length) {
      const ch = plain[i];
      const prevCh = i > 0 ? plain[i - 1] : '';

      // Typo/parenthesized compounds starting with digit or punctuation before matchUnitAt/punct skips them
      if (plain.startsWith('３つのそ', i)) { push('３つのそ', 'みっつのそ'); i += 4; continue; }
      if (plain.startsWith('（カラーリング）し', i)) { push('（カラーリング）し', 'からーりんぐし'); i += 9; continue; }

      // 0a. Measurement units & digit-attached counters (℃, °C, ºC, ㎏, %, ％, 2L, 15kg, 100ml, 3つ)
      const um = matchUnitAt(plain, i);
      if (um) { push(um.surface, um.reading); i += um.len; continue; }

      // 0b. Technical ASCII
      if (!/[A-Za-z0-9]/.test(prevCh)) {
        let th = null;
        for (const t of (TECH_INDEX.get(ch) || [])) {
          if (plain.startsWith(t, i) && !/[A-Za-z0-9]/.test(plain[i + t.length] || '')) { th = t; break; }
        }
        if (th) { push(th, th.toLowerCase()); i += th.length; continue; }
      }
      if (/[\s、。・「」『』（）()／→：；,."'\-+〜～【】◎×○0-9０-９①-⑩!！※\[\]．＋\?？°−‐≫]/.test(ch)) { i++; continue; }

      // Choice-list Katakana labels fused onto next word (e.g. アヘアーネット, イブラッシング, ウぼうし, エかくにん, オさぎょうふく)
      // or standalone choice labels 'ア'..'オ' separated by 、/newline (gap-filler restores kb-v2-p6-279..283 without uncurated noise)
      if (
        plain.startsWith('アヘアーネット', i) ||
        plain.startsWith('イブラッシング', i) ||
        plain.startsWith('ウぼうし', i) ||
        plain.startsWith('エかくにん', i) ||
        plain.startsWith('オさぎょうふく', i) ||
        ('アイウエオ'.includes(ch) &&
          (i === 0 || plain[i - 1] === '、' || plain[i - 1] === '\n') &&
          (i + 1 === plain.length || plain[i + 1] === '、' || plain[i + 1] === '\n'))
      ) {
        i += 1; continue;
      }
      // Prevent Master hiragana words from eating single-char particles across boundaries
      // (のうどん, のみぞ, はきけんなので, ときかい, できをつけ, であるく, もしました, かみず, でたらく)
      if (
        plain.startsWith('のうどん', i) ||
        plain.startsWith('のみぞ', i) ||
        plain.startsWith('はきけんなので', i) ||
        plain.startsWith('ときかい', i) ||
        plain.startsWith('できをつけ', i) ||
        plain.startsWith('であるく', i) ||
        plain.startsWith('もしました', i) ||
        plain.startsWith('かみず', i) ||
        plain.startsWith('でたらく', i)
      ) {
        i += 1; continue;
      }
      if (plain.startsWith('からだいしゃ', i)) {
        push('から', 'から'); i += 2; continue;
      }
      if (plain.startsWith('しめるときかい', i)) {
        push('しめる', 'しめる'); i += 3; continue;
      }

      // 1. Curated multi-word / tricky phrase (defer to strictly longer valid MASTER match so short curated roots never shadow longer compounds)
      let chHit = null;
      for (const cp of (CURATED_INDEX.get(ch) || [])) {
        if (cp === 'のうど' && plain[i + 3] === 'ん') continue;
        if (plain.startsWith(cp, i) && !hasCrossBoundaryCollision(cp, plain, i)) { chHit = cp; break; }
      }
      if (chHit) {
        const chLen = [...chHit].length;
        let masterLonger = null;
        for (const mk of (MASTER_INDEX.get(ch) || [])) {
          if ([...mk].length <= chLen) break;
          if (plain.startsWith(mk, i) && !hasCrossBoundaryCollision(mk, plain, i)) { masterLonger = mk; break; }
        }
        if (!masterLonger) { push(chHit, getReading(plain, rubySpans, i, i + chHit.length)); i += chHit.length; continue; }
      }

      // 2. Existing master multi-char surface
      let mkHit = null;
      for (const mk of (MASTER_INDEX.get(ch) || [])) {
        if (!plain.startsWith(mk, i)) continue;
        if (hasCrossBoundaryCollision(mk, plain, i)) continue;
        const lastChar = mk[mk.length - 1];
        const afterSlice = plain.slice(i + mk.length);
        if (/[\u30a1-\u30f6]/.test(lastChar) && /^[\u30a1-\u30f6ー]/.test(afterSlice)) continue;
        if (/[A-Za-z0-9]/.test(lastChar) && /^[A-Za-z0-9]/.test(afterSlice)) continue;
        if (/[\u3041-\u3096]/.test(lastChar) && !lastChar.endsWith('い') && /^(?:やすい|やすく|にくい|にくく|すぎ|ている|ていた|てはいけません|てはいけない|ています|ていない|ており|ておく|ておいた|てしまう|てしまった|てくる|てきた|てみる|てみた|てから|ます|ました|ません|ましょう|ない|なく|なかった|た(?!め|ち|び|だ)|て(?![きく])|る(?!ため|とき|こと|もの|の|と))/.test(afterSlice)) continue;
        if ((lastChar === 'て' || lastChar === 'で') && /^(?:いる|いた|いない|おり|おく|おいた|しまう|しまった|くる|きた|みる|みた|はいけない|はいけません|いけない)/.test(afterSlice)) continue;
        if (hasKanji(lastChar) && afterSlice[0] && hasKanji(afterSlice[0]) && !COUNTER_KANJIS.has(afterSlice[0])) {
          if (!MASTER_INDEX.has(afterSlice[0])) continue;
        }
        mkHit = mk;
        break;
      }
      if (mkHit) { push(mkHit, getReading(plain, rubySpans, i, i + mkHit.length)); i += mkHit.length; continue; }

      // 3. Kanji/ruby + okurigana
      const rSpan = rubySpans.find(sp => sp.start === i);
      if (hasKanji(ch) || rSpan) {
        const startsCounterAfterDigit = /[0-9０-９]/.test(prevCh) && COUNTER_KANJIS.has(ch);
        let baseEnd = (rSpan && !startsCounterAfterDigit) ? rSpan.end : i + 1;
        if (rSpan && rSpan.end > i + 1 && !startsCounterAfterDigit) {
          for (let k = i + 1; k < rSpan.end; k++) {
            const c = plain[k];
            if ((CURATED_INDEX.get(c) || []).some(cp => plain.startsWith(cp, k))) {
              baseEnd = k;
              break;
            }
          }
        }
        if (!rSpan && !startsCounterAfterDigit) {
          while (baseEnd < plain.length && hasKanji(plain[baseEnd])) {
            if (COUNTER_KANJIS.has(plain[baseEnd - 1]) && /[0-9０-９]/.test(prevCh) && !['間', '目', '円', '後'].includes(plain[baseEnd])) break;
            if ((CURATED_INDEX.get(plain[baseEnd]) || []).some(cp => plain.startsWith(cp, baseEnd))) break;
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
          if (mSuru && !isKnownPureNoun && !base.endsWith('間')) extLen = mSuru[0].length;
        } else {
          const mOk = after.match(OKURI_VERB_ADJ);
          if (mOk) {
            const cand = mOk[0];
            const baseIsPureNoun = masterBySurface.has(base) && !VERB_ADJ_STEMS.has(base) && !COMPOUND_INFLECT_STEMS.has(base);
            if (!baseIsPureNoun && !startsCounterAfterDigit) {
              if (!['で', 'に'].includes(cand) || ['飲', '選', '進', '噛', '踏', '休', '飛', '呼', '並', '死', '遊', '読'].includes(base)) {
                if (cand.length > 1 || VERB_ADJ_STEMS.has(base) || COMPOUND_INFLECT_STEMS.has(base)) extLen = cand.length;
              }
            }
          }
        }
        const end = baseEnd + extLen;
        push(plain.slice(i, end), getReading(plain, rubySpans, i, end));
        i = end;
        continue;
      }

      // 4. Katakana word
      if (/[\u30a1-\u30f6]/.test(ch)) {
        const km = plain.slice(i).match(/^[\u30a1-\u30f6ー]+(?:・[\u30a1-\u30f6ー]+)*/);
        const kw = km[0];
        push(kw, getReading(kw, [], 0, kw.length));
        i += kw.length;
        continue;
      }

      // 5. Hiragana lexical (never skip Step 1/2 across a hiragana boundary)
      if (/[\u3041-\u3096ー]/.test(ch)) {
        let lh = null;
        for (const hw of (HIRA_INDEX.get(ch) || [])) {
          if (plain.startsWith(hw, i) && !hasCrossBoundaryCollision(hw, plain, i)) { lh = hw; break; }
        }
        if (lh) { push(lh, lh); i += lh.length; continue; }
        let gh = null;
        for (const gt of (GRAMMAR_INDEX.get(ch) || [])) {
          if (!plain.startsWith(gt, i)) continue;
          if (gt === 'について' && /^ついて(?:いる|いた|いない|おり|います)/.test(plain.slice(i + 1))) continue;
          gh = gt;
          break;
        }
        if (gh) {
          if (isCohort1 && [...gh].length >= 2 && !hasCrossBoundaryCollision(gh, plain, i) && pickBestId(gh)) {
            push(gh, gh);
          }
          i += gh.length;
          continue;
        }
        const hiraRun = plain.slice(i).match(/^[\u3041-\u3096ー]+/)[0];
        const first = [...segJa.segment(hiraRun)][0]?.segment || hiraRun[0];
        if (!PURE_PARTICLES.has(first) && HIRA_LEXICAL.has(first) && !hasCrossBoundaryCollision(first, plain, i)) {
          push(first, first);
        }
        i += first.length;
        continue;
      }

      i++;
    }
    return { plain, tokens: out };
  }

  const uncurated = new Map();
  const touchedPackageFiles = new Set();
  const perPackageSummary = [];

  for (const sid of packageIds) {
    const pm = manifest.packages.find(p => p.setId === sid);
    const absPkg = path.join(ROOT, pm.sourcePath);
    const raw = JSON.parse(fs.readFileSync(absPkg, 'utf8'));
    const qs = (Array.isArray(raw) ? raw : (raw.questions || [])).filter(q => (q.setId || raw.setId || sid) === sid);
    let inlineUpdated = 0;

    for (const q of qs) {
      const resolveCtx = (html, c1TextArg, ctxKey) => {
        const plain = cleanContextText(html);
        const { tokens } = tokenizeToSurfaces(html, pm.cohort === 'cohort_1_spec009_canonical');
        const nextIds = [];
        const seenIds = new Set();
        const addTerm = (id) => { if (id && !seenIds.has(id)) { seenIds.add(id); nextIds.push(id); } };

        for (const tok of tokens) {
          const id = pickBestId(tok.surface);
          if (id) addTerm(id);
          else {
            const rec = uncurated.get(tok.surface) || { surface: tok.surface, reading: tok.reading, count: 0, sample: plain.slice(0, 75), ctx: ctxKey };
            rec.count++;
            uncurated.set(tok.surface, rec);
          }
        }

        const postErrs = validateStrictContext({ contextKey: ctxKey, html, termIds: nextIds, dict, knownLexiconIndex: knownIdx, cohort: pm.cohort });
        for (const err of postErrs) {
          if ((err.code === 'MISSING_LEXICAL_TERM' || err.code === 'UNMAPPED_DICTIONARY_TERM') && err.surface) {
            // Choice-list fused label 'アヘアーネット' has 'ア' restored by C1 gap-filler alongside ヘアーネット
            if (err.surface === 'アヘアーネット') continue;
            const id = pickBestId(err.surface);
            if (id) addTerm(id);
            else {
              const rec = uncurated.get(err.surface) || { surface: err.surface, reading: err.surface, count: 0, sample: plain.slice(0, 75), ctx: ctxKey };
              rec.count++;
              uncurated.set(err.surface, rec);
            }
          }
        }

        const pruneSwallowed = (ids, matchText = plain) => {
          const resolvedTerms = ids.map(id => dict.terms[id]).filter(Boolean);
          return ids.filter(id => {
            const e = dict.terms[id];
            if (!e) return false;
            if (!hasKanji(e.kanji)) return true;
            const offsets = [];
            let idx = matchText.indexOf(e.kanji);
            while (idx !== -1) { offsets.push(idx); idx = matchText.indexOf(e.kanji, idx + 1); }
            if (!offsets.length) return false;
            return offsets.some(pos => {
              const end = pos + e.kanji.length;
              const swallowed = resolvedTerms.some(other =>
                other.id !== e.id &&
                other.kanji.length > e.kanji.length &&
                (() => {
                  let oi = matchText.indexOf(other.kanji);
                  while (oi !== -1) {
                    if (oi <= pos && oi + other.kanji.length >= end) return true;
                    oi = matchText.indexOf(other.kanji, oi + 1);
                  }
                  return false;
                })()
              );
              return !swallowed;
            });
          });
        };

        let finalIds = pruneSwallowed(nextIds);
        if (pm.cohort !== 'cohort_1_spec009_canonical') {
          return finalIds;
        }

        // Cohort 1 Spec-009 span-coverage completion without ever shredding words into fragments/1-kana
        const c1Text = c1TextArg || plain;
        const finalSet = new Set(finalIds);
        const addFinal = (id) => { if (id && !finalSet.has(id)) { finalSet.add(id); finalIds.push(id); } };

        const spanAudit = auditSentenceSpans(c1Text, finalIds, dict);
        for (const u of spanAudit.unresolvedSpans) {
          let off = 0;
          while (off < u.text.length) {
            const gPos = u.start + off;
            const ch = u.text[off];
            let mHit = null;
            for (const mk of (C1_MULTI_INDEX.get(ch) || [])) {
              if (!u.text.startsWith(mk, off)) continue;
              if (hasCrossBoundaryCollision(mk, c1Text, gPos)) continue;
              if (mk === 'について' && /^ついて(?:いる|いた|いない|おり|います)/.test(c1Text.slice(gPos + 1))) continue;
              const lastChar = mk[mk.length - 1];
              const afterGlobal = c1Text.slice(gPos + mk.length);
              if (/[\u30a1-\u30f6]/.test(lastChar) && /^[\u30a1-\u30f6ー]/.test(afterGlobal)) continue;
              if (/[A-Za-z0-9]/.test(lastChar) && /^[A-Za-z0-9]/.test(afterGlobal)) continue;
              mHit = mk;
              break;
            }
            if (mHit) {
              const id = pickBestId(mHit);
              if (id) {
                addFinal(id);
                off += mHit.length;
                continue;
              }
            }

            const prevGlobal = gPos > 0 ? c1Text[gPos - 1] : '';
            const nextGlobal = gPos + 1 < c1Text.length ? c1Text[gPos + 1] : '';
            let canUseSingle = false;
            if (ch === 'つ') {
              canUseSingle = /[0-9０-９一二三四五六七八九十]\s*$/.test(c1Text.slice(0, gPos)) && /^(?:$|[\s、。・「」『』（）(),.!！?？をのにはがではとだもやか])/.test(c1Text.slice(gPos + 1));
            } else if (/^[ア-オ]$/.test(ch)) {
              canUseSingle = !/[\u30A1-\u30F6ー]/.test(prevGlobal) && !/^[ー]$/.test(nextGlobal) && (!/[\u30A1-\u30F6]/.test(nextGlobal) || prevGlobal === '\n' || prevGlobal === '' || /[\s\u3041-\u3096]/.test(prevGlobal));
            } else if (/^[ABC]$/.test(ch)) {
              canUseSingle = !/[A-Za-z0-9]/.test(prevGlobal) && !/[A-Za-z0-9]/.test(nextGlobal);
            } else if (C1_PARTICLE_SURFACES.has(ch)) {
              canUseSingle = true;
            }
            if (canUseSingle) {
              const pid = pickC1ParticleId(ch);
              if (pid) {
                addFinal(pid);
                off += 1;
                continue;
              }
            }

            let endOff = off + 1;
            while (endOff < u.text.length) {
              const nc = u.text[endOff];
              if (C1_PARTICLE_SURFACES.has(nc) && nc !== 'つ' && !/^[ア-オABC]$/.test(nc)) break;
              if ((C1_MULTI_INDEX.get(nc) || []).some(mk => u.text.startsWith(mk, endOff) && !hasCrossBoundaryCollision(mk, c1Text, u.start + endOff))) break;
              endOff++;
            }
            const missingRun = u.text.slice(off, endOff);
            if (missingRun) {
              const rec = uncurated.get(missingRun) || { surface: missingRun, reading: missingRun, count: 0, sample: c1Text.slice(0, 75), ctx: ctxKey };
              rec.count++;
              uncurated.set(missingRun, rec);
            }
            off = endOff;
          }
        }

        const prunedC1 = pruneSwallowed(finalIds, c1Text);
        if (auditSentenceSpans(c1Text, prunedC1, dict).unresolvedSpans.length === 0) {
          return prunedC1;
        }
        return finalIds;
      };

      const qPlain = extractQuestionPlainText(q);
      const qHtml = pm.cohort === 'cohort_1_spec009_canonical'
        ? qPlain
        : (q.prompt || q.questionText || qPlain);
      const nextQIds = resolveCtx(qHtml, qPlain, q.id);
      mapping.questions[q.id] = nextQIds;
      mapping.options[q.id] = mapping.options[q.id] || {};

      const unionIds = [...nextQIds];
      const unionSet = new Set(unionIds);

      for (let oi = 0; oi < (q.options || []).length; oi++) {
        const opt = q.options[oi];
        const oid = extractOptionId(opt, oi);
        const ck = `${q.id}::${oid}`;
        const optPlain = extractOptionPlainText(opt);
        const nextOptIds = resolveCtx(opt.text || optPlain, optPlain, ck);
        mapping.options[q.id][oid] = nextOptIds;
        mapping.byCompositeKey[ck] = nextOptIds;
        for (const id of nextOptIds) {
          if (!unionSet.has(id)) { unionSet.add(id); unionIds.push(id); }
        }
      }

      // Synchronize inline kotobaU/V/Formatted & kotoba-dan-kategori-tambahan if already present on question or kt
      const formatU = (id) => {
        const e = dict.terms[id];
        const f = (e.furigana && e.furigana !== 'たんご') ? e.furigana : e.kanji;
        return `${e.kanji}（${f}）`;
      };
      const formatV = (id) => {
        const e = dict.terms[id];
        const f = (e.furigana && e.furigana !== 'たんご') ? e.furigana : e.kanji;
        return `${e.kanji}（${f}） : ${e.arti}`;
      };
      if (Array.isArray(q.kotobaU)) {
        q.kotobaU = unionIds.map(formatU);
        q.kotobaV = unionIds.map(formatV);
        q.kotobaFormatted = q.kotobaV.join('\n');
        touchedPackageFiles.add(pm.sourcePath);
        inlineUpdated++;
      }
      if (kt.entries && kt.entries[q.id]) {
        const kU = unionIds.map(formatU);
        const kV = unionIds.map(formatV);
        kt.entries[q.id] = {
          ...kt.entries[q.id],
          kotobaU: kU,
          kotobaV: kV,
          kotobaFormatted: kV.join('\n'),
          status: 'FIXED',
        };
      }
    }

    if (!dryRun && touchedPackageFiles.has(pm.sourcePath)) {
      fs.writeFileSync(absPkg, JSON.stringify(raw, null, 2) + '\n');
    }
    perPackageSummary.push({ setId: sid, inlineUpdated });
  }

  return {
    uncurated: [...uncurated.values()].sort((a, b) => b.count - a.count),
    touchedPackageFiles: [...touchedPackageFiles],
    perPackageSummary,
  };
}
