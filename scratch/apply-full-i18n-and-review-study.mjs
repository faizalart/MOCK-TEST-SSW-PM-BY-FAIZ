import fs from 'fs';

let code = fs.readFileSync('app.js', 'utf8');

// 1. New keys dictionary
const idExtra = `    furiShowTitle: 'Tampilkan Furigana',
    furiHideTitle: 'Sembunyikan Furigana',
    transShowTitle: 'Tampilkan Terjemahan Indonesia',
    transHideTitle: 'Sembunyikan Terjemahan Indonesia',
    histKicker: 'ARSIP EVALUASI',
    unitSessions: 'sesi',
    unitPackages: 'paket',
    thPkg: 'Paket',
    thAccuracy: 'Akurasi',
    btnReview: 'Review',
    btnDelete: 'Hapus',
    emptyHistTitle: 'Belum ada rekaman ujian.',
    emptyHistSub: 'Selesaikan satu sesi Mock Test untuk mulai melihat tren skor.',
    backupKicker: 'DATA & PREFERENSI',
    backupTitle: 'Backup & Pengaturan',
    backupSecBackup: 'Cadangan & Pemulihan Data',
    backupExportTitle: 'Ekspor Database',
    backupExportDesc: 'Simpan seluruh bank soal, furigana, ilustrasi gambar, dan riwayat ujian ke penyimpanan perangkat.',
    backupBtnZip: 'Unduh Arsip (.zip)',
    backupBtnJson: 'Ekspor JSON (.json)',
    backupRestoreTitle: 'Pulihkan atau Impor Paket',
    backupRestoreDesc: 'Pilih berkas .zip atau .json untuk memulihkan cadangan atau menambahkan paket soal.',
    backupBtnChooseFile: 'Pilih Berkas (.zip / .json)',
    backupStatusNoFile: 'Belum ada berkas dipilih.',
    backupSecPrefs: 'Preferensi Standar',
    backupFieldDuration: 'Durasi Standar Mock Test (Menit)',
    backupFieldCount: 'Jumlah Soal Standar',
    backupToggleResume: 'Lanjutkan sesi otomatis setelah halaman dimuat ulang',
    backupToggleFurigana: 'Tampilkan furigana (ふりがな) secara bawaan',
    backupBtnSave: 'Simpan Preferensi',
    backupBtnReset: 'Reset & Muat Ulang Paket Bawaan',
    studyKicker: 'DAFTAR BELAJAR',
    studyMetaCount: 'soal tersimpan',
    studyAddedDate: 'Ditambahkan:',
    studyCorrectKey: '✓ Kunci',
    studyPromptTransLabel: 'Terjemahan Pertanyaan:',
    studyExplanationLabel: 'Pembahasan:',
    studyTransMissing: 'Terjemahan belum tersedia',
    studyNoMatchFilter: 'Tidak ada soal yang cocok dengan filter atau kata kunci pencarian.',
    studyResetFilterBtn: 'Reset Filter',
    btnClose: 'Tutup',
    reviewSectionTitle: 'Tinjauan Jawaban',
    reviewSelectedLabel: 'Pilihan:',
    reviewKeyLabel: 'Kunci:',
    reviewTagCorrect: 'Benar',
    reviewTagWrong: 'Salah',
    reviewTagBlank: 'Kosong',
    reviewPhotoChange: 'Ubah Foto Kandidat pada Report',
    reviewPhotoAdd: 'Tambahkan Foto Kandidat pada Report (Opsional)',
    reviewTransMissing: 'Terjemahan belum tersedia.',
`;

const enExtra = `    navStudy: 'Study List',
    studyPageDesc: 'Questions marked during CBT exams for deeper review and practice.',
    studyAddTooltip: 'Add to Study List',
    studyRemoveTooltip: 'Remove from Study List',
    studyAddedToast: 'Question added to Study List.',
    studyRemovedToast: 'Question removed from Study List.',
    studyEmptyTitle: 'Study List is Empty',
    studyEmptyDesc: 'Mark challenging questions during CBT exams or review by clicking the + button.',
    studyFilterAll: 'All Packages',
    studySearchPlaceholder: 'Search questions (Japanese / translation)…',
    studySortRecent: 'Recently Added',
    studySortOldest: 'Oldest Added',
    studySortNumber: 'Question Number',
    studyDetail: 'Question Detail',
    studyRemoveBtn: 'Remove from List',
    furiShowTitle: 'Show Furigana',
    furiHideTitle: 'Hide Furigana',
    transShowTitle: 'Show Indonesian Translation',
    transHideTitle: 'Hide Indonesian Translation',
    histKicker: 'EVALUATION ARCHIVE',
    unitSessions: 'sessions',
    unitPackages: 'packages',
    thPkg: 'Package',
    thAccuracy: 'Accuracy',
    btnReview: 'Review',
    btnDelete: 'Delete',
    emptyHistTitle: 'No examination records yet.',
    emptyHistSub: 'Complete a Mock Test session to view score trends and progress.',
    backupKicker: 'DATA & PREFERENCES',
    backupTitle: 'Backup & Settings',
    backupSecBackup: 'Data Backup & Restore',
    backupExportTitle: 'Export Database',
    backupExportDesc: 'Save the entire question bank, furigana, illustrations, and exam history to local storage.',
    backupBtnZip: 'Download Archive (.zip)',
    backupBtnJson: 'Export JSON (.json)',
    backupRestoreTitle: 'Restore or Import Packages',
    backupRestoreDesc: 'Choose a .zip or .json file to restore backups or add question packages.',
    backupBtnChooseFile: 'Choose File (.zip / .json)',
    backupStatusNoFile: 'No file selected.',
    backupSecPrefs: 'Standard Preferences',
    backupFieldDuration: 'Standard Mock Test Duration (Minutes)',
    backupFieldCount: 'Standard Question Count',
    backupToggleResume: 'Automatically resume session after page reload',
    backupToggleFurigana: 'Show furigana (ふりがな) by default',
    backupBtnSave: 'Save Preferences',
    backupBtnReset: 'Reset & Reload Built-in Sets',
    studyKicker: 'STUDY LIST',
    studyMetaCount: 'saved questions',
    studyAddedDate: 'Added:',
    studyCorrectKey: '✓ Key',
    studyPromptTransLabel: 'Question Translation:',
    studyExplanationLabel: 'Explanation:',
    studyTransMissing: 'Translation not available',
    studyNoMatchFilter: 'No questions match the current filter or search keyword.',
    studyResetFilterBtn: 'Reset Filter',
    btnClose: 'Close',
    reviewSectionTitle: 'Answer Review',
    reviewSelectedLabel: 'Selected:',
    reviewKeyLabel: 'Key:',
    reviewTagCorrect: 'Correct',
    reviewTagWrong: 'Incorrect',
    reviewTagBlank: 'Unanswered',
    reviewPhotoChange: 'Change Candidate Photo on Report',
    reviewPhotoAdd: 'Add Candidate Photo to Report (Optional)',
    reviewTransMissing: 'Translation not available.',
`;

const jaExtra = `    furiShowTitle: 'ふりがなを表示',
    furiHideTitle: 'ふりがなを非表示',
    transShowTitle: 'インドネシア語訳を表示',
    transHideTitle: 'インドネシア語訳を非表示',
    histKicker: '評価アーカイブ',
    unitSessions: '件',
    unitPackages: 'パッケージ',
    thPkg: 'パッケージ',
    thAccuracy: '正答率',
    btnReview: '詳細',
    btnDelete: '削除',
    emptyHistTitle: '試験履歴はまだありません。',
    emptyHistSub: '模擬試験を完了すると、ここにスコア履歴が表示されます。',
    backupKicker: 'データ＆設定',
    backupTitle: 'バックアップと設定',
    backupSecBackup: 'データのバックアップと復元',
    backupExportTitle: 'データベース出力',
    backupExportDesc: '問題バンク、ふりがな、画像、試験履歴を端末に保存します。',
    backupBtnZip: 'ZIPアーカイブ保存 (.zip)',
    backupBtnJson: 'JSON出力 (.json)',
    backupRestoreTitle: 'バックアップ復元・パッケージ追加',
    backupRestoreDesc: '.zip または .json ファイルを選択してデータを復元または追加します。',
    backupBtnChooseFile: 'ファイルを選択 (.zip / .json)',
    backupStatusNoFile: 'ファイル未選択',
    backupSecPrefs: '基本設定',
    backupFieldDuration: '模擬試験の標準時間（分）',
    backupFieldCount: '標準問題数',
    backupToggleResume: 'ページ再読み込み後にセッションを自動再開',
    backupToggleFurigana: 'ふりがなをデフォルトで表示する',
    backupBtnSave: '設定を保存',
    backupBtnReset: '初期データをリセット＆再読込',
    studyKicker: '学習リスト',
    studyMetaCount: '問保存',
    studyAddedDate: '追加日:',
    studyCorrectKey: '✓ 正解',
    studyPromptTransLabel: '問題の翻訳:',
    studyExplanationLabel: '解説:',
    studyTransMissing: '翻訳がまだありません',
    studyNoMatchFilter: 'フィルターまたは検索キーワードに一致する問題がありません。',
    studyResetFilterBtn: 'フィルターをリセット',
    btnClose: '閉じる',
    reviewSectionTitle: '解答の確認',
    reviewSelectedLabel: 'あなたの回答:',
    reviewKeyLabel: '正解:',
    reviewTagCorrect: '正解',
    reviewTagWrong: '不正解',
    reviewTagBlank: '未回答',
    reviewPhotoChange: '証明写真を変更',
    reviewPhotoAdd: '証明写真を追加（任意）',
    reviewTransMissing: '翻訳がまだありません。',
`;

// Insert into I18N.id
code = code.replace("    revKeySource: 'Sumber Kunci Jawaban'\n  },", idExtra + "    revKeySource: 'Sumber Kunci Jawaban'\n  },");

// Insert into I18N.en
code = code.replace("    revKeySource: 'Answer Key & Source'\n  },", enExtra + "    revKeySource: 'Answer Key & Source'\n  },");

// Insert into I18N.ja
code = code.replace("    revKeySource: '正解・出典情報'\n  }\n};", jaExtra + "    revKeySource: '正解・出典情報'\n  }\n};");

// 2. Add 3rd button (Study List button) to review cards in buildReviewCardsHTML
const oldTopRight = `<div class="zen-review-top-right">
            <button type="button" class="zen-icon-toggle zen-furi-card-btn \${cardFuriOn ? 'is-active' : ''}" data-action="toggle-card-furigana" data-id="\${esc(q.id)}" aria-pressed="\${cardFuriOn}" title="\${cardFuriOn ? 'Sembunyikan Furigana' : 'Tampilkan Furigana'}" aria-label="Furigana nomor \${qIdx}">
              <span class="zen-icon-glyph" aria-hidden="true">F</span>
            </button>
            <button type="button" class="zen-icon-toggle zen-trans-card-btn \${isTransOpen ? 'is-active' : ''}" data-action="toggle-card-translation" data-id="\${esc(q.id)}" aria-expanded="\${isTransOpen}" title="\${isTransOpen ? 'Sembunyikan Terjemahan Indonesia' : 'Tampilkan Terjemahan Indonesia'}" aria-label="Terjemahan Indonesia nomor \${qIdx}">
              <span class="zen-icon-glyph" aria-hidden="true">文A</span>
            </button>
          </div>`;

const newTopRight = `<div class="zen-review-top-right">
            <button type="button" class="zen-icon-toggle zen-furi-card-btn \${cardFuriOn ? 'is-active' : ''}" data-action="toggle-card-furigana" data-id="\${esc(q.id)}" aria-pressed="\${cardFuriOn}" title="\${cardFuriOn ? esc(t('furiHideTitle')) : esc(t('furiShowTitle'))}" aria-label="Furigana \${qIdx}">
              <span class="zen-icon-glyph" aria-hidden="true">F</span>
            </button>
            <button type="button" class="zen-icon-toggle zen-trans-card-btn \${isTransOpen ? 'is-active' : ''}" data-action="toggle-card-translation" data-id="\${esc(q.id)}" aria-expanded="\${isTransOpen}" title="\${isTransOpen ? esc(t('transHideTitle')) : esc(t('transShowTitle'))}" aria-label="Translation \${qIdx}">
              <span class="zen-icon-glyph" aria-hidden="true">文A</span>
            </button>
            <button type="button" class="zen-icon-toggle zen-study-card-btn \${inStudy ? 'is-active' : ''}" data-action="toggle-review-study" data-id="\${esc(q.id)}" aria-pressed="\${inStudy}" title="\${inStudy ? esc(t('studyRemoveTooltip')) : esc(t('studyAddTooltip'))}" aria-label="\${inStudy ? esc(t('studyRemoveTooltip')) : esc(t('studyAddTooltip'))}">
              <span class="zen-icon-glyph" aria-hidden="true">\${inStudy ? '✓' : '+'}</span>
            </button>
          </div>`;

// Add inStudy definition before top right in buildReviewCardsHTML
code = code.replace(
  "const cardFuriOn = state.cardFurigana?.has(q.id) ? Boolean(state.cardFurigana.get(q.id)) : Boolean(state.examPrefs.showFurigana);",
  "const cardFuriOn = state.cardFurigana?.has(q.id) ? Boolean(state.cardFurigana.get(q.id)) : Boolean(state.examPrefs.showFurigana);\n    const inStudy = isQuestionInStudy(q);"
);

code = code.replace(oldTopRight, newTopRight);

// Localize tag and eval bar in buildReviewCardsHTML
code = code.replace(
  "const tag = blank ? 'Kosong' : correct ? 'Benar' : 'Salah';",
  "const tag = blank ? t('reviewTagBlank') : correct ? t('reviewTagCorrect') : t('reviewTagWrong');"
);

code = code.replace(
  `<div class="zen-trans-eval-bar">
            <span class="zen-trans-eval-chip \${blank ? 'is-blank' : correct ? 'is-correct' : 'is-wrong'}">
              Pilihan: <strong>\${blank ? '—' : \`\${esc(userLetter)}\${userOptTrans ? \` · \${esc(richPlainText(userOptTrans))}\` : (userOptJa ? \` (\${esc(userOptJa)})\` : '')}\`}</strong>
            </span>
            <span class="zen-trans-eval-chip is-correct">
              Kunci: <strong>\${esc(keyLetter)}\${keyOptTrans ? \` · \${esc(richPlainText(keyOptTrans))}\` : (keyOptJa ? \` (\${esc(keyOptJa)})\` : '')}</strong>
            </span>
          </div>`,
  `<div class="zen-trans-eval-bar">
            <span class="zen-trans-eval-chip \${blank ? 'is-blank' : correct ? 'is-correct' : 'is-wrong'}">
              \${esc(t('reviewSelectedLabel'))} <strong>\${blank ? '—' : \`\${esc(userLetter)}\${userOptTrans ? \` · \${esc(richPlainText(userOptTrans))}\` : (userOptJa ? \` (\${esc(userOptJa)})\` : '')}\`}</strong>
            </span>
            <span class="zen-trans-eval-chip is-correct">
              \${esc(t('reviewKeyLabel'))} <strong>\${esc(keyLetter)}\${keyOptTrans ? \` · \${esc(richPlainText(keyOptTrans))}\` : (keyOptJa ? \` (\${esc(keyOptJa)})\` : '')}</strong>
            </span>
          </div>`
);

code = code.replace(
  `: \`<div class="zen-trans-missing">Terjemahan belum tersedia.</div>\`}`,
  `: \`<div class="zen-trans-missing">\${esc(t('reviewTransMissing'))}</div>\`}`
);

// 3. Handle 'toggle-review-study' in handleAction
const toggleReviewStudyCase = `    case 'toggle-review-study': {
      if (!id) break;
      const s = getResultSession();
      const q = (s?.questions || []).find(x => x.id === id) || (state.questions || []).find(x => x.id === id);
      if (!q) break;
      const inStudy = await toggleStudyItem(q);
      el.classList.toggle('is-active', inStudy);
      el.setAttribute('aria-pressed', String(inStudy));
      el.setAttribute('title', inStudy ? t('studyRemoveTooltip') : t('studyAddTooltip'));
      el.setAttribute('aria-label', inStudy ? t('studyRemoveTooltip') : t('studyAddTooltip'));
      const glyph = el.querySelector('.zen-icon-glyph');
      if (glyph) glyph.textContent = inStudy ? '✓' : '+';
      else el.textContent = inStudy ? '✓' : '+';
      break;
    }
`;

if (!code.includes("case 'toggle-review-study':")) {
  code = code.replace("case 'toggle-study-list': {", toggleReviewStudyCase + "    case 'toggle-study-list': {");
}

// 4. Localize renderResult() review section header and labels
code = code.replace(
  `<h2 class="hd-section-title">Tinjauan Jawaban</h2>`,
  `<h2 class="hd-section-title">\${esc(t('reviewSectionTitle'))}</h2>`
);
code = code.replace(
  `\${s.candidatePhoto ? 'Ubah Foto Kandidat pada Report' : 'Tambahkan Foto Kandidat pada Report (Opsional)'}`,
  `\${s.candidatePhoto ? esc(t('reviewPhotoChange')) : esc(t('reviewPhotoAdd'))}`
);
code = code.replace(
  `title="\${state.showAllTranslations ? 'Sembunyikan Semua Terjemahan Indonesia' : 'Tampilkan Semua Terjemahan Indonesia'}"`,
  `title="\${state.showAllTranslations ? esc(t('transHideTitle')) : esc(t('transShowTitle'))}"`
);
code = code.replace(
  `title="\${state.examPrefs.showFurigana ? 'Sembunyikan Furigana (ふりがな)' : 'Tampilkan Furigana (ふりがな)'}"`,
  `title="\${state.examPrefs.showFurigana ? esc(t('furiHideTitle')) : esc(t('furiShowTitle'))}"`
);

// 5. Localize renderHistory()
code = code.replace(
  `<span class="zen-kicker">ARSIP EVALUASI</span>`,
  `<span class="zen-kicker">\${esc(t('histKicker'))}</span>`
);
code = code.replace(
  `<span class="zen-meta-count">\${hist.length} sesi</span>`,
  `<span class="zen-meta-count">\${hist.length} \${esc(t('unitSessions'))}</span>`
);
code = code.replace(
  `<th>Paket</th>`,
  `<th>\${esc(t('thPkg'))}</th>`
);
code = code.replace(
  `<th>Akurasi</th>`,
  `<th>\${esc(t('thAccuracy'))}</th>`
);
code = code.replace(
  `<button type="button" class="hd-row-btn" data-action="open-result" data-id="\${esc(s.id)}">Review</button>`,
  `<button type="button" class="hd-row-btn" data-action="open-result" data-id="\${esc(s.id)}">\${esc(t('btnReview'))}</button>`
);
code = code.replace(
  `<button type="button" class="hd-row-btn zen-danger-btn" data-action="delete-history" data-id="\${esc(s.id)}" title="Hapus">Hapus</button>`,
  `<button type="button" class="hd-row-btn zen-danger-btn" data-action="delete-history" data-id="\${esc(s.id)}" title="\${esc(t('btnDelete'))}">\${esc(t('btnDelete'))}</button>`
);
code = code.replace(
  `<h3 class="hd-empty-title">Belum ada rekaman ujian.</h3>
            <p class="hd-empty-line">Selesaikan satu sesi Mock Test untuk mulai melihat tren skor.</p>`,
  `<h3 class="hd-empty-title">\${esc(t('emptyHistTitle'))}</h3>
            <p class="hd-empty-line">\${esc(t('emptyHistSub'))}</p>`
);

// 6. Localize renderBackup()
code = code.replace(
  `<span class="zen-kicker">DATA &amp; PREFERENSI</span>
          <h1 class="zen-page-title">Backup &amp; Pengaturan</h1>
          <p class="zen-page-meta">\${state.questions.length} soal · \${packages.filter(p => p.total > 0).length} paket · \${state.sessions.length} riwayat · \${(qMB / 1024 / 1024).toFixed(1)} MB</p>`,
  `<span class="zen-kicker">\${esc(t('backupKicker'))}</span>
          <h1 class="zen-page-title">\${esc(t('backupTitle'))}</h1>
          <p class="zen-page-meta">\${state.questions.length} \${esc(t('unitSoal'))} · \${packages.filter(p => p.total > 0).length} \${esc(t('unitPackages'))} · \${state.sessions.length} \${esc(t('unitSessions'))} · \${(qMB / 1024 / 1024).toFixed(1)} MB</p>`
);
code = code.replace(
  `<h2 class="hd-section-title">Cadangan &amp; Pemulihan Data</h2>`,
  `<h2 class="hd-section-title">\${esc(t('backupSecBackup'))}</h2>`
);
code = code.replace(
  `<h3 class="zen-subhead">Ekspor Database</h3>
            <p class="zen-copy">Simpan seluruh bank soal, furigana, ilustrasi gambar, dan riwayat ujian ke penyimpanan perangkat.</p>
            <div class="zen-btn-row">
              <button type="button" class="hd-btn-primary" data-action="export-zip">Unduh Arsip (.zip)</button>
              <button type="button" class="hd-btn-secondary" data-action="export-json">Ekspor JSON (.json)</button>
            </div>`,
  `<h3 class="zen-subhead">\${esc(t('backupExportTitle'))}</h3>
            <p class="zen-copy">\${esc(t('backupExportDesc'))}</p>
            <div class="zen-btn-row">
              <button type="button" class="hd-btn-primary" data-action="export-zip">\${esc(t('backupBtnZip'))}</button>
              <button type="button" class="hd-btn-secondary" data-action="export-json">\${esc(t('backupBtnJson'))}</button>
            </div>`
);
code = code.replace(
  `<h3 class="zen-subhead">Pulihkan atau Impor Paket</h3>
            <p class="zen-copy">Pilih berkas <code>.zip</code> atau <code>.json</code> untuk memulihkan cadangan atau menambahkan paket soal.</p>
            <div class="zen-file-row">
              <label class="hd-btn-secondary zen-file-trigger" for="backup-file">
                Pilih Berkas (.zip / .json)
                <input id="backup-file" type="file" accept=".zip,.json,application/json,application/zip" hidden>
              </label>
              <span id="import-status" class="zen-file-status">Belum ada berkas dipilih.</span>
            </div>`,
  `<h3 class="zen-subhead">\${esc(t('backupRestoreTitle'))}</h3>
            <p class="zen-copy">\${esc(t('backupRestoreDesc'))}</p>
            <div class="zen-file-row">
              <label class="hd-btn-secondary zen-file-trigger" for="backup-file">
                \${esc(t('backupBtnChooseFile'))}
                <input id="backup-file" type="file" accept=".zip,.json,application/json,application/zip" hidden>
              </label>
              <span id="import-status" class="zen-file-status">\${esc(t('backupStatusNoFile'))}</span>
            </div>`
);
code = code.replace(
  `<h2 class="hd-section-title">Preferensi Standar</h2>`,
  `<h2 class="hd-section-title">\${esc(t('backupSecPrefs'))}</h2>`
);
code = code.replace(
  `<span class="zen-label">Durasi Standar Mock Test (Menit)</span>`,
  `<span class="zen-label">\${esc(t('backupFieldDuration'))}</span>`
);
code = code.replace(
  `<span class="zen-label">Jumlah Soal Standar</span>`,
  `<span class="zen-label">\${esc(t('backupFieldCount'))}</span>`
);
code = code.replace(
  `<span>Lanjutkan sesi otomatis setelah halaman dimuat ulang</span>`,
  `<span>\${esc(t('backupToggleResume'))}</span>`
);
code = code.replace(
  `<span>Tampilkan furigana (ふりがな) secara bawaan</span>`,
  `<span>\${esc(t('backupToggleFurigana'))}</span>`
);
code = code.replace(
  `<button class="hd-btn-primary" type="submit">Simpan Preferensi</button>
            <button type="button" class="hd-text-btn hd-text-danger" data-action="clear-all-data">Reset &amp; Muat Ulang Paket Bawaan</button>`,
  `<button class="hd-btn-primary" type="submit">\${esc(t('backupBtnSave'))}</button>
            <button type="button" class="hd-text-btn hd-text-danger" data-action="clear-all-data">\${esc(t('backupBtnReset'))}</button>`
);

// 7. Localize renderStudy()
code = code.replace(
  `<span class="zen-kicker">DAFTAR BELAJAR</span>`,
  `<span class="zen-kicker">\${esc(t('studyKicker'))}</span>`
);
code = code.replace(
  `<span class="zen-meta-count" id="study-total-count">\${totalCount} soal tersimpan</span>`,
  `<span class="zen-meta-count" id="study-total-count">\${totalCount} \${esc(t('studyMetaCount'))}</span>`
);
code = code.replace(
  `<span class="zen-study-date">\${fmtDate(item.addedAt)}</span>`,
  `<span class="zen-study-date">\${esc(t('studyAddedDate'))} \${fmtDate(item.addedAt, t('locale'))}</span>`
);
code = code.replace(
  `<span class="zen-study-correct-badge">✓ Kunci</span>`,
  `<span class="zen-study-correct-badge">\${esc(t('studyCorrectKey'))}</span>`
);
code = code.replace(
  `<div style="color:var(--zen-muted);font-style:italic;">Terjemahan belum tersedia</div>`,
  `<div style="color:var(--zen-muted);font-style:italic;">\${esc(t('studyTransMissing'))}</div>`
);
code = code.replace(
  `<strong>Pembahasan:</strong>`,
  `<strong>\${esc(t('studyExplanationLabel'))}</strong>`
);
code = code.replace(
  `<p class="hd-empty-line">Tidak ada soal yang cocok dengan filter atau kata kunci pencarian.</p>
            <button type="button" class="hd-btn-ghost" id="study-reset-filter-btn">Reset Filter</button>`,
  `<p class="hd-empty-line">\${esc(t('studyNoMatchFilter'))}</p>
            <button type="button" class="hd-btn-ghost" id="study-reset-filter-btn">\${esc(t('studyResetFilterBtn'))}</button>`
);

// Detail modal labels
code = code.replace(
  `<span class="zen-study-date">Ditambahkan: \${fmtDate(item.addedAt)}</span>`,
  `<span class="zen-study-date">\${esc(t('studyAddedDate'))} \${fmtDate(item.addedAt, t('locale'))}</span>`
);
code = code.replace(
  `<strong style="color: #1a2228;">Terjemahan Pertanyaan:</strong>`,
  `<strong style="color: #1a2228;">\${esc(t('studyPromptTransLabel'))}</strong>`
);
code = code.replace(
  `<button type="button" class="button button-outline" data-action="close-modal">Tutup</button>
    <button type="button" class="button button-danger" data-action="remove-study-item" data-id="\${esc(item.id)}" onclick="closeModal()">Hapus dari Study List</button>`,
  `<button type="button" class="button button-outline" data-action="close-modal">\${esc(t('btnClose'))}</button>
    <button type="button" class="button button-danger" data-action="remove-study-item" data-id="\${esc(item.id)}" onclick="closeModal()">\${esc(t('studyRemoveBtn'))}</button>`
);

// 8. Exam Settings Popover: Minimalist flags for #exam-pref-lang
code = code.replace(
  `<option value="id" \${state.lang === 'id' ? 'selected' : ''}>Bahasa Indonesia (ID)</option>
            <option value="en" \${state.lang === 'en' ? 'selected' : ''}>English (EN)</option>
            <option value="ja" \${state.lang === 'ja' ? 'selected' : ''}>日本語 (JA)</option>`,
  `<option value="id" \${state.lang === 'id' ? 'selected' : ''}>🇮🇩 ID</option>
            <option value="en" \${state.lang === 'en' ? 'selected' : ''}>🇬🇧 EN</option>
            <option value="ja" \${state.lang === 'ja' ? 'selected' : ''}>🇯🇵 JA</option>`
);

// 9. Bump service worker registration to v=ssw21
code = code.replace("register('./sw.js?v=ssw20')", "register('./sw.js?v=ssw21')");

fs.writeFileSync('app.js', code, 'utf8');
console.log('app.js successfully updated with thorough I18N and review study buttons!');
