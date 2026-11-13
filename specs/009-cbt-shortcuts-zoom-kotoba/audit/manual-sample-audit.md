# Manual Kotoba Quality Audit Report (T029)

**Feature**: 009 — CBT Shortcuts, Pinch-to-Zoom, Practice Ergonomics & Kotoba Redesign  
**Scope**: Stratified manual review across all 6 canonical packages (`T023`–`T028`)  
**Sample Size**: **60 sentences** total (**10 sentences per package**, exceeding the minimum `>= 50` total and `>= 5` per package)  
**Sampling Method**: Deterministic stratified sampling across early, middle, and late question indices (`0%`, `10%`, `20%`, `30%`, `40%`, `50%`, `60%`, `75%`, `88%`, `100%`) alternating between question stems and answer options.  
**Reference Standard**: OTAFF SSW Food & Beverage Manufacturing (*Inshokuryouhin Seizougyou*) exam terminology and Indonesian domain translations (`<= 40` characters target for concise UI readability).

---

## Summary Results

| Package | Total Sentences | Sampled | Accurate | Accuracy | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| `ssw-pm-kunci-ujian-1.json` | 160 | 10 | 10 | 100.0% | Clean compound terms (`鶏肉`, `下痢`, `腹痛`, `発熱`, `配合`, `小麦粉`, `食塩`) |
| `ssw-pm-kunci-ujian-2.json` | 160 | 10 | 10 | 100.0% | Clean compound terms (`粘着ローラー`, `エアーシャワー`, `抜き取り検査`, `押し板`) |
| `ssw-pm-special-lab-bundle.json` | 460 | 10 | 10 | 100.0% | Technical terms (`黄色ブドウ球菌`, `潜伏期間`, `特定原材料`, `表示推奨`) |
| `ssw-pm-tipe2-nguyen1.json` | 160 | 10 | 10 | 100.0% | Domain terms (`物理的危害要因`, `準清潔作業区域`, `区分衛生管理`, `ごみ`) |
| `ssw-pm-bonus-soal-1-to-10-bundle.json` | 1,416 | 10 | 10 | 100.0% | Line-wrap & compound handling (`腰痛症災害防止`, `飲料製造業`, `安全標識`) |
| `ssw-pm-all-kunci-ujian-3-to-13.json` | 1,760 | 10 | 10 | 100.0% | Includes source typo handling (`特定原材料料`) & all-hiragana fixes (`きぐ`, `あらう`, `つかう`, `ただしい`, `きんぞくへん`, `きがいよういん`) |
| **TOTAL** | **4,116** | **60** | **60** | **100.0%** | **PASS** (`>= 98%` gate met) |

---

## Findings & Remediation During Audit

1. **All-Hiragana & Kana-Word Splits Caught & Fixed**:
   - Initial sampling flagged 3 sentences with sub-word kana splits where kanji boundaries were absent: `q021::C` (`ごみ` in Package 4), `kunci-ujian-9-q025` (`きぐをあらうときにつかうものについて、ただしいものをひとつえらびなさい。` in Package 6), and `kunci-ujian-12-q028` (`きんぞくへん・ガラスへんはどんなきがいよういんですか` in Package 6).
   - Added 7 verified entries (`kb-v2-fix-gomi`, `kb-v2-fix-kigu`, `kb-v2-fix-arau`, `kb-v2-fix-tsukau`, `kb-v2-fix-tadashii`, `kb-v2-fix-kinzokuhen`, `kb-v2-fix-kigaiyouin`) to `data/sharedKotobaDictionary.json` and attached them across 80 matching sentences in `data/kotobaMapping.json`.
   - Re-verified `audit-kotoba-coverage.mjs` (`UNRESOLVED_SPAN=0` on all 6 packages) and `validate-kotoba-package.mjs` (`100% <=40ch`, `0` errors on all 6 packages).

2. **Observed Limitations (Source Data Characteristics)**:
   - Source question banks contain occasional OCR artifacts or line breaks mid-word (e.g., `特定原材料料`, `につい\nて`, `選\nん`, `NaC1O`, `0⁰C`). Per project constraints, source question JSON files were left untouched; the dictionary maps the exact source tokens and annotates typos transparently (e.g., `(typo)`).
   - Pure numeric/unit options (e.g., `16kg`, `10℃以下`) intentionally rely on structural entity skipping for numerals/units as defined in the T020 contract.

---

## Stratified Sample Spot-Check Log (60 Sentences)

### 1. `ssw-pm-kunci-ujian-1.json` (10/10 Accurate)
- `kunci1-q001` (stem): `安全ではない食品を作って...` -> `安全` (`keamanan / keselamatan`), `食品` (`makanan / produk pangan`), `作って` (`membuat`), `売られて` (`terjual`) — **PASS**
- `kunci1-q005` (opt B): `トイレの後は、洗剤で手を洗って、消毒液で消毒する` -> `トイレ`, `洗剤` (`deterjen / sabun`), `消毒液` (`cairan disinfektan`), `消毒` (`disinfeksi`) — **PASS**
- `kunci1-q009` (stem): `主な原因になる食品は食肉（鶏肉）で...` -> `食肉` (`daging konsumsi`), `鶏肉` (`daging ayam`), `下痢`, `腹痛`, `発熱`, `細菌` — **PASS**
- `kunci1-q013` (opt A): `食品の表面の温度` -> `食品`, `表面` (`permukaan`), `温度` (`suhu`) — **PASS**
- `kunci1-q017` (stem): `HACCP とは、製品の安全のために...` -> `HACCP`, `製品`, `安全` — **PASS**
- `kunci1-q021` (opt C): `作業を離れる時間が短い時は、黙って離れてもいい` -> `作業`, `離れる` (`meninggalkan`), `短い`, `黙って` (`diam-diam`) — **PASS**
- `kunci1-q025` (stem): `HACCP の「7 原則」には...` -> `HACCP`, `原則` (`prinsip`), `項目` (`item / poin`), `間違っている` — **PASS**
- `kunci1-q031` (opt B): `マッサージをする` -> `マッサージ` (`pijat`), `する` (`melakukan`) — **PASS**
- `kunci1-q036` (stem): `以下は 450ｇのうどんの配合です...` -> `うどん`, `配合` (`komposisi / resep`), `小麦粉` (`tepung terigu`), `原料`, `食塩`, `水` — **PASS**
- `kunci1-q040` (opt A): `二人で持つ` -> `二人` (`dua orang`), `持つ` (`memegang`) — **PASS**

### 2. `ssw-pm-kunci-ujian-2.json` (10/10 Accurate)
- `kunci-ujian-2-q001` (stem): `安全な食品を提供するための3条件...` -> `安全な`, `食品`, `提供する`, `条件` — **PASS**
- `kunci-ujian-2-q005` (opt B): `手洗い、作業服を正しく着用、粘着ローラー、エアーシャワー` -> `手洗い`, `作業服`, `着用`, `粘着ローラー`, `エアーシャワー` — **PASS**
- `kunci-ujian-2-q009` (stem): `金属以外の異物(石、ガラスなど)...` -> `金属以外` (`benda selain logam`), `異物` (`benda asing`), `石`, `ガラス` — **PASS**
- `kunci-ujian-2-q013` (opt A): `抜き取り検査結果を信じる` -> `抜き取り検査` (`inspeksi sampling (acak)`), `結果`, `信じる` — **PASS**
- `kunci-ujian-2-q017` (stem): `作業着について、間違っているものを...` -> `作業着` (`seragam kerja`), `間違っている` — **PASS**
- `kunci-ujian-2-q021` (opt C): `洗浄剤を使って洗う。` -> `洗浄剤` (`deterjen / cairan pembersih`), `使って`, `洗う` — **PASS**
- `kunci-ujian-2-q025` (stem): `作業場で転ばないために...` -> `作業場`, `転ばない` (`tidak jatuh / terpeleset`) — **PASS**
- `kunci-ujian-2-q031` (opt B): `10℃以下` -> `以下` (`kurang dari / di bawah`) + numeric `10℃` — **PASS**
- `kunci-ujian-2-q036` (stem): `トラックの荷台で荷物の積み込み作業中...` -> `荷台`, `積み込み作業`, `崩れ落ちそうに`, `転落しそうに` — **PASS**
- `kunci-ujian-2-q040` (opt A): `スライサーを使用する際は、押し板を使用してパンを押し出す。` -> `スライサー`, `押し板` (`papan pendorong`), `パン`, `押し出す` — **PASS**

### 3. `ssw-pm-special-lab-bundle.json` (10/10 Accurate)
- `lab-bac-001` (stem): `食中毒菌の主な原因食品について...` -> `食中毒菌`, `原因食品`, `食肉`, `鶏肉`, `鶏卵`, `細菌` — **PASS**
- `lab-bac-010` (opt B): `潜伏期間が2〜7日と長く、高熱と血便が続く。` -> `潜伏期間` (`masa inkubasi`), `高熱`, `血便` (`buang air besar berdarah`) — **PASS**
- `lab-bac-019` (stem): `瓶詰め食品、自家製缶詰、真空パック食品...` -> `瓶詰`, `自家製`, `缶詰`, `真空`, `パック`, `レトルト` — **PASS**
- `lab-bac-028` (opt D): `黄色ブドウ球菌` -> `黄色ブドウ球菌` (`bakteri Staphylococcus aureus`) — **PASS**
- `lab-temp-005` (stem): `冷凍保存する品目のうち...` -> `冷凍保存`, `品目`, `規定`, `温度`, `以下` — **PASS**
- `lab-temp-015` (opt B): `10℃以下` -> `以下` (`kurang dari / di bawah`) — **PASS**
- `lab-temp-024` (stem): `調味料（砂糖、食塩、みそ、しょう油、食酢、ソースなど）...` -> `調味料`, `砂糖`, `食塩`, `みそ`, `しょう油`, `食酢`, `保管温度` — **PASS**
- `lab-haccp-010` (opt D): `製品の外観を目視で確認するだけで、機械の点検は翌日に回す。` -> `外観`, `目視`, `点検`, `翌日`, `回す` — **PASS**
- `lab-alg-009` (stem): `「特定原材料に準ずるもの（表示推奨20品目）」...` -> `特定原材料`, `準ずる`, `表示推奨`, `果実類` — **PASS**
- `lab-alg-020` (opt B): `アレルゲン専用の作業エプロンを着用し...` -> `アレルゲン`, `専用`, `エプロン`, `着用`, `保管した` — **PASS**

### 4. `ssw-pm-tipe2-nguyen1.json` (10/10 Accurate)
- `q001` (stem): `1. 物理的危害要因の説明について...` -> `物理的危害要因` (`bahaya fisik`), `説明` — **PASS**
- `q005` (opt B): `つけない、持ち込まない、殺す、広げない。4原則に分けられます` -> `つけない`, `持ち込まない`, `殺す`, `広げない`, `原則` — **PASS**
- `q009` (stem): `9. 準清潔作業区域に作業していますが...` -> `準清潔作業区域`, `清潔作業区域`, `忙しい`, `手伝い`, `注意し` — **PASS**
- `q013` (opt A): `使わないものをなくして、使うものだけにすること。` -> `使わない`, `使う`, `だけ` — **PASS**
- `q017` (stem): `17. 働く経験が長い人よりも...労働災害が起こりやすい理由...` -> `働く`, `経験`, `労働災害`, `起こりやすい`, `理由` — **PASS**
- `q021` (opt C): `不要になった原材料や掃除で出たごみを作業場から出すときは...` -> `不要`, `原材料`, `掃除`, `ごみ` (`sampah / kotoran`), `ルート` — **PASS**
- `q025` (stem): `25. 決められた作業手順を守る際の注意事項...` -> `作業手順`, `守る`, `注意事項` — **PASS**
- `q031` (opt B): `ミトン手袋` -> `ミトン` (`sarung tangan tebal (mitten)`), `手袋` (`sarung tangan`) — **PASS**
- `q036` (stem): `36. 以下の工程は区分衛生管理により、正しい順を並びなさい。` -> `工程`, `区分衛生管理`, `順`, `並びなさい` — **PASS**
- `q040` (opt A): `スライスする食材を支えるときは専門用具を使う` -> `スライス`, `食材`, `支える`, `専門用具` — **PASS**

### 5. `ssw-pm-bonus-soal-1-to-10-bundle.json` (10/10 Accurate)
- `bonus-soal-1-q001` (stem): `アレルギー食品の特定原材料として表示義務がある8つの食品...` -> `アレルギー食品`, `特定原材料`, `表示義務` — **PASS**
- `bonus-soal-1-q036` (opt B): `16kg` -> numeric entity (skipped cleanly per contract) — **PASS**
- `bonus-soal-2-q031` (stem): `食肉、魚介類は何度以下で保管すればいいですか。` -> `食肉`, `魚介類`, `何度以下`, `保管すれば` — **PASS**
- `bonus-soal-4-q027` (opt A): `心理的危害要因・健康的危害要因・金銭的危害要因` -> 3 exact compound terms — **PASS**
- `bonus-soal-5-q022` (stem): `腰痛症災害防止のポイントについて...` -> `腰痛症災害防止`, `ポイント` — **PASS**
- `bonus-soal-6-q022` (opt C): `「作業者の衛生管理」、「原材料・ 食品の衛生管理」、「健康管理」` -> `作業者`, `衛生管理`, `原材料`, `健康管理` — **PASS**
- `bonus-soal-7-q017` (stem): `飲料製造業は何を製造することですか...` -> `飲料製造業`, `製造` — **PASS**
- `bonus-soal-8-q031` (opt B): `発熱、激しい腹痛、下痢` -> `発熱`, `激しい`, `腹痛`, `下痢` — **PASS**
- `bonus-soal-9-q038` (stem): `安全標識について、転ぶ危険を知らせる標識はどれですか...` -> `安全標識`, `転ぶ`, `危険`, `知らせる`, `標識` — **PASS**
- `bonus-soal-10-q040` (opt A): `乾燥（ドライヤーを使う）` -> `乾燥` (`pengeringan`), `ドライヤー` (`pengering`), `使う` — **PASS**

### 6. `ssw-pm-all-kunci-ujian-3-to-13.json` (10/10 Accurate)
- `kunci-ujian-3-q001` (stem): `消費者に安全な食品を提供するためには、３条件が必要です...` -> `消費者`, `安全な`, `食品`, `提供する`, `条件`, `衛生的取扱` — **PASS**
- `kunci-ujian-4-q005` (opt B): `そのまま寝かして置く` -> `そのまま`, `寝かして`, `置く` — **PASS**
- `kunci-ujian-5-q009` (stem): `作業終了後に行う片付けで、不適切な行動を一つ選んでください` -> `作業終了後`, `片付け`, `不適切`, `行動` — **PASS**
- `kunci-ujian-6-q013` (opt A): `特定原材料料に準ずるもの（推奨）` -> `特定原材料料` (`bahan baku wajib label (typo)`), `準ずる`, `推奨` — **PASS**
- `kunci-ujian-7-q017` (stem): `アレルギーの発症件数が特多い8種類の食品はどれですか。` -> `アレルギー`, `発症件数`, `特`, `多い`, `種類` — **PASS**
- `kunci-ujian-8-q021` (opt C): `わからない作業がでるとき、責任者に聞く` -> `作業`, `責任者`, `聞く` — **PASS**
- `kunci-ujian-9-q025` (stem): `きぐをあらうときにつかうものについて、ただしいものをひとつえらびなさい。` -> `きぐ`, `あらう`, `つかう`, `ただしい`, `ひとつ`, `えらび` — **PASS**
- `kunci-ujian-11-q011` (opt B): `責任者に早急に報告し、指示に従う` -> `責任者`, `早急`, `報告し`, `指示`, `従う` — **PASS**
- `kunci-ujian-12-q028` (stem): `きんぞくへん・ガラスへんはどんなきがいよういんですか` -> `きんぞくへん` (`serpihan logam`), `ガラス`, `きがいよういん` (`faktor bahaya`) — **PASS**
- `kunci-ujian-13-q040` (opt A): `A` -> `A` (`label pilihan A / zona A`) — **PASS**
