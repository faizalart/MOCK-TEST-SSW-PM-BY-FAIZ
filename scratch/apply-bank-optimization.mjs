import fs from 'fs';
import path from 'path';

const appPath = path.join(process.cwd(), 'app.js');
let code = fs.readFileSync(appPath, 'utf8');

// Find start of function renderBank()
const bankStartIdx = code.indexOf('function renderBank() {');
if (bankStartIdx === -1) {
  throw new Error('function renderBank() not found');
}

// Find end of renderBank() - it ends right before "// CSV Importer for SSW PM"
const bankEndMarker = '// CSV Importer for SSW PM';
const bankEndIdx = code.indexOf(bankEndMarker);
if (bankEndIdx === -1) {
  throw new Error('// CSV Importer for SSW PM marker not found');
}

const newBankCode = `function fastCleanText(html = '') {
  return String(html || '')
    .replace(/<rt[\\s\\S]*?<\\/rt>/gi, '')
    .replace(/<rp[\\s\\S]*?<\\/rp>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

function getBankQuestionSearchText(q) {
  if (q._bankSearchText) return q._bankSearchText;
  const promptText = q.questionText || fastCleanText(q.prompt);
  const instrText = fastCleanText(q.instructions);
  const optText = (q.options || []).map(o => fastCleanText(o.text)).join(' ');
  const explText = fastCleanText(q.explanation);
  const pkgName = q.setName || '';
  const numText = q.questionNumber ? \`soal \${q.questionNumber}\` : '';
  const text = \`\${promptText} \${instrText} \${optText} \${explText} \${pkgName} \${q.sourcePdf || ''} \${numText}\`.toLowerCase();
  q._bankSearchText = text;
  return text;
}

function generatePaginationPages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = [1];
  if (currentPage > 3) {
    pages.push('…');
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) {
    pages.push('…');
  }
  pages.push(totalPages);
  return pages;
}

function renderBank() {
  const f = state.bankFilter;
  const packages = getAvailablePackages();
  const lang = state.lang || 'id';

  let qs = [];
  let totalItems = 0;
  let pageSize = state.bankPageSize || 50;
  let totalPages = 1;
  let currentPage = 1;
  let startIdx = 0;
  let endIdx = 0;
  let pageItems = [];
  let selectedCount = 0;
  let allVisibleSelected = false;

  if (state.bankListExpanded) {
    qs = [...state.questions];

    if (f.search) {
      const term = f.search.toLowerCase().trim();
      qs = qs.filter(q => getBankQuestionSearchText(q).includes(term));
    }
    if (f.setId !== 'all') qs = qs.filter(q => q.setId === f.setId);
    if (f.media === 'with-image') qs = qs.filter(q => Boolean(q.imageMediaId || q.questionImage || q.options?.some(o => o.mediaId || o.optionImage)));
    if (f.media === 'text-only') qs = qs.filter(q => !(q.imageMediaId || q.questionImage || q.options?.some(o => o.mediaId || o.optionImage)));
    if (f.status === 'active') qs = qs.filter(q => q.active !== false);
    if (f.status === 'inactive') qs = qs.filter(q => q.active === false);

    qs.sort((a, b) => {
      if (a.setId !== b.setId) return String(a.setId).localeCompare(String(b.setId));
      if (a.questionNumber != null && b.questionNumber != null) return a.questionNumber - b.questionNumber;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    state.bankVisibleIds = qs.map(q => q.id);
    selectedCount = [...state.bankSelectedIds].filter(id => state.questions.some(q => q.id === id)).length;
    allVisibleSelected = qs.length > 0 && qs.every(q => state.bankSelectedIds.has(q.id));

    totalItems = qs.length;
    totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (state.bankPage > totalPages) state.bankPage = totalPages;
    if (state.bankPage < 1) state.bankPage = 1;
    currentPage = state.bankPage;
    startIdx = (currentPage - 1) * pageSize;
    endIdx = Math.min(startIdx + pageSize, totalItems);
    pageItems = qs.slice(startIdx, endIdx);
  } else {
    state.bankVisibleIds = [];
  }

  const kunciPackages = packages.filter(p => String(p.id).startsWith('ssw-pm-kunci-ujian-'));
  const bonusPackages = packages.filter(p => !String(p.id).startsWith('ssw-pm-kunci-ujian-'));
  const activeFilter = ['all', 'kunci', 'bonus'].includes(state.homePkgFilter) ? state.homePkgFilter : 'all';
  const visiblePackages = activeFilter === 'kunci'
    ? kunciPackages
    : activeFilter === 'bonus'
      ? bonusPackages
      : packages;

  const activePkgObj = f.setId !== 'all' ? packages.find(p => p.id === f.setId) : null;
  const activePkgIndex = activePkgObj ? packages.indexOf(activePkgObj) : 0;

  const B = lang === 'ja'
    ? {
        kicker: '問題ライブラリ＆エディタ',
        title: '問題バンク',
        meta: \`全\${activeQuestions().length}問 · \${packages.length}パッケージ\`,
        addBtn: '問題を追加',
        importCsv: 'CSV読込',
        importJson: 'JSON読込',
        csvTpl: 'CSVテンプレート',
        exportJson: 'JSON出力',
        reloadBtn: '初期データを再読込',
        catalogTitle: 'パッケージ一覧',
        filterAll: 'すべて',
        filterKunci: '本試験キー',
        filterBonus: '追加演習',
        btnOpenQ: '問題を見る',
        btnStart: '開始',
        allPkgsBtn: 'すべてのパッケージ',
        questionsTitle: '問題バンク（個別問題）',
        soalAvailable: '問が利用可能',
        btnShowQuestions: '問題一覧を表示',
        btnHideQuestions: '問題一覧を折りたたむ',
        btnPrev: '前へ',
        btnNext: '次へ',
        pageShowing: (start, end, total) => \`\${total}問中 \${start}–\${end}問を表示\`,
        shownMeta: \`\${totalItems}問を表示中\`,
        searchPlaceholder: '問題番号・漢字・キーワードで検索…',
        allPkgsOpt: \`すべてのパッケージ (\${state.questions.length})\`,
        mediaAll: 'すべての形式',
        mediaImg: '図解あり',
        mediaTxt: 'テキストのみ',
        statusAll: 'すべての状態',
        statusActive: '有効',
        statusInactive: '無効',
        selectAll: 'すべて選択',
        clearSel: '選択解除',
        deleteSel: \`選択を削除 (\${selectedCount})\`,
        keyLabel: '正解',
        imgTag: '図解',
        inactiveTag: '無効',
        editBtn: '編集',
        dupBtn: '複製',
        delBtn: '削除',
        emptyMsg: '条件に一致する問題がありません。',
        unitSoal: '問',
        unitImg: '図解'
      }
    : lang === 'en'
      ? {
          kicker: 'QUESTION LIBRARY & EDITOR',
          title: 'Question Bank',
          meta: \`\${activeQuestions().length} questions · \${packages.length} packages\`,
          addBtn: 'Add Question',
          importCsv: 'Import CSV',
          importJson: 'Import JSON',
          csvTpl: 'CSV Template',
          exportJson: 'Export JSON',
          reloadBtn: 'Reload Built-in Sets',
          catalogTitle: 'Package Directory',
          filterAll: 'All',
          filterKunci: 'Exam Keys',
          filterBonus: 'Bonus Sets',
          btnOpenQ: 'Questions',
          btnStart: 'Start',
          allPkgsBtn: 'All Packages',
          questionsTitle: 'Individual Question Bank',
          soalAvailable: 'questions available',
          btnShowQuestions: 'Show question list',
          btnHideQuestions: 'Hide question list',
          btnPrev: 'Previous',
          btnNext: 'Next',
          pageShowing: (start, end, total) => \`Showing \${start}–\${end} of \${total}\`,
          shownMeta: \`\${totalItems} shown\`,
          searchPlaceholder: 'Search question number, kanji, or text…',
          allPkgsOpt: \`All Packages (\${state.questions.length})\`,
          mediaAll: 'All Media',
          mediaImg: 'Illustrated',
          mediaTxt: 'Text Only',
          statusAll: 'All Status',
          statusActive: 'Active',
          statusInactive: 'Inactive',
          selectAll: 'Select all',
          clearSel: 'Clear',
          deleteSel: \`Delete (\${selectedCount})\`,
          keyLabel: 'Key',
          imgTag: 'Illustrated',
          inactiveTag: 'Inactive',
          editBtn: 'Edit',
          dupBtn: 'Duplicate',
          delBtn: 'Delete',
          emptyMsg: 'No questions match the current filter.',
          unitSoal: 'questions',
          unitImg: 'illustrated'
        }
      : {
          kicker: 'PUSTAKA & EDITOR SOAL',
          title: 'Bank Soal',
          meta: \`\${activeQuestions().length} soal · \${packages.length} paket\`,
          addBtn: 'Tambah Soal',
          importCsv: 'Impor CSV',
          importJson: 'Impor JSON',
          csvTpl: 'Template CSV',
          exportJson: 'Ekspor JSON',
          reloadBtn: 'Muat Ulang Paket',
          catalogTitle: 'Katalog Paket',
          filterAll: 'Semua',
          filterKunci: 'Kunci Ujian',
          filterBonus: 'Bonus',
          btnOpenQ: 'Daftar Soal',
          btnStart: 'Mulai',
          allPkgsBtn: 'Semua Paket',
          questionsTitle: 'Bank Soal Individual',
          soalAvailable: 'soal tersedia',
          btnShowQuestions: 'Tampilkan daftar soal',
          btnHideQuestions: 'Sembunyikan daftar soal',
          btnPrev: 'Sebelumnya',
          btnNext: 'Berikutnya',
          pageShowing: (start, end, total) => \`Menampilkan soal \${start}–\${end} dari \${total}\`,
          shownMeta: \`\${totalItems} soal\`,
          searchPlaceholder: 'Cari nomor soal, kanji, furigana, atau isi pilihan…',
          allPkgsOpt: \`Semua Paket (\${state.questions.length})\`,
          mediaAll: 'Semua Media',
          mediaImg: 'Dengan Ilustrasi',
          mediaTxt: 'Teks Saja',
          statusAll: 'Semua Status',
          statusActive: 'Aktif',
          statusInactive: 'Nonaktif',
          selectAll: 'Pilih semua',
          clearSel: 'Batal Pilih',
          deleteSel: \`Hapus (\${selectedCount})\`,
          keyLabel: 'Kunci',
          imgTag: 'Ilustrasi',
          inactiveTag: 'Nonaktif',
          editBtn: 'Edit',
          dupBtn: 'Duplikat',
          delBtn: 'Hapus',
          emptyMsg: 'Tidak ada soal yang cocok dengan filter saat ini.',
          unitSoal: 'soal',
          unitImg: 'ilustrasi'
        };

  view.innerHTML = \`
    <div class="zen-page zen-bank-page">
      <input id="csv-import-file" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" hidden>
      <input id="json-set-import-file" type="file" accept=".json,application/json" hidden>

      <header class="zen-page-head">
        <div>
          <span class="zen-kicker">\${esc(B.kicker || t('bankKicker'))}</span>
          <h1 class="zen-page-title">\${esc(B.title)}</h1>
          <p class="zen-page-meta">\${esc(B.meta)}</p>
        </div>
        <div class="zen-head-actions">
          <button type="button" class="hd-btn hd-btn-primary hd-btn-compact" data-action="new-question">\${esc(B.addBtn)}</button>
          <button type="button" class="hd-row-btn" data-action="import-csv">\${esc(B.importCsv)}</button>
          <button type="button" class="hd-row-btn" data-action="import-json-set">\${esc(B.importJson)}</button>
          <button type="button" class="hd-row-btn" data-action="download-csv-template">\${esc(B.csvTpl)}</button>
          <button type="button" class="hd-row-btn" data-action="export-json">\${esc(B.exportJson)}</button>
          <button type="button" class="hd-row-btn" data-action="reload-all-builtin">\${esc(B.reloadBtn)}</button>
        </div>
      </header>

      \${activePkgObj ? \`
        <section class="zen-active-pkg-bar" aria-label="\${esc(B.catalogTitle)}">
          <div class="zen-active-pkg-info">
            <span class="hd-pkg-code">\${esc(getHomePackageCode(activePkgObj, activePkgIndex))}</span>
            <strong class="hd-pkg-name">\${esc(formatHomePackageTitle(activePkgObj).primary)}</strong>
            <span class="hd-section-meta">\${activePkgObj.active} \${esc(B.unitSoal)}</span>
          </div>
          <div class="hd-pkg-actions">
            <button type="button" class="hd-row-btn" data-action="filter-package" data-id="all">\${esc(B.allPkgsBtn)}</button>
            <button type="button" class="hd-row-btn hd-row-btn-primary" data-action="quick-package" data-id="\${esc(activePkgObj.id)}">\${esc(B.btnStart)}</button>
          </div>
        </section>
      \` : \`
        <section class="hd-section zen-catalog-section" aria-labelledby="zen-catalog-heading">
          <div class="hd-section-head">
            <div class="hd-section-title-group">
              <h2 id="zen-catalog-heading" class="hd-section-title">\${esc(B.catalogTitle)}</h2>
            </div>
            <div class="hd-filter-tabs" role="group" aria-label="\${esc(B.catalogTitle)}">
              <button type="button" class="hd-filter-tab \${activeFilter === 'all' ? 'is-active' : ''}" data-action="set-home-pkg-filter" data-id="all" aria-pressed="\${activeFilter === 'all'}">
                <span>\${esc(B.filterAll)}</span>
                <span class="hd-filter-count">\${packages.length}</span>
              </button>
              <button type="button" class="hd-filter-tab \${activeFilter === 'kunci' ? 'is-active' : ''}" data-action="set-home-pkg-filter" data-id="kunci" aria-pressed="\${activeFilter === 'kunci'}">
                <span>\${esc(B.filterKunci)}</span>
                <span class="hd-filter-count">\${kunciPackages.length}</span>
              </button>
              <button type="button" class="hd-filter-tab \${activeFilter === 'bonus' ? 'is-active' : ''}" data-action="set-home-pkg-filter" data-id="bonus" aria-pressed="\${activeFilter === 'bonus'}">
                <span>\${esc(B.filterBonus)}</span>
                <span class="hd-filter-count">\${bonusPackages.length}</span>
              </button>
            </div>
          </div>
          <div class="hd-pkg-list">
            \${visiblePackages.map((pkg, idx) => {
              const code = getHomePackageCode(pkg, idx);
              const titleObj = formatHomePackageTitle(pkg);
              const metaText = \`\${pkg.active} \${B.unitSoal}\${pkg.withImage > 0 ? \` · \${pkg.withImage} \${B.unitImg}\` : ''}\`;
              return \`
                <div class="hd-pkg-row">
                  <span class="hd-pkg-code" aria-hidden="true">\${esc(code)}</span>
                  <div class="hd-pkg-main">
                    <span class="hd-pkg-name">\${esc(titleObj.primary)}</span>
                    \${titleObj.edition ? \`<span class="hd-pkg-edition">\${esc(titleObj.edition)}</span>\` : ''}
                  </div>
                  <span class="hd-pkg-meta">\${esc(metaText)}</span>
                  <div class="hd-pkg-actions">
                    <button type="button" class="hd-row-btn" data-action="filter-package" data-id="\${esc(pkg.id)}">\${esc(B.btnOpenQ)}</button>
                    <button type="button" class="hd-row-btn hd-row-btn-primary" data-action="quick-package" data-id="\${esc(pkg.id)}">\${esc(B.btnStart)}</button>
                  </div>
                </div>
              \`;
            }).join('')}
          </div>
        </section>
      \`}

      \${!state.bankListExpanded ? \`
        <section class="hd-section zen-questions-section is-collapsed" aria-labelledby="zen-questions-heading">
          <div class="hd-section-head zen-q-collapse-head">
            <div class="hd-section-title-group">
              <h2 id="zen-questions-heading" class="hd-section-title">\${esc(B.questionsTitle)}</h2>
              <span class="hd-section-meta">\${state.questions.length.toLocaleString('id-ID')} \${esc(B.soalAvailable)}</span>
            </div>
            <button type="button" class="hd-btn hd-btn-secondary zen-toggle-bank-list-btn" data-action="toggle-bank-list" aria-expanded="false">
              <span>\${esc(B.btnShowQuestions)}</span>
              <span class="zen-btn-arrow" aria-hidden="true">▼</span>
            </button>
          </div>
        </section>
      \` : \`
        <section class="hd-section zen-questions-section is-expanded" aria-labelledby="zen-questions-heading">
          <div class="hd-section-head zen-q-collapse-head">
            <div class="hd-section-title-group">
              <h2 id="zen-questions-heading" class="hd-section-title">\${esc(B.questionsTitle)}</h2>
              <span class="hd-section-meta">\${esc(B.shownMeta)}</span>
            </div>
            <div class="zen-collapse-head-actions">
              <button type="button" class="hd-btn hd-btn-secondary zen-toggle-bank-list-btn" data-action="toggle-bank-list" aria-expanded="true">
                <span>\${esc(B.btnHideQuestions)}</span>
                <span class="zen-btn-arrow" aria-hidden="true">▲</span>
              </button>
            </div>
          </div>

          <div class="zen-bulk-bar">
            <label class="zen-select-all">
              <input id="bank-select-visible" type="checkbox" data-select-visible-questions aria-label="\${esc(B.selectAll)}" \${allVisibleSelected ? 'checked' : ''} \${qs.length ? '' : 'disabled'}>
              <span>\${esc(B.selectAll)}</span>
            </label>
            <button type="button" class="hd-row-btn" data-action="clear-question-selection" \${selectedCount ? '' : 'disabled'}>\${esc(B.clearSel)}</button>
            <button type="button" class="hd-row-btn zen-danger-btn" data-action="delete-selected-questions" \${selectedCount ? '' : 'disabled'}>\${esc(B.deleteSel)}</button>
          </div>

          <div class="zen-filter-bar">
            <input id="bank-search" class="zen-search-input" type="search" placeholder="\${esc(B.searchPlaceholder)}" value="\${esc(f.search)}">
            <select id="bank-package-filter" aria-label="Filter paket soal">
              <option value="all">\${esc(B.allPkgsOpt)}</option>
              \${packages.map(p => \`<option value="\${esc(p.id)}" \${f.setId === p.id ? 'selected' : ''}>\${esc(formatHomePackageTitle(p).primary)} (\${p.total})</option>\`).join('')}
            </select>
            <select id="bank-media-filter" aria-label="Filter media">
              <option value="all" \${f.media === 'all' ? 'selected' : ''}>\${esc(B.mediaAll)}</option>
              <option value="with-image" \${f.media === 'with-image' ? 'selected' : ''}>\${esc(B.mediaImg)}</option>
              <option value="text-only" \${f.media === 'text-only' ? 'selected' : ''}>\${esc(B.mediaTxt)}</option>
            </select>
            <select id="bank-status-filter" aria-label="Filter status">
              <option value="all" \${f.status === 'all' ? 'selected' : ''}>\${esc(B.statusAll)}</option>
              <option value="active" \${f.status === 'active' ? 'selected' : ''}>\${esc(B.statusActive)}</option>
              <option value="inactive" \${f.status === 'inactive' ? 'selected' : ''}>\${esc(B.statusInactive)}</option>
            </select>
          </div>

          <div class="zen-q-list">
            \${pageItems.length ? pageItems.map(q => {
              const img = getQuestionMainMedia(q);
              const hasImg = Boolean(img || q.options?.some(o => o.mediaId || o.optionImage));
              const keyLetter = Number.isInteger(q.correctIndex) ? String.fromCharCode(65 + q.correctIndex) : 'A';
              const pkgLabel = formatHomePackageTitle({ name: packageName(q) }).primary;
              return \`
                <article class="zen-q-item">
                  <div class="zen-q-top">
                    <div class="zen-q-meta">
                      <input type="checkbox" data-question-select="\${esc(q.id)}" aria-label="Pilih soal #\${q.questionNumber || ''}" \${state.bankSelectedIds.has(q.id) ? 'checked' : ''}>
                      <strong class="zen-q-num">#\${q.questionNumber || '1'}</strong>
                      \${f.setId === 'all' ? \`<span class="zen-q-pkg">\${esc(pkgLabel)}</span>\` : ''}
                      <span class="zen-q-key">\${esc(B.keyLabel)} \${esc(keyLetter)}</span>
                      \${hasImg ? \`<span class="zen-q-tag">\${esc(B.imgTag)}</span>\` : ''}
                      \${q.active === false ? \`<span class="zen-q-tag">\${esc(B.inactiveTag)}</span>\` : ''}
                    </div>
                    <div class="zen-q-actions">
                      <button type="button" class="hd-row-btn" data-action="edit-question" data-id="\${esc(q.id)}">\${esc(B.editBtn)}</button>
                      <button type="button" class="hd-row-btn" data-action="duplicate-question" data-id="\${esc(q.id)}">\${esc(B.dupBtn)}</button>
                      <button type="button" class="hd-row-btn zen-danger-btn" data-action="delete-question" data-id="\${esc(q.id)}">\${esc(B.delBtn)}</button>
                    </div>
                  </div>
                  <div class="zen-q-prompt rich-content" lang="ja">\${richHTML(q.prompt || '(pertanyaan kosong)')}</div>
                  <div class="zen-q-options rich-content" lang="ja">
                    \${(q.options || []).map((o, i) => \`
                      <div class="zen-q-opt \${i === q.correctIndex ? 'is-key' : ''}">
                        <span class="zen-q-opt-letter">\${String.fromCharCode(65 + i)}.</span>
                        <span class="zen-q-opt-text">\${richHTML(o.text)}</span>
                      </div>
                    \`).join('')}
                  </div>
                </article>
              \`;
            }).join('') : \`<p class="hd-empty-line">\${esc(B.emptyMsg)}</p>\`}
          </div>

          <div class="zen-pagination">
            <div class="zen-pagination-info">
              \${totalItems > 0 ? \`\${esc(B.pageShowing(startIdx + 1, endIdx, totalItems.toLocaleString('id-ID')))}\` : esc(B.emptyMsg)}
            </div>
            \${totalPages > 1 ? \`
              <nav class="zen-pagination-nav" aria-label="Navigasi halaman soal">
                <button type="button" class="hd-row-btn zen-page-nav-btn" data-action="bank-prev-page" \${currentPage === 1 ? 'disabled aria-disabled="true"' : ''}>
                  ‹ \${esc(B.btnPrev)}
                </button>
                <div class="zen-page-numbers">
                  \${generatePaginationPages(currentPage, totalPages).map(p => {
                    if (p === '…') {
                      return \`<span class="zen-page-ellipsis" aria-hidden="true">…</span>\`;
                    }
                    const isCurrent = p === currentPage;
                    return \`
                      <button type="button" class="zen-page-num-btn \${isCurrent ? 'is-active' : ''}" data-action="bank-go-page" data-page-num="\${p}" \${isCurrent ? 'aria-current="page"' : ''}>
                        \${p}
                      </button>
                    \`;
                  }).join('')}
                </div>
                <button type="button" class="hd-row-btn zen-page-nav-btn" data-action="bank-next-page" \${currentPage === totalPages ? 'disabled aria-disabled="true"' : ''}>
                  \${esc(B.btnNext)} ›
                </button>
              </nav>
            \` : ''}
          </div>
        </section>
      \`}
    </div>\`;
}

`;

// Perform replace of renderBank
code = code.slice(0, bankStartIdx) + newBankCode + code.slice(bankEndIdx);

// Now update actions in click handler
const filterPkgCaseOld = `    case 'filter-package': {
      state.bankFilter.setId = id || 'all';
      await go('bank');
      break;
    }`;

const filterPkgCaseNew = `    case 'filter-package': {
      state.bankFilter.setId = id || 'all';
      state.bankListExpanded = true;
      state.bankPage = 1;
      await go('bank');
      break;
    }
    case 'toggle-bank-list': {
      state.bankListExpanded = !state.bankListExpanded;
      if (state.bankListExpanded) {
        state.bankPage = 1;
      }
      renderBank();
      break;
    }
    case 'bank-prev-page': {
      if (state.bankPage > 1) {
        state.bankPage--;
        renderBank();
        const el = document.getElementById('zen-questions-heading');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      break;
    }
    case 'bank-next-page': {
      state.bankPage++;
      renderBank();
      const el = document.getElementById('zen-questions-heading');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
    case 'bank-go-page': {
      const pageNum = Number(actionBtn.dataset.pageNum);
      if (pageNum && pageNum !== state.bankPage) {
        state.bankPage = pageNum;
        renderBank();
        const el = document.getElementById('zen-questions-heading');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      break;
    }`;

if (code.includes(filterPkgCaseOld)) {
  code = code.replace(filterPkgCaseOld, filterPkgCaseNew);
} else {
  // Try CRLF version
  const filterPkgCaseOldCRLF = filterPkgCaseOld.replace(/\n/g, '\r\n');
  const filterPkgCaseNewCRLF = filterPkgCaseNew.replace(/\n/g, '\r\n');
  code = code.replace(filterPkgCaseOldCRLF, filterPkgCaseNewCRLF);
}

// Update filter change handler to reset page to 1
const filterChangeOld = `    if (target.matches('#bank-package-filter, #bank-media-filter, #bank-status-filter')) {
      if (target.id === 'bank-package-filter') state.bankFilter.setId = target.value;
      if (target.id === 'bank-media-filter') state.bankFilter.media = target.value;
      if (target.id === 'bank-status-filter') state.bankFilter.status = target.value;
      renderBank();
      return;
    }`;

const filterChangeNew = `    if (target.matches('#bank-package-filter, #bank-media-filter, #bank-status-filter')) {
      if (target.id === 'bank-package-filter') state.bankFilter.setId = target.value;
      if (target.id === 'bank-media-filter') state.bankFilter.media = target.value;
      if (target.id === 'bank-status-filter') state.bankFilter.status = target.value;
      state.bankPage = 1;
      renderBank();
      return;
    }`;

if (code.includes(filterChangeOld)) {
  code = code.replace(filterChangeOld, filterChangeNew);
} else {
  code = code.replace(filterChangeOld.replace(/\n/g, '\r\n'), filterChangeNew.replace(/\n/g, '\r\n'));
}

// Update search input handler to reset page to 1
const searchInputOld = `  if (tEl.matches('#bank-search')) {
    state.bankFilter.search = tEl.value;
    const start = tEl.selectionStart;
    renderBank();
    const next = $('#bank-search');
    next?.focus();
    try { next?.setSelectionRange(start, start); } catch {}
  }`;

const searchInputNew = `  if (tEl.matches('#bank-search')) {
    state.bankFilter.search = tEl.value;
    state.bankPage = 1;
    const start = tEl.selectionStart;
    renderBank();
    const next = $('#bank-search');
    next?.focus();
    try { next?.setSelectionRange(start, start); } catch {}
  }`;

if (code.includes(searchInputOld)) {
  code = code.replace(searchInputOld, searchInputNew);
} else {
  code = code.replace(searchInputOld.replace(/\n/g, '\r\n'), searchInputNew.replace(/\n/g, '\r\n'));
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('Successfully updated app.js!');
