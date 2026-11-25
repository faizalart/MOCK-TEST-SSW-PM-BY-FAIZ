import fs from 'node:fs';
import { hasKanji } from '../../scripts/lib/kotoba-pipeline-utils.mjs';

const dict = JSON.parse(fs.readFileSync('data/sharedKotobaDictionary.json', 'utf8'));

const BAD_OTAFF_IDS = new Set();
const MASTER_EXCLUDE_KANJI = new Set([
  'ぶら', '込', '挙', '殺', '受', '応', '脱', '慣', '移', '除', '黙', '付', '対',
  '端', '油', '下', '割', '話', '業',
  'ぶつか', 'はなぜ', 'ければ', 'だし',
  '計画通', '仕組', 'とは', 'すると', 'はな', '近づ', '煮込',
]);
const masterByKanji = new Map();
for (const [id, e] of Object.entries(dict.terms || {})) {
  if (!e || e.status !== 'verified' || !e.kanji) continue;
  if (e.unitType === 'morpheme_fragment' || e.entryType === 'morpheme_fragment') continue;
  if (MASTER_EXCLUDE_KANJI.has(e.kanji.trim())) continue;
  if (id.startsWith('kb-otaff51-')) {
    if (id >= 'kb-otaff51-0688' || e.furigana === 'たんご' || e.kanji.length > 16 || ['はさまれ', '巻き込まれ', '盛り付け', '次の掃除のときに汚れがよく落ちるようにな'].includes(e.kanji)) {
      BAD_OTAFF_IDS.add(id);
      continue;
    }
  }
  const k = e.kanji.trim();
  if (!masterByKanji.has(k)) masterByKanji.set(k, []);
  masterByKanji.get(k).push({ id, ...e });
}

function lookupMaster(surface) {
  const hits = masterByKanji.get(surface) || [];
  if (!hits.length) return null;
  const sorted = [...hits].sort((a, b) => {
    const scoreA = (a.furigana ? 2 : 0) + (a.arti && a.arti.length <= 40 ? 1 : 0) + (!a.id.startsWith('kb-otaff51-') ? 1 : 0);
    const scoreB = (b.furigana ? 2 : 0) + (b.arti && b.arti.length <= 40 ? 1 : 0) + (!b.id.startsWith('kb-otaff51-') ? 1 : 0);
    return scoreB - scoreA;
  });
  return sorted[0];
}

function parseHtml(html) {
  const s = String(html || '')
    .replace(/\*\*/g, '')
    .replace(/^\[(?:イラスト|標識|図|写真|品目|保護具)[A-Za-z0-9]+\]\s*/u, '');
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

const CURATED_PHRASES = [
  '特定原材料に準ずるもの', '特定原材料', '食品製造業における事故の型別死傷災害発生状況', '型別死傷災害発生状況',
  'X線異物検出機', 'Ｘ線異物検出機', 'エアーシャワー', 'ペーパータオル', '消毒用アルコール', '次亜塩素酸ナトリウム',
  'メクセル手袋', 'くさり手袋', '切傷防止用手袋', '耐切創手袋', 'やけど防止用手袋', '防止用手袋', '圧傷防止用靴', '保護手袋', '保護メガネ', '作業手順書', '衛生管理計画', '安全保護具', '安全標識', '重要管理点', '一般衛生管理', '特別衛生管理', '区分衛生管理',
  '化学的危害要因', '物理的危害要因', '生物的危害要因', '温度的危害要因', '時間的危害要因', '空間的危害要因',
  '個人的危害要因', '会社的危害要因', '社会的危害要因', '危害要因分析', '危害要因',
  'アニサキス食中毒', 'ヒスタミン食中毒', '食中毒菌', '腸炎ビブリオ', 'セレウス菌', 'ウェルシュ菌', 'カンピロバクター', 'ノロウイルス', 'ボツリヌス菌', 'サルモネラ菌', '黄色ブドウ球菌',
  '冷凍調理食品製造業', '畜産食料品製造業', '水産食料品製造業', '調味料製造業', 'パン・菓子製造業', 'そう菜製造業', 'そう菜製造工場', '畜産食料品', '水産食料品', '水産加工工場', '工作機械製造業', '自動車製造業', '木材製造業', '自動車整備業', '航空機製造業', 'ビルクリーニング業', '飲食料品製造業', '清涼飲料製造業', '食料品製造業', '菓子製造業',
  '食肉製品', '穀類加工品', '生鮮魚介類', '冷凍水産物', '冷凍食肉', '固形油脂', '液状油脂', '殻付き卵', '凍結卵', '瓶詰め食品', 'レトルト食品', '二枚貝料理',
  '合計加熱保持時間', '加熱殺菌工程', '加熱調理場', '加熱調理終了後', '加熱終了後', '製造終了時', '製造開始前', '金属探知機検査', '受入検査訓練', '味覚検査訓練', '加熱調理', '加熱殺菌', '薬剤殺菌', '再殺菌', '再洗浄', '前回正常', '基準処理時間', '基準時間上限', '基準上限', '出入口', '避難口',
  'ファーストイン・ファーストアウト', 'テレビコマーシャル', 'チェックポイント', 'スポーツドリンク', 'ビニールコート', 'デッキブラシ', 'ハム・ソーセージ・ベーコン', 'ハム・ソーセージ', 'バター・チーズ', 'スポンジ・モップ', 'ピアス・ヘアピン', '先入れ・先出し', 'ヒヤリ・ハット',
  '作業服着用前', '冷蔵保管温度', '出荷可能箱数', '合計何時間何分', '労働災害発生状況', '労働災害防止', '労働災害', '国内生産額', '未熟練作業者', '自動車運転免許', '食料関連産業', '外国人食品産業技能評価機構', '日本自動車工業会', '特定技能1号評価試験', '特定技能1号',
  '冷蔵庫内全体', '汚染作業区域以外', '清潔作業区域', '準清潔作業区域', '汚染作業区域', '屋外駐車区域', '休憩喫煙区域',
  '自動車運転', '表示義務', '表示推奨', '食品表示', '表示制度', '表示板',
  '外国語会話', '日本語', '外国産', 'お客さま', 'お客様', 'お手洗い', 'お弁当', 'お好み焼き', 'お菓子', 'お皿', 'お箸', 'お湯', 'お金',
  '高圧洗浄作業', '高圧洗浄機', '操作パネル', '操作部', '背中側', '環境省', '文部科学省', '国土交通省', '防衛省', '外務省', '農林水産省', '厚生労働省', '管理手段', '管理基準', '温度基準', '作業対象', '特大サイズ', '揚げ物', '経済計算', '出来事', '各分類', '各災害', '下処理前', '印字設定', '味覚検査', '受入検査', '微生物検査', '耐震検査', '微生物',
  'タンパク質', 'そう菜', 'おう吐物', 'おう吐', 'あけっ放し', '開けっ放し', '半分開ける', 'かき混ぜて', 'ぶつかる', 'つまずく', 'まくり上げる', 'まくり上げて',
  '組み合わせて', '組み合わせ', '合わせて', 'あわせて', '合わせる',
  '持ち込まない', '持ち込んで', '持ち込まず', '持ち込む', '持ち込み',
  '持ち上げよう', '持ち上げた', '持ち上げて', '持ち上げる', '持ちあげるとき', '持ちあげる',
  '取り除いた', '取り除こう', '取り除き', '取り除く',
  '取り出せる', '取り出した', '取り出す',
  '取り扱って', '取り扱う', '取り扱い', '取扱い',
  '受け入れた', '受け入れて', '受け入れず', '受け入れる',
  '巻き込まれる', '巻き込まれ', '巻き込む', '巻き込み',
  '引っ掛かって', '引っ掛かる', '引っ掛かり', '引っかかり', '引っかかる',
  '洗い流さず', '洗い流した', '洗い流して', '洗い流す', '洗い流し',
  '拭き取って', '拭き取る', 'ふき取って', 'ふき取る', 'ふき取り',
  '噴きつけて', '噴きつける', '噴きつけ', '噴きかけて', '吹きかけて', '吹きかける', '吹きつける', '吹き付ける',
  '見つけたら', '見つけにくい', '見つけられない', '見つけやすい', '見つけやすく', '見つけた', '見つけて', '見つける', '見つかりました', '見つかる',
  '増えやすい', '増えやすく', '増えない', '増えた', '増えて', '増える',
  '食べやすい', '食べにくい', '食べない', '食べた', '食べて', '食べる',
  '扱いやすい', '扱いにくい', 'わかりにくい', '付着しにくい', '通りにくい', '聞こえにくい',
  '見分ける', '見分け', '見落とし', '見ないで', '見せる', '見せない',
  '立ち上がる', '立ち上がって', '立ち上がり',
  '詰め込んでは', '詰め込んだ', '詰め込む', '詰め込ま',
  '切り替える', '切り替え', '切り取り',
  '引き起こす', '引き起こした', '引き起こし',
  '間違っている', '間違えて', '間違えた', '間違えない', '間違える', '間違って', '間違った', '間違い',
  '当てはまる', '決められている', '決められた', '決められる', '決めて', '決めた', '決める', '決まっている', '決まっており',
  '書かれている', '書かれています', '書かれた', '書いて', '書かない', '書き直す', '書き直して', '書く', '書ける', '書けない',
  '知らされる', '知らせずに', '知らせない', '知らせる', '知らせて', '知らせ',
  '表している', '表す', '表した', '使い捨て', '使い方', '使い続ける', '出し入れ', '先入れ', '先出し',
  '盛り付けて', '盛り付ける', '盛り付け', '切れ端', '切れ口', '切れ味', '切れにくい', '皮付き', '骨付き', '目分量', '見た目',
  '着方', '扱い方', '守り方', '動き方', '運び方', '持ち方', '記録のしかた', 'しかた', '増え方',
  '開き止め', '押し板', '瓶詰め', '缶詰', '手洗い', '履き物', '履物交換', '手袋交換', '履物', '履き替える', '食べ物', '飲み物', '生き物', '煮物',
  '立入禁止', '立ち入り', '飛び出し', '飛び込んで', '乗り越えて', '乗り降り', '振り下ろして', '動き出して', '動き出す', '動き始めたり', '走り出す', '走り回り', 'すり減った', 'すり減り', 'かみ合わせ', '組み立てる', '組み立て', '締め付ける', '締め付け', '思い違い', '思い込んで', '心構え', '目隠し', '指差呼称',
  '報告し合って', '報告し合い', '声をかけあって', '声をかけて', '声をかける', '照らし合わせて', '流し出し', '冷やし合って', '抱え起こす',
  '習慣付け', '目立たない', '目立たなくても', '目立た', '確かめる', '確かめなければならない', '見つめ', '役立ち', '役立つ', '役に立たない',
  '着替える', '着替えた', '着替え', '間違え', '一番最初', '一番最後', '一番大切', '一番先', '一番上', '一番下', '一番大きい', '一番新しい', '一番高い', '一番低い', '一番',
  '新しい', '新しく', '正しい', '正しく', '大きい', '大きく', '大きすぎる', '大きな', '小さい', '小さく', '小さすぎる', '小さな', '柔らかすぎた', '柔らかすぎる', '柔らかい', '柔らかく',
  '速すぎる', '速すぎて', '速い', '速く', '早い', '早く', '遅い', '遅く', '高い', '高く', '低い', '低く', '多い', '多く', '多い順', '少ない', '少なく',
  '長い', '長く', '長め', '短い', '短く', '広い', '広く', '狭い', '狭く', '深い', '深く', '浅い', '浅く', '厚い', '厚く', '薄い', '薄く',
  '細かい', '細かく', '強い', '強く', '強め', '弱い', '弱く', '古い', '古く', '古くなった', '暖かい', '暖かく', '遠い', '遠く', '近い', '近く',
  '同じ', '違う', '違い', '似ている', '似た', '異なる', '長持ち', '卵焼き', '霧吹き', '見直し', '見直す',
  '美味しい', '美味しく', 'プラスチック製', '見つけられる', '真ん中', '横切る', '損なわない', '助けよう', '鳴らしながら', '答えさせ', '答える', '学ばなくて',
  '飾り', '腫れ', '膨らむ', '腐らない', '延ばす', '欠け', '燃やす', '覆う', '押さえれば', '押さえて', '押さえる',
  '待たずに', '出さずに', '流さずに', '通さない', '頼んで', '起きる', '起きても', '含まれない', '含まれる',
  '昼休み', '毎月', '毎年', '毎回', '朝', '工場', '日中', '現在', '追加', '概算', '第1章', '第3章', '第5.1版', '水道水', '水道',
  '飲ませる', '曲げすぎている', '一人ひとり', '含まれます', '含まれますか', '滑りにくい', '滑りやすい', 'すべり防止',
  '歩留まり', '育ちやすい', '育ちにくい', '終わり', '変わり', '変わる', '終わっていない', '終わって', '書こう', '入ろう', '使い分ける', '分かりやすく', '分かりやすい', '分かりにくい',
  '突然', '消しゴム', '工場長', '進め方', '呼び方', '着け方', '考え方', '塗り替える', '繰り返して', '繰り返しやすくなったり', '取り外しておく', '取り外して', '増え続け', '過ぎている', '過ぎて', '過ぎた', '過ぎない', '使わず', '抜き取り', '変な', '聞こえなくなる', '大丈夫', '食べてはいけません', '使ってはいけない',
  '破れ', '出しやすく', '動かな', '動かなく', '動かなくなった', '混ざっている', '通り過ぎる', '使えなくなる', '守らなければ', '読まなくて', '冷やし', '冷やさない', '流し出す', '降ろす', '凍らせたり', '置かず', '束ね', '伸ばし', '伸びる', '出入り', '変わっている', '起こして', '聞こえにくくなる', '食べやすく', '食べ', '入らない', '入れない', '入れ', '入れて', '入っていた', '考えて', '考え', '過ぎています', '過ぎていました',
  '製造する', '捨てる', '捨てて', '切る', '切らない', '変える', '置いて', '通す', '見れば', '書く', '加熱して', '働いたら', '治らなかった',
  'ぶら下げて', '挙げられている', '殺す', '受ければ', '受けなければなりません', '受けなければ', '応じて', '脱いだり', '脱いだ', '慣れていない', '慣れて', '慣れたら', '移し替えて', '除く', '黙って', '付いて', '付いた', '押し込む', '積み込む', '持ち込める', '対する', 'に対し', '話を',
  '下ろし', '下りたり', '衛る', '押さえながら', '減り続けて', '見つけました', '見つけた', '見つけて', '見つける', '見つけ', '落とす', '落とし', '落として', '落とさない', '2人用', '互いに', 'するところだった',
  '型別', '死傷災害', '発生状況', 'ファーストイン', 'ファーストアウト', '落ち着いて', '入り数',
  '原材料別', '加熱殺菌後', '出来上がった', '業種', '保管用', '出荷用', '一時停止時', '点検口', '製造業',
  'もう一度', '一度', '分間以上加熱殺菌', '秒間以上加熱', '秒間程度', '秒間加熱', '分間殺菌', '分間処理', '分間以上', '分間', '秒間以上', '秒間', '時間以上冷凍', '時間以上', '時間以内', '半日間', '日間', '年間', 'か月間', 'か月', '週間後', '週間', '兆円', '万倍', '万分率',
  '合計何品目', '何品目', '何時何分', '何分間', '何件', '何兆円', '何度', '何箱', '何枚', '何時間', '品目', '番目', '種類', '約半分', '約何兆円', '半分くらい', 'どのくらい', '半分', 'どの',
  '鼻をかんだり', 'せきをすること', '声をかけずに', '声をかけ', '気がついた', '気がつく', '気をつけて', '気をつけ',
  '欠ける', '身だしなみ', '仕組み', '入れる', '例えば', '上げる', '上げ', '育てる', '計画通り', '水洗い', '降りる', '煮込む', '指しながら', '近づく', '近づかず', '感じて', '回る', '生きている', '生き残った', '生き残って', '安心して', '外す', '外れて', '考える', '長い間', '風冷', 'かもしれない', '区別して', 'その他', '書かせる',
  'X線', 'Ｘ線', 'O157', 'O111', 'HACCP', 'CCP', 'KYT', 'FIFO', 'ppm', '5S', 'SNS', 'OTAFF',
].sort((a, b) => b.length - a.length);

const FIXED_PREFIX_TOKENS = [
  ['500箱', 'ごひゃっぱこ'],
  ['1日中', 'いちにちじゅう'],
  ['1年間', 'いちねんかん'],
  ['2人用', 'ふたりよう'],
  ['2回分', 'にかいぶん'],
  ['1日', 'いちにち'],
  ['1度', 'いちど'],
  ['1個', 'いっこ'],
  ['1年', 'いちねん'],
  ['1回', 'いっかい'],
  ['2回', 'にかい'],
  ['5S', 'ごえす'],
];

// Counter-merged <ruby> prefixes where we skip the counter char & advance cleanly to the real word
const MERGED_COUNTER_PREFIXES = [
  ['袋製造', 1], ['個製造', 1], ['個切', 1], ['日置', 1], ['日中水', 2], ['日現在', 1], ['日追加', 1],
  ['年働', 1], ['件起', 1], ['回通', 1], ['回見', 1], ['回分書', 2], ['度加熱', 1],
  ['回以上切', 1], ['間治', 1],
];

// Multi-kanji verbs/compound verbs/adjectives that CAN take verbal/adj okurigana
const COMPOUND_INFLECT_STEMS = new Set([
  '見直', '取扱', '切換', '着替', '長持', '霧吹', '引掛', '巻込', '盛付', '吹付', '噴付', '洗流', '拭取', '取出', '取除',
  '持込', '持上', '立上', '詰込', '切替', '引超', '間違', '当は', '書直', '見分', '振下', '乗越', '飛出', '飛込', '走回',
  '組立', '締付', '話合', '照合', '面白', '細長', '薄暗', '甘酸', '手早', '真新', '可愛', '見上', '見下', '見渡', '押出',
  '吸込', '飛散', '落着', '落込', '積重', '折曲', '折返', '繰返', '差込', '抜取', '振返', '立止', '寝坊', '用意', '確認',
  '美味', '横切',
]);

// Standalone kanji counters that must NOT merge with following kanji words
const COUNTER_KANJIS = new Set(['日', '年', '月', '週', '時', '分', '秒', '件', '回', '度', '番', '倍', '割', '人', '個', '枚', '箱', '台', '本', '冊', '袋', '種類', '品目', '兆', '億', '万', '円']);

// Fix masterMulti: exclude pure 1-char, exclude grammar-like hiragana entries, exclude >16 chars
const MASTER_EXCLUDE_HIRAGANA_GRAMMAR = new Set(['ので', 'のに', 'です', 'ですか', 'ます', 'ますか', 'だから', 'とした', 'なりました', '大丈夫だ', 'でした', 'ません', 'ました']);
const masterMulti = [...masterByKanji.keys()]
  .filter(k => [...k].length >= 2 && !MASTER_EXCLUDE_HIRAGANA_GRAMMAR.has(k))
  .filter(k => k.length <= 16 && !/^\[/.test(k) && !/[A-Za-z]{4,}/.test(k))
  .sort((a, b) => b.length - a.length);

// Richer inflection tail for single kanji or compound verb/adj stems
const OKURI_VERB_ADJ = /^(?:なければならない|なければなりません|なければ|てはいけない|てはいけません|てはいけず|ていませんでした|ていません|ていました|ていなかった|ていますか|ていない|ています|ている|ていた|ておく|ておいた|ておき|ており|てしまう|てしまった|てしまい|てくる|てきた|てみる|てみた|てから|ては|ても|て|でいる|でいた|でいない|で|られる|られない|られた|られて|られず|られ|させる|させない|させた|させて|させ|せる|せない|せた|せて|われる|われ|まれない|まれる|まれて|まれた|まれますか|まれます|まれず|ないように|ないか|ないで|ないと|ない|なかった|なく|なくなる|くなり|くなった|くなる|くても|たい|たがる|たり|たら|た|ますか|ます|ました|ません|ましょう|なさい|ながら|やすい|やすく|にくい|にくく|すぎて|すぎる|すぎた|すぎ|ず|ずに|ぬ|かった|くない|ければ|しい|しく|しかった|しくない|しければ|んでいれば|んで|んだ|って|っていた|ってい|った|いて|いた|えて|えた|えても|えている|えてお|えなくて|えない|える|ける|けた|けて|けやすく|きる|きた|きて|きない|きられる|めて|めた|める|めば|ねて|ねた|ねないで|ねない|ねる|れて|れた|れる|げて|げた|げる|べて|べた|べる|せて|せた|せる|へる|える|おらず|おう|そう|かり|かる|かった|かりて|かれば|かりない|かし|かす|かして|かした|かさない|かさず|かさ|ばした|ばして|ばす|ばないように|ばない|まらない|まって|まった|まる|らないで|らなくて|らない|らず|らせない|らせて|らせる|らしておく|らして|らす|らし|らない|わない|わなく|わずに|わせ|やさない|やす|かせ|かせる|がる|がって|がり|なない|まない|かない|こり|こる|ける|けば|ねば|めば|べば|せば|れば|ければ|する|した|して|しない|せず|される|され|された|されて|できる|でき|できた|できない|く|ぐ|す|つ|ぬ|ぶ|む|る|い|う|さ|み|り|き|け|ち)/;

// Suru-only ending for 2+ kanji compound nouns (NEVER bare く/さ/い/す!)
const OKURI_SURU_ONLY = /^(?:しなければならない|しなければなりません|していませんか|していませんでした|していますか|していない|しています|している|ていた|ておく|てしまう|てしまった|てください|てから|ては|ても|しないように|しないで|しない|しないか|せず|される|され|された|されて|されない|させる|させない|させて|しやすい|しやすく|しにくい|しにくく|すぎる|すぎて|すぎた|するか|する|した|して|し)/;

const VERB_ADJ_STEMS = new Set([
  '使', '見', '作', '入', '出', '書', '切', '起', '置', '知', '持', '合', '増', '決', '食', '洗', '伸', '動', '押', '取', '流', '拭', '抜', '貼', '破', '着', '飛', '死', '直', '落', '読', '呼', '過', '減', '替', '詰', '折', '戻', '広', '溶', '思', '変', '考', '飲', '凍', '続', '冷', '消', '焼', '乾', '育', '歩', '隠', '止', '立', '割', '言', '覚', '倒', '塗', '聞', '開', '守', '触', '崩', '待', '痛', '獲', '扱', '濡', '振', '積', '吸', '含', '忘', '寝', '投', '試', '行', '握', '履', '示', '保', '降', '走', '進', '防', '載', '延', '噛', '縮', '腐', '助', '鳴', '越', '撮', '蹴', '叩', '頼', '覆', '探', '燃', '飾', '怒', '留', '並', '違', '硬', '占', '遅', '届', '買', '確', '学', '束', '欠', '暖', '弱', '古', '重', '遠', '暗', '安', '厳', '近', '高', '低', '深', '細', '速', '早', '強', '軽', '新', '正', '良', '悪', '大', '小', '多', '少', '長', '短', '忙', '空', '晴', '似', '編', '計', '測', '治', '発', '吐', '困', '迷', '喜', '驚', '笑', '泣', '眠', '遊', '働', '休', '泳', '乗', '渡', '曲', '壊', '汚', '温', '熱', '沸', '焦', '煮', '炒', '揚', '蒸', '茹', '刻', '混', '巻', '包', '閉', '締', '緩', '差', '挿', '引', '掴', '抱', '担', '運', '拾', '捨', '掃', '磨', '干', '揃', '片', '整', '描', '数', '量', '調', '査', '検', '認', '判', '選', '定', '犯', '避', '逃', '救', '支', '報', '告', '連', '絡', '伝', '話', '答', '問', '尋', '断', '許', '禁', '始', '終', '繰', '返', '帰', '来', '離', '集', '散', '分', '配', '交', '換', '代', '化', '上', '下', '昇', '登', '座', '転', '滑', '挟', '踏', '殴', '刺', '残', '余', '足', '満', '塞', '漏', '溢', '柔', '鈍', '鋭', '厚', '薄', '狭', '太', '丸', '平', '危', '誤', '同', '異', '腫', '膨', '損', '照', '済', '通', '成', '終',
]);

const PURE_GRAMMAR_TOKENS = new Set([
  'を', 'の', 'に', 'が', 'は', 'で', 'と', 'や', 'も', 'へ', 'か', 'ね', 'よ', 'な', 'だ', 'て', 'た', 'ば', 'ず',
  'する', 'し', 'した', 'して', 'しない', 'せず', 'される', 'され', 'された', 'されて', 'できる', 'でき', 'できた', 'できない',
  'いる', 'い', 'いた', 'いて', 'いない', 'おり',
  'ある', 'あり', 'あっ', 'あった', 'あって', 'ありません', 'あります',
  'なる', 'なり', 'なっ', 'なった', 'なって', 'なら',
  'ない', 'なく', 'なかっ', 'なかった', 'ないで', 'ないか',
  'です', 'ます', 'ました', 'ません', 'ませんでした', 'でした', 'ですか', 'ますか', 'ませんか',
  'である', 'であり', 'であった', 'ではない', 'ではなく', 'でない',
  'から', 'まで', 'より',
  'における', 'についての', 'に対して', 'にとって',
  'ながら', 'たり', 'だり', 'ても', 'なら', 'しかし', 'また', 'および', 'または', 'なお', 'つまり',
  'この', 'その', 'あの', 'どの', 'ここ', 'そこ', 'あそこ', 'そんな', 'こんな', 'あんな', 'どんな',
  'って', 'る', 'れる', 'られる', 'せる', 'させる', 'ておく', 'おく', 'おき', 'おいて', 'しまう', 'しまい', 'しまった', 'くれる',
  'よう', 'ように', 'ような', 'そう', 'という', 'といった', 'とか', 'だけ', 'しか', 'ばかり', 'ほど', 'くらい', 'ぐらい', 'こそ', 'さえ', 'ごと', 'ごとに',
  'のです', 'ためです', 'からです', 'おらず', 'だろう',
  'どうですか', 'どれですか', '何ですか', 'いいですか', 'いますか', 'でしょうか', 'ほう', 'ほうが', 'ための', 'ところ', 'とおり', 'どおり', 'あたり', 'わけ', 'はず', 'べき', 'べく',
]);

const HIRAGANA_LEXICAL_LIST = [
  'せっけん', 'ほこり', 'やけど', 'やっつける', 'おこなわれている', 'おこなわれる', 'おこなわれ', 'おこない', 'おこなう', 'おこなった', 'おこなって', 'おこなわない', 'そのまま', 'すりこむ', 'なくす', 'なくなる', 'おそれ',
  'たばこ', 'ぞうきん', 'たわし', 'かぼちゃ', 'じゃがいも', 'たまねぎ', 'にんじん', 'おにぎり', 'くさり', 'うがい',
  'はさまれる', 'はさまれ', 'はさまって', 'はさまっている', 'はさみ', 'ころぶ', 'こぼれる', 'こぼれ', 'ぶつからない', 'ぶつかって', 'ぶつかった', 'ぶつかり', 'ぶつかる', 'つまずく', 'つまって', 'つまった', 'すべる', 'すべり', 'すべらない', 'しゃがむ', 'つぶれたり', 'つぶれ', 'つぶって',
  'あご', 'ひじ', 'ほほ', 'かかと', 'おなか', 'おしり', 'まぶた', 'くしゃみ', 'うろこ', 'せき', 'かたまり', 'ごみ', 'けが', 'いのち', 'まもる', 'そろえる', 'はかる', 'まくり', 'めったに',
  'うっかり', 'わざと', 'あらかじめ', 'きちんと', 'しっかり', 'ゆっくりと', 'ゆっくり', 'ていねい', 'まったく', 'すべて', 'おいしさ', 'もっと',
  'それぞれ', 'どちら', 'いつも', 'かならず', 'なるべく', 'できるだけ', 'たくさん', 'かなり', 'ほとんど', 'あまり',
  'よく', 'すぐ', 'すぐに', 'とくに', 'さらに', 'まず', 'もう', 'まだ', 'もし', 'なぜ', 'いつ', 'どこ', 'どれ', 'どう', 'ひとり', 'すでに', 'おろそか',
  'えび', 'かに', 'くるみ', 'そば', 'さば', 'いか', 'たこ', 'あさり', 'しじみ', 'はまぐり', 'あわび', 'うに', 'いくら', 'さけ', 'かき', 'くらげ', 'なまこ', 'わかめ',
  'りんご', 'ぶどう', 'いちご', 'もも', 'ぶり', 'ぎゅうにゅう', 'ふた', 'あわてて', 'はずかしい', 'ぶかぶか', 'ぎっしり', 'ひらひら', 'まっすぐ', 'すみずみ', 'ぐらぐら', 'ふらつき', 'かゆみ', 'じんましん',
  'さっと', 'じゅうぶん', 'うまく', 'よい', 'いい', 'もとづく', 'つながる', 'つながり', 'かぶった', 'かぶる', 'かぶり', 'ぬぐ', 'ぶつける', 'おさえる', 'さわる', 'つまみ出す', 'つまみ', 'ふかく', 'ふかい',
  'とき', 'あと', 'うち', 'まま', 'ころがる', 'たまる', 'つまる', 'はずれる', 'ゆるむ', 'こわれる', 'きれる', 'かえる', 'もらえる',
  'はずす', 'つける', 'つけ', 'かける', 'あてる', 'あてて', 'ふむ', 'かむ', 'すう', 'のむ', 'しく', 'おりる', 'くぐる', 'みみ', 'めん', 'うすい', 'ついている', 'ついて',
  'おおい', 'あげる', 'かわく', 'おいしい', 'おいしく', 'やすい', 'やすく', 'にくい', 'にくく', 'すすぎ', 'すいて', 'まいて', 'しやすい', 'しやすく', 'なりやすい', 'なりやすく', 'すべき',
].sort((a, b) => b.length - a.length);

// First-character bucket indexes for O(1) lookup (sorted longest-first per bucket)
function buildFirstCharIndex(arr) {
  const map = new Map();
  for (const s of arr) {
    const c = s[0];
    if (!map.has(c)) map.set(c, []);
    map.get(c).push(s);
  }
  for (const list of map.values()) list.sort((a, b) => b.length - a.length);
  return map;
}

const CURATED_INDEX = buildFirstCharIndex(CURATED_PHRASES);
const MASTER_INDEX = buildFirstCharIndex(masterMulti);
const HIRA_LEX_INDEX = buildFirstCharIndex(HIRAGANA_LEXICAL_LIST);
const GRAMMAR_INDEX = buildFirstCharIndex([...PURE_GRAMMAR_TOKENS]);

const segJa = new Intl.Segmenter('ja', { granularity: 'word' });
const surfaceInventory = new Map();
const contextTokens = [];

// Exclude English uppercase/sign legend labels (e.g., DANGER, DO, NOT, TOUCH, WATCH, YOUR, HANDS...)
const KEEP_ENGLISH_TERMS = new Set(['ppm', 'ml', 'kg', 'g', 'L', 'm', 'HACCP', 'CCP', 'KYT', 'FIFO', 'OTAFF', 'SNS', 'X', '5S', 'O157', 'O111']);
function isEnglishSignWord(w) {
  return /^[A-Za-z0-9\-]+$/.test(w) && /^[A-Za-z]/.test(w) && !KEEP_ENGLISH_TERMS.has(w);
}

function addToken(surf, reading, sample) {
  if (!surf || /^[0-9０-９.,\-+℃%％~〜～・]+$/.test(surf)) return null;
  if (PURE_GRAMMAR_TOKENS.has(surf)) return null;
  if (isEnglishSignWord(surf)) return null;
  const m = lookupMaster(surf);
  if (!surfaceInventory.has(surf)) {
    surfaceInventory.set(surf, {
      surface: surf,
      masterId: m ? m.id : null,
      masterFurigana: m ? m.furigana : null,
      masterArti: m ? m.arti : null,
      masterUnitType: m ? m.unitType : null,
      masterDictForm: m ? m.dictForm : null,
      autoReading: reading || '',
      count: 0,
      sample,
    });
  }
  const rec = surfaceInventory.get(surf);
  rec.count++;
  if (!rec.autoReading && reading) rec.autoReading = reading;
  return surf;
}

for (let p = 1; p <= 10; p++) {
  const pkg = JSON.parse(fs.readFileSync(`data/latsol-otaff-pm51-${String(p).padStart(2, '0')}.json`, 'utf8'));
  for (const q of pkg.questions) {
    for (const [label, html] of [['P', q.prompt], ...q.options.map(o => [o.id, o.text])]) {
      const key = label === 'P' ? q.id : `${q.id}::${label}`;
      const { plain, rubySpans } = parseHtml(html);
      const tokens = [];
      let i = 0;

      while (i < plain.length) {
        const ch = plain[i];
        const prevDigit = i > 0 ? plain[i - 1] : '';
        if (!/[0-9０-９]/.test(prevDigit)) {
          let fixedHit = null;
          for (const [surf, read] of FIXED_PREFIX_TOKENS) {
            if (plain.startsWith(surf, i)) {
              fixedHit = [surf, read];
              break;
            }
          }
          if (fixedHit) {
            const [surf, read] = fixedHit;
            const end = i + surf.length;
            const t = addToken(surf, read, plain);
            if (t) tokens.push(t);
            i = end;
            continue;
          }
        }
        if (/[\s、。・「」『』（）()／→：；,."'%％℃\-+〜～【】◎×○0-9０-９①-⑩!！※\[\]．＋]/.test(ch)) {
          i++;
          continue;
        }
        if (/[アイウエオ]/.test(ch)) {
          const prev = i > 0 ? plain[i - 1] : '';
          const next = i + 1 < plain.length ? plain[i + 1] : '';
          if (!/[\u30a1-\u30f6ー]/.test(prev) && !/[\u30a1-\u30f6ー]/.test(next)) {
            i++;
            continue;
          }
        }

        // 0. Skip counter-merged <ruby> prefixes cleanly so the real word matches next
        let skippedPrefix = 0;
        for (const [pref, sLen] of MERGED_COUNTER_PREFIXES) {
          if (plain.startsWith(pref, i)) {
            skippedPrefix = sLen;
            break;
          }
        }
        if (skippedPrefix > 0) {
          i += skippedPrefix;
          continue;
        }

        // 1. Check CURATED_INDEX
        let hit = null;
        for (const cp of (CURATED_INDEX.get(ch) || [])) {
          if (plain.startsWith(cp, i)) {
            hit = cp;
            break;
          }
        }
        if (hit) {
          const end = i + hit.length;
          const t = addToken(hit, getReading(plain, rubySpans, i, end), plain);
          if (t) tokens.push(t);
          i = end;
          continue;
        }

        // 2. Check MASTER_INDEX (avoid breaking Katakana/ASCII words or verb stems whose ending continues)
        let mHit = null;
        for (const mk of (MASTER_INDEX.get(ch) || [])) {
          if (plain.startsWith(mk, i)) {
            if (PURE_GRAMMAR_TOKENS.has(mk)) continue;
            const lastChar = mk[mk.length - 1];
            const afterSlice = plain.slice(i + mk.length);
            if (/[\u30a1-\u30f6]/.test(lastChar) && /^[\u30a1-\u30f6ー]/.test(afterSlice)) continue;
            if (/[A-Za-z0-9]/.test(lastChar) && /^[A-Za-z0-9]/.test(afterSlice)) continue;
            // Do not break a verb/adj phrase where mk ends in hiragana i/e/a/te stem before continuation
            if (/[\u3041-\u3096]/.test(lastChar) && /^(?:やすい|やすく|にくい|にくく|すぎ|ている|ていた|て|た|る|ない|ます|はいけない|はいけません|いけない|いる|いた|いない|おり|おく|おいた|しまう|しまった|くる|きた|みる|みた)/.test(afterSlice)) continue;
            mHit = mk;
            break;
          }
        }
        if (mHit) {
          const end = i + mHit.length;
          const t = addToken(mHit, getReading(plain, rubySpans, i, end), plain);
          if (t) tokens.push(t);
          i = end;
          continue;
        }

        // 3. Kanji/Ruby stem + okurigana inflection (counter-safe!)
        const rSpan = rubySpans.find(sp => sp.start === i);
        if (hasKanji(ch) || rSpan) {
          const prevChar = i > 0 ? plain[i - 1] : '';
          const startsCounterAfterDigit = /[0-9０-９]/.test(prevChar) && COUNTER_KANJIS.has(ch);
          let baseEnd = (rSpan && !startsCounterAfterDigit) ? rSpan.end : i + 1;
          if (!rSpan && !startsCounterAfterDigit) {
            while (baseEnd < plain.length && hasKanji(plain[baseEnd])) {
              // If inside `時間` / `年間` etc., allow counter suffixes like `間` or `度` after `年/日/月/週/時/分/秒/件`, stop before unrelated verb/noun kanji
              if (COUNTER_KANJIS.has(plain[baseEnd - 1]) && /[0-9０-９]/.test(prevChar) && plain[baseEnd] !== '間' && plain[baseEnd] !== '目') {
                break;
              }
              if (baseEnd > i && COUNTER_KANJIS.has(plain[baseEnd - 1]) && ['治', '起', '置', '現', '追', '概', '以'].includes(plain[baseEnd])) {
                break;
              }
              baseEnd++;
            }
          } else if (startsCounterAfterDigit && baseEnd < plain.length && ['間', '目', '円'].includes(plain[baseEnd])) {
            baseEnd++;
          }
          const base = plain.slice(i, baseEnd);
          const after = plain.slice(baseEnd);
          let extLen = 0;
          const isMultiKanji = [...base].length >= 2;
          if (isMultiKanji && !COMPOUND_INFLECT_STEMS.has(base)) {
            const mSuru = after.match(OKURI_SURU_ONLY);
            const isKnownPureNoun = masterByKanji.has(base) && !['確認', '洗浄', '殺菌', '加熱', '冷却', '保管', '作業', '管理', '調理', '包装', '印字', '検査', '処理', '乾燥', '消毒', '清掃', '準備', '報告', '連絡', '使用', '着用', '注意', '禁止', '防止', '翻訳', '節約', '生産', '輸出', '発表', '統一', '中止', '警戒'].includes(base);
            if (mSuru && !isKnownPureNoun && !base.endsWith('間')) {
              extLen = mSuru[0].length;
            }
          } else {
            const mOk = after.match(OKURI_VERB_ADJ);
            if (mOk) {
              const cand = mOk[0];
              const baseIsPureNounInMaster = masterByKanji.has(base) && !VERB_ADJ_STEMS.has(base) && !COMPOUND_INFLECT_STEMS.has(base);
              if (!baseIsPureNounInMaster && !startsCounterAfterDigit) {
                if (!['で', 'に'].includes(cand) || ['飲', '選', '進', '噛', '踏', '休', '飛', '呼', '並', '死', '遊', '読'].includes(base)) {
                  // Do not blindly attach 1-char okurigana き/け/り/ち/さ/み onto a known kanji noun unless VERB_ADJ_STEMS
                  if (cand.length > 1 || VERB_ADJ_STEMS.has(base) || COMPOUND_INFLECT_STEMS.has(base)) {
                    extLen = cand.length;
                  }
                }
              }
            }
          }
          const end = baseEnd + extLen;
          const surf = plain.slice(i, end);
          const t = addToken(surf, getReading(plain, rubySpans, i, end), plain);
          if (t) tokens.push(t);
          i = end;
          continue;
        }

        // 4. Katakana word
        if (/[\u30a1-\u30f6]/.test(ch)) {
          const km = plain.slice(i).match(/^[\u30a1-\u30f6ー]+(?:・[\u30a1-\u30f6ー]+)*/);
          const kw = km[0];
          const t = addToken(kw, getReading(kw, [], 0, kw.length), plain);
          if (t) tokens.push(t);
          i += kw.length;
          continue;
        }

        // 5. Latin/Alpha
        if (/[A-Za-z]/.test(ch)) {
          const am = plain.slice(i).match(/^[A-Za-z0-9\-]+/);
          const aw = am[0];
          const t = addToken(aw, aw.toLowerCase(), plain);
          if (t) tokens.push(t);
          i += aw.length;
          continue;
        }

        // 6. Hiragana
        if (/[\u3041-\u3096ー]/.test(ch)) {
          let lexHit = null;
          for (const hw of (HIRA_LEX_INDEX.get(ch) || [])) {
            if (plain.startsWith(hw, i)) { lexHit = hw; break; }
          }
          if (lexHit) {
            const t = addToken(lexHit, lexHit, plain);
            if (t) tokens.push(t);
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
            if (subLex) {
              const t = addToken(subLex, subLex, plain);
              if (t) tokens.push(t);
              pos += subLex.length;
              continue;
            }
            let subGram = null;
            for (const gt of (GRAMMAR_INDEX.get(sc) || [])) {
              if (sub.startsWith(gt)) { subGram = gt; break; }
            }
            if (subGram) {
              pos += subGram.length;
              continue;
            }
            const segs = [...segJa.segment(sub)];
            const first = segs[0]?.segment || sub[0];
            let cutsIntoHiraLex = false;
            for (let k = 1; k < first.length; k++) {
              const tail = sub.slice(k);
              if ((HIRA_LEX_INDEX.get(tail[0]) || []).some(hw => tail.startsWith(hw))) {
                cutsIntoHiraLex = true;
                break;
              }
            }
            if (cutsIntoHiraLex) {
              pos += 1;
              continue;
            }
            if (!PURE_GRAMMAR_TOKENS.has(first) && [...first].length >= 2) {
              const t = addToken(first, first, plain);
              if (t) tokens.push(t);
            }
            pos += first.length;
          }
          i += chunk.length;
          continue;
        }

        i++;
      }

      contextTokens.push({ key, plain, tokens: [...new Set(tokens)] });
    }
  }
}

const allSurfaces = [...surfaceInventory.values()].sort((a, b) => b.count - a.count);
const inMaster = allSurfaces.filter(x => x.masterId !== null);
const notInMaster = allSurfaces.filter(x => x.masterId === null);

console.log({
  totalContexts: contextTokens.length,
  uniqueSurfaces: allSurfaces.length,
  matchedInMaster: inMaster.length,
  needsNewDefinition: notInMaster.length,
  avgTokensPerContext: Number((contextTokens.reduce((a, c) => a + c.tokens.length, 0) / contextTokens.length).toFixed(2)),
});

fs.writeFileSync('deliverables/kotoba-repair/phase2-v3-surfaces.json', JSON.stringify({
  summary: {
    totalContexts: contextTokens.length,
    uniqueSurfaces: allSurfaces.length,
    matchedInMaster: inMaster.length,
    needsNewDefinition: notInMaster.length,
  },
  needsNewDefinition: notInMaster,
  matchedInMaster: inMaster,
  contextTokens,
}, null, 2) + '\n', 'utf8');

fs.writeFileSync('deliverables/kotoba-repair/todo-new-v3.txt', notInMaster.map((x, idx) => `${idx + 1}. ${x.surface}|${x.autoReading}|${x.count}|${x.sample.slice(0, 50)}`).join('\n') + '\n', 'utf8');
