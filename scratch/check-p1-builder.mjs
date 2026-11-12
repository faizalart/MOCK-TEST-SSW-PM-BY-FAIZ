import fs from 'node:fs';

const p1 = JSON.parse(fs.readFileSync('scratch/matched-part1.json', 'utf8'));

// Helper to determine domain category based on key terms
function guessDomain(kanji) {
  if (/HACCP|危害|要因|重要|管理点|CCP|限界|逸脱|モニタリング|検証|分析|中心温度|加熱殺菌/.test(kanji)) return 'HACCP';
  if (/5S|整理|整頓|清掃|清潔|躾|定位置|保管場所|敷地|表示|用具/.test(kanji)) return '5S';
  if (/衛生|手洗い|消毒|殺菌|細菌|微生物|病原|食中毒|嘔吐|下痢|感染|ノロ|黄色|カンピロ|サルモ|ボツリヌス|セレウス|大腸菌|清潔|不潔|汚染|便所|体調|検便|マスク|帽子|手袋|作業着|逆性石鹸|次亜塩素酸/.test(kanji)) return 'Hygiene';
  if (/機械|器具|装置|スイッチ|電源|回転|刃|コンベア|ミキサー|スライサー|フライヤー|オーブン|冷凍機|解凍機|安全装置|安全カバー|分解|組立/.test(kanji)) return 'Machinery';
  if (/安全|労働|災害|事故|危険|保護|ヘルメット|安全靴|感電|火傷|転倒|転落|挟まれ|巻き込まれ|腰痛|熱中症|指差呼称|救急|非常/.test(kanji)) return 'Safety';
  if (/品質|原材料|賞味|消費|期限|アレルギー|特定原材料|乳|小麦|そば|落花生|えび|かに|卵|表示|添加物|水分|油|糖|塩|検査|官能|規格/.test(kanji)) return 'Quality';
  return 'General';
}

console.log('Ready to generate part 1 for', p1.length, 'terms');
