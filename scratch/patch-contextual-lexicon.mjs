import fs from 'node:fs';

const extraContextual = {
  '一つ::ひと': { base: '一つ', arti: 'Satu / sebuah (bentuk dasar: ひとつ)', domain: 'General', type: 'standalone_term' },
  '口前::ぐちまえ': { base: '口前', arti: 'Bagian bukaan / tepi wadah pengolahan', domain: 'Machinery', type: 'standalone_term' },
  '口内::くちない': { base: '口内', arti: 'Bagian dalam rongga mulut (kebersihan diri dan larangan meludah)', domain: 'Hygiene', type: 'standalone_term' },
  '作業場::さぎょうじょう': { base: '作業場', arti: 'Ruang kerja / area tempat kerja pengolahan makanan', domain: '5S', type: 'standalone_term' },
  '仕組::しく': { base: '仕組み', arti: 'Mekanisme kerja / sistem kerja operasional pabrik', domain: 'Machinery', type: 'standalone_term' },
  '仕入::しい': { base: '仕入れ', arti: 'Pengadaan / pembelian pasokan bahan baku makanan', domain: 'General', type: 'standalone_term' },
  '自記温度計::じきおんどとうけい': { base: '自記温度計', arti: 'Termometer pencatat suhu otomatis (perekam suhu kontinu HACCP CCP)', domain: 'HACCP', type: 'standalone_term' },
  '手洗::てあら': { base: '手洗い', arti: 'Mencuci tangan dengan sabun dan air mengalir sesuai prosedur', domain: 'Hygiene', type: 'standalone_term' },
  '受入::うけい': { base: '受け入れ', arti: 'Penerimaan bahan baku makanan masuk ke pabrik', domain: 'HACCP', type: 'standalone_term' },
  '場所::ばじょ': { base: '場所', arti: 'Tempat / lokasi kerja di pabrik', domain: 'General', type: 'standalone_term' },
  '色分::いろわ': { base: '色分け', arti: 'Pembedaan kode warna pisau dan talenan kerja (mencegah kontaminasi silang)', domain: 'Hygiene', type: 'standalone_term' },
  '食塩::しょくしお': { base: '食塩', arti: 'Garam dapur / garam konsumsi untuk pengolahan makanan', domain: 'Quality', type: 'standalone_term' },
  '赤身魚::あかみさかな': { base: '赤身魚', arti: 'Ikan berdaging merah (tuna, tongkol, cakalang - berisiko histamin)', domain: 'Quality', type: 'standalone_term' },
  '前掛::まえか': { base: '前掛け', arti: 'Celemek kerja kedap air untuk melindungi dari kotoran dan cipratan', domain: 'Hygiene', type: 'standalone_term' },
  '掃除::せいじょう': { base: '掃除', arti: 'Pembersihan kotoran dari lantai dan mesin (5S Seisou)', domain: '5S', type: 'standalone_term' },
  '端::きれはし': { base: '切れ端', arti: 'Potongan sisa tepi bahan makanan', domain: 'Quality', type: 'standalone_term' },
  '値下::ねさ': { base: '値下げ', arti: 'Penurunan harga produk', domain: 'General', type: 'standalone_term' },
  '抽出::ちゅうだ': { base: '抽出', arti: 'Ekstraksi sari bahan pangan', domain: 'Quality', type: 'standalone_term' },
  '駐車場::ちゅうしゃば': { base: '駐車場', arti: 'Area tempat parkir kendaraan', domain: 'General', type: 'standalone_term' },
  '的::だいひょうてき': { base: '代表的', arti: 'Khas / contoh representatif dari bakteri patogen', domain: 'Hygiene', type: 'standalone_term' },
  '熱中症::ねちゅうしょう': { base: '熱中症', arti: 'Heatstroke / sengatan panas (risiko K3 di dapur bersuhu tinggi)', domain: 'Safety', type: 'standalone_term' },
  '箱詰::はこづ': { base: '箱詰め', arti: 'Pengemasan produk pangan jadi ke dalam kotak kardus', domain: 'Quality', type: 'standalone_term' },
  '非常口::ひじょうくち': { base: '非常口', arti: 'Pintu keluar darurat untuk evakuasi saat bencana/kebakaran (K3)', domain: 'Safety', type: 'standalone_term' },
  '美味::おい': { base: '美味しい', arti: 'Lezat / rasa enak produk makanan olahan', domain: 'Quality', type: 'inflected_adjective' },
  '瓶詰::びんづ': { base: '瓶詰め', arti: 'Pengemasan produk makanan ke dalam botol kaca', domain: 'Quality', type: 'standalone_term' },
  '腕時計::うでとけい': { base: '腕時計', arti: 'Jam tangan (dilarang dipakai di area pengolahan karena bahaya kontaminasi benda asing)', domain: 'Hygiene', type: 'standalone_term' },
  '炒飯::ちゃーはん': { base: '炒飯', arti: 'Nasi goreng (produk makanan olahan beras - kasus spora Bacillus cereus)', domain: 'Quality', type: 'standalone_term' }
};

const existing = fs.readFileSync('scratch/lexicon-stems-ambiguous.mjs', 'utf8');

const stemLines = Object.entries(extraContextual).map(([k, v]) => {
  return `  '${k}': { base: '${v.base}', arti: '${v.arti}', domain: '${v.domain}', type: '${v.type}' }`;
}).join(',\n');

const updated = existing.replace('export const STEMS_DEFINITIONS = {', `export const STEMS_DEFINITIONS = {\n${stemLines},`);

fs.writeFileSync('scratch/lexicon-stems-ambiguous.mjs', updated, 'utf8');
console.log('Appended 27 items to scratch/lexicon-stems-ambiguous.mjs');
