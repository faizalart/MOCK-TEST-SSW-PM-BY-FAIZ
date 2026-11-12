import fs from 'node:fs';

const extraFragments = [
  '後石鹸::あとせっけん',
  '時自分::ときじぶん',
  '差漁場::さぎょじょう',
  '服作業管理::ふくさぎょうかんり',
  '特定原材料料::とくていげんざいりょうりょう',
  '湯入::ゆい',
  '特多::とくおお'
];

const extraCompounds = {
  '年未満::ねんみまん': { arti: 'Kurang dari sekian tahun (kategori usia pekerja atau masa simpan)', domainCategory: 'General', entryType: 'standalone_term' },
  '度以下::どいか': { arti: 'Di bawah sekian derajat Celsius (suhu batas aman penyimpanan makanan)', domainCategory: 'HACCP', entryType: 'standalone_term' },
  '後片付::あとかたづ': { arti: 'Membereskan dan merapikan peralatan setelah pekerjaan selesai (5S Seiton)', domainCategory: '5S', entryType: 'standalone_term' },
  '片付::かたづ': { arti: 'Membereskan tempat kerja dan mengembalikan peralatan ke tempatnya (Seiton)', domainCategory: '5S', entryType: 'standalone_term' },
  '微生物検査::びせいぶつけんさ': { arti: 'Inspeksi pengujian mikrobiologi (angka bakteri patogen, E. coli, coliform)', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '微生物検査項目::びせいぶつけんさこうもく': { arti: 'Item parameter pengujian mikrobiologi pada produk pangan', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '心理的危害要因::しんりてききがいよういん': { arti: 'Faktor bahaya psikologis / stres kerja bagi keselamatan pekerja (K3)', domainCategory: 'Safety', entryType: 'standalone_term' },
  '性洗剤::せいせんざい': { arti: 'Detergen pembersih peralatan pabrik (seperti detergen netral/asam/alkali)', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '感染型::かんせんがた': { arti: 'Tipe infeksi (keracunan makanan akibat menelan bakteri hidup seperti Salmonella/Vibrio)', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '感染型食中毒::かんせんがたしょくちゅうどく': { arti: 'Keracunan makanan tipe infeksi bakteri hidup dalam saluran pencernaan', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '掲示物::けいじぶつ': { arti: 'Papan pengumuman atau poster panduan sanitasi/K3 di dinding pabrik (Seiton)', domainCategory: '5S', entryType: 'standalone_term' },
  '改善措置::かいぜんそち': { arti: 'Tindakan perbaikan / tindakan koreksi saat terjadi deviasi batas kritis HACCP', domainCategory: 'HACCP', entryType: 'standalone_term' },
  '料理中::りょうりちゅう': { arti: 'Saat proses memasak atau pengolahan makanan sedang berlangsung', domainCategory: 'Quality', entryType: 'standalone_term' },
  '施設基準::しせつきじゅん': { arti: 'Standar baku fasilitas bangunan dan sanitasi pabrik pangan', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '日付検査::ひづけけんさ': { arti: 'Inspeksi pengecekan kebenaran tanggal kedaluwarsa pada kemasan produk', domainCategory: 'Quality', entryType: 'standalone_term' },
  '日付検査機::ひづけけんさき': { arti: 'Mesin sensor optik penguji tanggal kedaluwarsa kemasan', domainCategory: 'Machinery', entryType: 'standalone_term' },
  '日後::にちご': { arti: 'Sekian hari kemudian (waktu inkubasi bakteri atau masa simpan)', domainCategory: 'General', entryType: 'standalone_term' },
  '最大風量::さいだいふうりょう': { arti: 'Kecepatan volume hembusan angin maksimal (pada air shower ruang sanitasi)', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '有害生物::ゆうがいせいぶつ': { arti: 'Organisme hama perusak pangan (serangga kecoa, lalat, semut, dan tikus)', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '未熟練作業者::みじゅくれんさぎょうしゃ': { arti: 'Pekerja pemula / belum berpengalaman (wajib didampingi demi keselamatan K3)', domainCategory: 'Safety', entryType: 'standalone_term' },
  '本日出勤::ほんじつしゅっきん': { arti: 'Kehadiran kerja hari ini (pemeriksaan kesehatan harian sebelum masuk pabrik)', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '検査機::けんさき': { arti: 'Mesin penguji inspeksi (detektor logam, sinar-X, timbangan bobot)', domainCategory: 'Machinery', entryType: 'standalone_term' },
  '検査結果::けんさけっか': { arti: 'Hasil pengujian laboratorium mutu atau uji mikrobiologi', domainCategory: 'Quality', entryType: 'standalone_term' },
  '検査記録::けんさきろく': { arti: 'Lembar rekaman hasil pemeriksaan inspeksi mutu produk', domainCategory: 'Quality', entryType: 'standalone_term' },
  '検査項目::けんさこうもく': { arti: 'Item parameter pengujian mutu produk atau sanitasi fasilitas', domainCategory: 'Quality', entryType: 'standalone_term' },
  '検証方法::けんしょうほうほう': { arti: 'Metode verifikasi efektivitas sistem HACCP dan pemantauan CCP', domainCategory: 'HACCP', entryType: 'standalone_term' },
  '業界類::ぎょうかいるい': { arti: 'Kelompok sektor industri pengolahan makanan', domainCategory: 'General', entryType: 'standalone_term' },
  '機械作業中::きかいさぎょうちゅう': { arti: 'Saat mesin sedang beroperasi aktif (dilarang menyentuh bagian bergerak)', domainCategory: 'Safety', entryType: 'standalone_term' },
  '機械掃除::きかいそうじ': { arti: 'Pembersihan dan sanitasi mesin setelah steker dicabut (K3)', domainCategory: '5S', entryType: 'standalone_term' },
  '次亜塩素菌::じあえんそきん': { arti: 'Sterilisasi dengan larutan natrium hipoklorit (disinfektan klorin)', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '次亜塩酸::じあえんさん': { arti: 'Asam hipoklorit / larutan disinfektan klorin untuk sanitasi sayuran', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '次回使用時::じかいしようじ': { arti: 'Saat penggunaan berikutnya (peralatan harus bersih dan siap pakai)', domainCategory: '5S', entryType: 'standalone_term' },
  '殺菌微生物::さっきんびせいぶつ': { arti: 'Mikroorganisme yang dimatikan dalam proses sterilisasi panas', domainCategory: 'HACCP', entryType: 'standalone_term' },
  '殺菌液::さっきんえき': { arti: 'Larutan kimia disinfektan / sanitizer pembunuh bakteri', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '殻付::からつ': { arti: 'Bertempurung / berkulit cangkang (misal telur mentah bercangkang)', domainCategory: 'Quality', entryType: 'standalone_term' },
  '毒素型::どくそがた': { arti: 'Tipe intoksikasi / toksin (keracunan makanan akibat racun bakteri Staphylococcus aureus)', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '水様便::すいようべん': { arti: 'Feses cair / diare berair akut (gejala keracunan makanan patogen)', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '水濡::みずぬ': { arti: 'Basah oleh air (bahaya terpeleset atau sengatan listrik K3)', domainCategory: 'Safety', entryType: 'standalone_term' },
  '油脂類::ゆしるい': { arti: 'Kelompok bahan minyak dan lemak pangan', domainCategory: 'Quality', entryType: 'standalone_term' },
  '注意事故::ちゅういじこ': { arti: 'Poin peringatan bahaya untuk mencegah insiden kecelakaan kerja K3', domainCategory: 'Safety', entryType: 'standalone_term' },
  '注意喚起表示::ちゅういかんきひょうじ': { arti: 'Pelabelan peringatan potensi alergen pada kemasan produk', domainCategory: 'Quality', entryType: 'standalone_term' },
  '洗浄後::せんじょうご': { arti: 'Setelah proses pencucian peralatan dengan detergen selesai', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '洗浄装置::せんじょうそうち': { arti: 'Perangkat mesin pencuci otomatis wadah dan baki makanan', domainCategory: 'Machinery', entryType: 'standalone_term' },
  '流水解凍::りゅうすいかいとう': { arti: 'Pencairan bahan makanan beku menggunakan air mengalir (<20°C)', domainCategory: 'HACCP', entryType: 'standalone_term' },
  '清掃修理::せいそうしゅうり': { arti: 'Pembersihan dan perbaikan komponen mesin pabrik', domainCategory: '5S', entryType: 'standalone_term' },
  '清潔作業区::せいけつさぎょうく': { arti: 'Zona kerja bersih / area higienitas tinggi (Clean Area pengemasan)', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '準清潔作業区域::じゅんせいけつさぎょうくいき': { arti: 'Zona kerja semi-bersih (area pemotongan dan pengolahan awal)', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '濃縮乳::のうしゅくにゅう': { arti: 'Susu kental (produk olahan susu / bahan alergen susu)', domainCategory: 'Quality', entryType: 'standalone_term' },
  '災害的危害要因::さいがいてききがいよういん': { arti: 'Faktor bahaya kecelakaan kerja fisik (terjepit, terlilit mesin, terpeleset)', domainCategory: 'Safety', entryType: 'standalone_term' },
  '災害防止::さいがいぼうし': { arti: 'Pencegahan kecelakaan kerja pabrik (K3)', domainCategory: 'Safety', entryType: 'standalone_term' },
  '無管理状態::むかんりじょうたい': { arti: 'Kondisi tanpa pengawasan kontrol (pelanggaran prinsip HACCP)', domainCategory: 'HACCP', entryType: 'standalone_term' },
  '煮込::にこ': { arti: 'Merebus perlahan / memasak kuah dalam waktu lama', domainCategory: 'Quality', entryType: 'standalone_term' },
  '物理危害要因::ぶつりきがいよういん': { arti: 'Faktor bahaya fisik dalam makanan (pecahan kaca, logam, serangga, batu)', domainCategory: 'HACCP', entryType: 'standalone_term' },
  '物理的危害要因::ぶつりてききがいよういん': { arti: 'Faktor bahaya fisik (Physical Hazard dalam sistem HACCP)', domainCategory: 'HACCP', entryType: 'standalone_term' },
  '特定原材料::とくていげんざいりょう': { arti: '7 bahan pangan penyebab alergi yang wajib dicantumkan pada label makanan di Jepang', domainCategory: 'Quality', entryType: 'standalone_term' },
  '環境管理::かんきょうかんり': { arti: 'Manajemen pengendalian sanitasi lingkungan pabrik', domainCategory: 'Hygiene', entryType: 'standalone_term' },
  '生物的危害要因::せいぶつてききがいよういん': { arti: 'Faktor bahaya biologis (bakteri patogen, virus norovirus, jamur, parasit)', domainCategory: 'HACCP', entryType: 'standalone_term' },
  '生産効率::せいさんこうりつ': { arti: 'Efisiensi laju produksi pabrik makanan', domainCategory: 'General', entryType: 'standalone_term' },
  '生産希望::せいさんきぼう': { arti: 'Target kuantitas produksi yang diharapkan', domainCategory: 'General', entryType: 'standalone_term' },
  '生産施設::せいさんしせつ': { arti: 'Fasilitas pabrik tempat produksi pengolahan makanan', domainCategory: 'General', entryType: 'standalone_term' },
  '生産規模::せいさんきぼ': { arti: 'Skala kapasitas kapasitas produksi pabrik', domainCategory: 'General', entryType: 'standalone_term' },
  '生鮮果実::せいせんかじつ': { arti: 'Buah-buahan segar untuk bahan olahan pangan', domainCategory: 'Quality', entryType: 'standalone_term' },
  '生鮮魚介類::せいせんぎょかいるい': { arti: 'Bahan pangan hasil perikanan dan makanan laut segar', domainCategory: 'Quality', entryType: 'standalone_term' }
};

// Now read existing scratch/lexicon-unmatched-compounds.mjs and append these
const existing = fs.readFileSync('scratch/lexicon-unmatched-compounds.mjs', 'utf8');

// Insert extra fragments into UNMATCHED_FRAGMENTS Set
const fragLines = extraFragments.map(f => `  '${f}'`).join(',\n');
let updated = existing.replace('UNMATCHED_FRAGMENTS = new Set([', `UNMATCHED_FRAGMENTS = new Set([\n${fragLines},`);

// Insert extra compounds into UNMATCHED_COMPOUNDS object
const compoundLines = Object.entries(extraCompounds).map(([k, v]) => {
  return `  '${k}': { arti: '${v.arti}', domainCategory: '${v.domainCategory}', entryType: '${v.entryType}' }`;
}).join(',\n');

updated = updated.replace('UNMATCHED_COMPOUNDS = {', `UNMATCHED_COMPOUNDS = {\n${compoundLines},`);

fs.writeFileSync('scratch/lexicon-unmatched-compounds.mjs', updated, 'utf8');
console.log('Appended 70 items to scratch/lexicon-unmatched-compounds.mjs');
