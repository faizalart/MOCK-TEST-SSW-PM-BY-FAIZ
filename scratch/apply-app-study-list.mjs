import fs from 'fs';

let code = fs.readFileSync('app.js', 'utf8');

// 1. Add I18N entries
const idStudyI18N = `    navStudy: 'Study List',
    studyPageDesc: 'Kumpulan soal yang ditandai selama ujian untuk dipelajari kembali.',
    studyAddTooltip: 'Tambahkan ke Study List',
    studyRemoveTooltip: 'Hapus dari Study List',
    studyAddedToast: 'Soal berhasil ditambahkan ke Study List.',
    studyRemovedToast: 'Soal dihapus dari Study List.',
    studyEmptyTitle: 'Study List Masih Kosong',
    studyEmptyDesc: 'Tandai soal yang sulit saat ujian CBT dengan menekan tombol + di sebelah tombol F.',
    studyFilterAll: 'Semua Paket',
    studySearchPlaceholder: 'Cari soal (Jepang / Indonesia)…',
    studySortRecent: 'Terbaru Ditambahkan',
    studySortOldest: 'Terlama Ditambahkan',
    studySortNumber: 'Nomor Soal',
    studyDetail: 'Detail Soal',
    studyRemoveBtn: 'Hapus dari List',
`;

const enStudyI18N = `    navStudy: 'Study List',
    studyPageDesc: 'Questions marked during CBT exams for deeper review and practice.',
    studyAddTooltip: 'Add to Study List',
    studyRemoveTooltip: 'Remove from Study List',
    studyAddedToast: 'Question added to Study List.',
    studyRemovedToast: 'Question removed from Study List.',
    studyEmptyTitle: 'Study List is Empty',
    studyEmptyDesc: 'Mark challenging questions during CBT exams by clicking the + button next to F.',
    studyFilterAll: 'All Packages',
    studySearchPlaceholder: 'Search questions (Japanese / translation)…',
    studySortRecent: 'Recently Added',
    studySortOldest: 'Oldest Added',
    studySortNumber: 'Question Number',
    studyDetail: 'Question Detail',
    studyRemoveBtn: 'Remove from List',
`;

const jaStudyI18N = `    navStudy: '学習リスト',
    studyPageDesc: 'CBT模擬試験中に後で復習したい問題としてブックマークした問題一覧です。',
    studyAddTooltip: '学習リストに追加',
    studyRemoveTooltip: '学習リストから削除',
    studyAddedToast: '問題を学習リストに追加しました。',
    studyRemovedToast: '問題を学習リストから削除しました。',
    studyEmptyTitle: '学習リストは空です',
    studyEmptyDesc: 'CBT試験中に「F」ボタン横の「+」を押すと、ここに問題を保存して復習できます。',
    studyFilterAll: 'すべての問題集',
    studySearchPlaceholder: '問題を検索（日本語 / インドネシア語）…',
    studySortRecent: '最近追加された順',
    studySortOldest: '最初に追加された順',
    studySortNumber: '問題番号順',
    studyDetail: '問題詳細',
    studyRemoveBtn: 'リストから削除',
`;

if (!code.includes("navStudy: 'Study List'")) {
  code = code.replace("    navBackup: 'Backup',", idStudyI18N + "    navBackup: 'Backup',");
  code = code.replace("    navBackup: 'Backup',", enStudyI18N + "    navBackup: 'Backup',");
  code = code.replace("    navBackup: 'バックアップ',", jaStudyI18N + "    navBackup: 'バックアップ',");
}

// 2. Add state properties
const stateProps = `  studyList: [],
  studySearch: '',
  studyPackageFilter: 'all',
  studySort: 'recent',
  studyCardFurigana: new Map(),
  studyCardTrans: new Set(),
`;

if (!code.includes('studyList: []')) {
  code = code.replace("  cardFurigana: new Map(),", "  cardFurigana: new Map(),\n" + stateProps);
}

// 3. Update pageLabel & updateShellLanguage
if (!code.includes("study: t('navStudy')")) {
  code = code.replace(
    "    history: t('navHistory'),\n    backup: t('navBackup'),",
    "    history: t('navHistory'),\n    study: t('navStudy'),\n    backup: t('navBackup'),"
  );
  code = code.replace(
    "    history: t('navHistory'),\n    backup: t('navBackup')\n  };",
    "    history: t('navHistory'),\n    study: t('navStudy'),\n    backup: t('navBackup')\n  };"
  );
}

// 4. Update reloadData() to load studyList from DB and update badge
if (!code.includes("all('studyList')")) {
  code = code.replace(
    "const [dbQuestions, dbSessions] = await Promise.all([all('questions'), all('sessions')]);",
    "const [dbQuestions, dbSessions, dbStudyList] = await Promise.all([all('questions'), all('sessions'), all('studyList')]);"
  );
  code = code.replace(
    "state.sessions = dbSessions || [];",
    "state.sessions = dbSessions || [];\n  state.studyList = Array.isArray(dbStudyList) ? dbStudyList : [];\n  updateStudyBadge();"
  );
}

// 5. Update render() to handle 'study'
if (!code.includes("state.page === 'study'")) {
  code = code.replace(
    "else if (state.page === 'backup') renderBackup();",
    "else if (state.page === 'study') renderStudy();\n  else if (state.page === 'backup') renderBackup();"
  );
}

// 6. Update renderExam() to insert study-list-quick-button
if (!code.includes('study-list-quick-button')) {
  // Insert in renderExam() before footer tools
  const furiTarget = `<button type="button" class="exam-tool-button furigana-quick-button \${state.examPrefs.showFurigana ? 'is-active' : ''}" data-action="toggle-furigana-quick" title="\${esc(t('setFuriganaTitle'))}" aria-label="Toggle Furigana" aria-pressed="\${Boolean(state.examPrefs.showFurigana)}">F</button>`;
  const studyBtn = `\n<button type="button" class="exam-tool-button study-list-quick-button \${inStudy ? 'is-active' : ''}" data-action="toggle-study-list" data-id="\${esc(q.id)}" title="\${inStudy ? esc(t('studyRemoveTooltip')) : esc(t('studyAddTooltip'))}" aria-label="\${inStudy ? esc(t('studyRemoveTooltip')) : esc(t('studyAddTooltip'))}" aria-pressed="\${inStudy}">\${inStudy ? '✓' : '+'}</button>`;

  code = code.replace(
    "const img = getQuestionMainMedia(q);",
    "const img = getQuestionMainMedia(q);\n  const inStudy = isQuestionInStudy(q);"
  );
  code = code.replace(furiTarget, furiTarget + studyBtn);
}

// 7. Add study list helper functions and renderStudy()
const studyHelpers = `
function updateStudyBadge() {
  const count = Array.isArray(state.studyList) ? state.studyList.length : 0;
  const badge = $('#nav-study-badge');
  if (badge) {
    badge.textContent = String(count);
    badge.classList.toggle('is-zero', count === 0);
  }
}

function getStudyKey(q) {
  if (!q) return '';
  const liveQ = (state.questions || []).find(x => x.id === q.id) || q;
  const setId = liveQ.setId || q.setId || 'ssw-pm-kunci-ujian-1';
  return \`\${setId}::\${q.id}\`;
}

function isQuestionInStudy(q) {
  if (!q) return false;
  const liveQ = (state.questions || []).find(x => x.id === q.id) || q;
  const setId = liveQ.setId || q.setId || 'ssw-pm-kunci-ujian-1';
  const studyId = \`\${setId}::\${q.id}\`;
  return (state.studyList || []).some(
    item => item.id === studyId || item.id === q.id || (item.questionId === q.id && (item.setId === setId || item.packageId === setId))
  );
}

function makeStudyItem(q) {
  const liveQ = (state.questions || []).find(x => x.id === q.id) || q;
  const setId = liveQ.setId || q.setId || 'ssw-pm-kunci-ujian-1';
  const studyId = \`\${setId}::\${q.id}\`;
  const setName = packageName(setId, liveQ.setName || q.setName || setId);
  return {
    id: studyId,
    compositeId: studyId,
    packageId: setId,
    setId: setId,
    setName: setName,
    questionId: q.id,
    questionNumber: liveQ.questionNumber ?? q.questionNumber ?? 1,
    prompt: liveQ.prompt || q.prompt || '',
    questionText: liveQ.prompt || q.prompt || '',
    instructions: liveQ.instructions || q.instructions || '',
    options: structuredClone(liveQ.options || q.options || []),
    correctIndex: liveQ.correctIndex ?? q.correctIndex ?? 0,
    correctAnswer: liveQ.correctAnswer || q.correctAnswer || 'A',
    explanation: liveQ.explanation || q.explanation || '',
    promptTranslation: liveQ.promptTranslation || q.promptTranslation || '',
    imageMediaId: liveQ.imageMediaId || q.imageMediaId || null,
    questionImage: liveQ.questionImage || q.questionImage || null,
    imageSize: liveQ.imageSize || q.imageSize || 'medium',
    imageRatio: liveQ.imageRatio || q.imageRatio || 'auto',
    imagePosition: liveQ.imagePosition || q.imagePosition || 'center',
    media: liveQ.media || q.media || null,
    addedAt: new Date().toISOString()
  };
}

async function toggleStudyItem(q) {
  if (!q) return false;
  const liveQ = (state.questions || []).find(x => x.id === q.id) || q;
  const setId = liveQ.setId || q.setId || 'ssw-pm-kunci-ujian-1';
  const studyId = \`\${setId}::\${q.id}\`;
  if (!Array.isArray(state.studyList)) state.studyList = [];
  
  const existingIdx = state.studyList.findIndex(
    item => item.id === studyId || item.id === q.id || (item.questionId === q.id && (item.setId === setId || item.packageId === setId))
  );

  if (existingIdx >= 0) {
    const existing = state.studyList[existingIdx];
    state.studyList.splice(existingIdx, 1);
    try {
      await del('studyList', existing.id);
    } catch (e) {
      console.warn('Gagal menghapus dari IndexedDB studyList:', e);
    }
    updateStudyBadge();
    toast(t('studyRemovedToast'), 'info');
    return false;
  } else {
    const newItem = makeStudyItem(q);
    state.studyList.unshift(newItem);
    try {
      await put('studyList', newItem);
    } catch (e) {
      console.warn('Gagal menyimpan ke IndexedDB studyList:', e);
    }
    updateStudyBadge();
    toast(t('studyAddedToast'), 'success');
    return true;
  }
}

async function removeStudyItem(studyId) {
  if (!studyId || !Array.isArray(state.studyList)) return;
  const idx = state.studyList.findIndex(item => item.id === studyId || item.questionId === studyId);
  if (idx >= 0) {
    const item = state.studyList[idx];
    state.studyList.splice(idx, 1);
    try {
      await del('studyList', item.id);
    } catch (e) {
      console.warn('Gagal menghapus studyList:', e);
    }
    updateStudyBadge();
    toast(t('studyRemovedToast'), 'info');
  }
}

function openStudyDetail(item) {
  if (!item) return;
  const img = getQuestionMainMedia(item);
  const content = \`
    <div class="zen-study-modal-wrap">
      <div class="zen-study-card-meta">
        <span class="zen-study-pkg-pill">\${esc(item.setName || packageName(item.setId))}</span>
        <span class="zen-study-qnum-pill">No. \${item.questionNumber}</span>
        <span class="zen-study-date">Ditambahkan: \${fmtDate(item.addedAt)}</span>
      </div>

      \${item.instructions ? \`<div class="zen-review-instruction rich-content" lang="ja">\${richHTML(item.instructions)}</div>\` : ''}
      <h3 class="zen-study-prompt rich-content" lang="ja" style="margin: 8px 0 12px;">\${richHTML(item.prompt)}</h3>

      \${img ? \`<img class="zen-study-image" src="\${mediaURL(img)}" alt="Ilustrasi">\` : ''}

      <div class="zen-study-options">
        \${(item.options || []).map((o, i) => {
          const isCorrect = i === item.correctIndex;
          const letter = String.fromCharCode(65 + i);
          const optTrans = o.translation || o.textId || '';
          return \`
            <div class="zen-study-opt \${isCorrect ? 'is-correct' : ''}">
              <span class="zen-study-opt-letter">\${letter}</span>
              <div class="zen-study-opt-body">
                <span class="rich-content" lang="ja">\${richHTML(o.text)}</span>
                \${optTrans ? \`<div class="zen-trans-opt-text" style="color:#566a7f;font-size:12.5px;margin-top:2px;">\${richHTML(optTrans)}</div>\` : ''}
              </div>
              \${isCorrect ? \`<span class="zen-study-correct-badge">✓ Kunci</span>\` : ''}
            </div>
          \`;
        }).join('')}
      </div>

      \${item.promptTranslation ? \`
        <div class="zen-study-translation-panel">
          <strong style="color: #1a2228;">Terjemahan Pertanyaan:</strong>
          <div class="rich-content" lang="id">\${richHTML(item.promptTranslation)}</div>
        </div>
      \` : ''}

      \${item.explanation ? \`
        <div class="zen-study-explanation">
          <strong>Pembahasan:</strong>
          <div class="rich-content">\${richHTML(item.explanation)}</div>
        </div>
      \` : ''}
    </div>
  \`;
  const footer = \`
    <button type="button" class="button button-outline" data-action="close-modal">Tutup</button>
    <button type="button" class="button button-danger" data-action="remove-study-item" data-id="\${esc(item.id)}" onclick="closeModal()">Hapus dari Study List</button>
  \`;
  modal(\`\${esc(item.setName || 'Soal')} — No. \${item.questionNumber}\`, content, footer);
}

function renderStudy() {
  const items = Array.isArray(state.studyList) ? state.studyList : [];
  const totalCount = items.length;

  if (totalCount === 0) {
    view.innerHTML = \`
      <div class="zen-page zen-study-page">
        <header class="zen-page-head">
          <div>
            <span class="zen-kicker">DAFTAR BELAJAR</span>
            <h1 class="zen-page-title">\${esc(t('navStudy'))}</h1>
            <p class="zen-page-desc">\${esc(t('studyPageDesc'))}</p>
          </div>
          <div class="zen-page-head-actions">
            <span class="zen-meta-count" id="study-total-count">0 soal</span>
            <button type="button" class="hd-btn-primary" data-page="setup">\${esc(t('topStartExam'))}</button>
          </div>
        </header>

        <div class="zen-empty-block">
          <div class="zen-empty-icon" style="font-size: 48px; margin-bottom: 12px;">🔖</div>
          <h3 class="hd-empty-title">\${esc(t('studyEmptyTitle'))}</h3>
          <p class="hd-empty-line" style="max-width: 440px; margin: 0 auto 20px; line-height: 1.6; color: var(--zen-muted);">
            \${esc(t('studyEmptyDesc'))}
          </p>
          <button type="button" class="hd-btn-primary" data-page="setup">\${esc(t('topStartExam'))}</button>
        </div>
      </div>
    \`;
    return;
  }

  // Count per package
  const pkgMap = new Map();
  for (const item of items) {
    const pkgId = item.setId || item.packageId || 'unknown';
    const pkgName = item.setName || packageName(pkgId, pkgId);
    if (!pkgMap.has(pkgId)) {
      pkgMap.set(pkgId, { id: pkgId, name: pkgName, count: 0 });
    }
    pkgMap.get(pkgId).count++;
  }
  const packages = Array.from(pkgMap.values()).sort((a, b) => b.count - a.count);

  // Filter
  const qSearch = (state.studySearch || '').toLowerCase().trim();
  const pkgFilter = state.studyPackageFilter || 'all';

  let filtered = items.filter(item => {
    if (pkgFilter !== 'all' && item.setId !== pkgFilter && item.packageId !== pkgFilter) {
      return false;
    }
    if (qSearch) {
      const pText = (item.prompt || '').toLowerCase();
      const pTrans = (item.promptTranslation || '').toLowerCase();
      const optText = (item.options || []).map(o => (o.text || '') + ' ' + (o.translation || '')).join(' ').toLowerCase();
      const matches = pText.includes(qSearch) || pTrans.includes(qSearch) || optText.includes(qSearch);
      if (!matches) return false;
    }
    return true;
  });

  // Sort
  const sortMode = state.studySort || 'recent';
  if (sortMode === 'recent') {
    filtered.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
  } else if (sortMode === 'oldest') {
    filtered.sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0));
  } else if (sortMode === 'number') {
    filtered.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
  }

  view.innerHTML = \`
    <div class="zen-page zen-study-page">
      <header class="zen-page-head">
        <div>
          <span class="zen-kicker">DAFTAR BELAJAR</span>
          <h1 class="zen-page-title">\${esc(t('navStudy'))}</h1>
          <p class="zen-page-desc">\${esc(t('studyPageDesc'))}</p>
        </div>
        <div class="zen-page-head-actions">
          <span class="zen-meta-count" id="study-total-count">\${totalCount} soal tersimpan</span>
          <button type="button" class="hd-btn-primary" data-page="setup">\${esc(t('topStartExam'))}</button>
        </div>
      </header>

      <section class="zen-study-filter-bar">
        <div class="zen-study-filter-left">
          <div class="zen-study-search-wrap">
            <input type="search" id="study-search-input" placeholder="\${esc(t('studySearchPlaceholder'))}" value="\${esc(state.studySearch || '')}">
          </div>
          <select class="hd-select" id="study-pkg-select">
            <option value="all">\${esc(t('studyFilterAll'))} (\${totalCount})</option>
            \${packages.map(p => \`
              <option value="\${esc(p.id)}" \${pkgFilter === p.id ? 'selected' : ''}>\${esc(p.name)} (\${p.count})</option>
            \`).join('')}
          </select>
        </div>
        <div class="zen-study-filter-right">
          <select class="hd-select" id="study-sort-select">
            <option value="recent" \${sortMode === 'recent' ? 'selected' : ''}>\${esc(t('studySortRecent'))}</option>
            <option value="oldest" \${sortMode === 'oldest' ? 'selected' : ''}>\${esc(t('studySortOldest'))}</option>
            <option value="number" \${sortMode === 'number' ? 'selected' : ''}>\${esc(t('studySortNumber'))}</option>
          </select>
        </div>
      </section>

      <section class="zen-study-list">
        \${filtered.length === 0 ? \`
          <div class="zen-empty-block" style="padding: 36px 20px;">
            <p class="hd-empty-line">Tidak ada soal yang cocok dengan filter atau kata kunci pencarian.</p>
            <button type="button" class="hd-btn-ghost" id="study-reset-filter-btn">Reset Filter</button>
          </div>
        \` : filtered.map(item => {
          const img = getQuestionMainMedia(item);
          const furiOn = state.studyCardFurigana?.has(item.id)
            ? Boolean(state.studyCardFurigana.get(item.id))
            : Boolean(state.examPrefs.showFurigana);
          const transOpen = state.studyCardTrans?.has(item.id) ?? true;
          return \`
            <article class="zen-study-card \${furiOn ? 'furigana-on' : 'furigana-off'}" data-study-id="\${esc(item.id)}">
              <div class="zen-study-card-top">
                <div class="zen-study-card-meta">
                  <span class="zen-study-pkg-pill">\${esc(item.setName || packageName(item.setId))}</span>
                  <span class="zen-study-qnum-pill">No. \${item.questionNumber}</span>
                  <span class="zen-study-date">\${fmtDate(item.addedAt)}</span>
                </div>
                <div class="zen-study-card-actions">
                  <button type="button" class="zen-icon-toggle \${furiOn ? 'is-active' : ''}" data-action="toggle-study-card-furigana" data-id="\${esc(item.id)}" title="Toggle Furigana" aria-pressed="\${furiOn}">F</button>
                  <button type="button" class="zen-icon-toggle \${transOpen ? 'is-active' : ''}" data-action="toggle-study-card-translation" data-id="\${esc(item.id)}" title="Toggle Terjemahan" aria-pressed="\${transOpen}">文A</button>
                  <button type="button" class="zen-action-btn" data-action="open-study-detail" data-id="\${esc(item.id)}" title="\${esc(t('studyDetail'))}">🔍 Detail</button>
                  <button type="button" class="zen-action-btn is-danger" data-action="remove-study-item" data-id="\${esc(item.id)}" title="\${esc(t('studyRemoveBtn'))}">✕</button>
                </div>
              </div>

              \${item.instructions ? \`<div class="zen-review-instruction rich-content" lang="ja">\${richHTML(item.instructions)}</div>\` : ''}
              <h3 class="zen-study-prompt rich-content" lang="ja">\${richHTML(item.prompt)}</h3>

              \${img ? \`<img class="zen-study-image" src="\${mediaURL(img)}" alt="Ilustrasi Soal \${item.questionNumber}">\` : ''}

              <div class="zen-study-options">
                \${(item.options || []).map((o, idx) => {
                  const isCorrect = idx === item.correctIndex;
                  const letter = String.fromCharCode(65 + idx);
                  return \`
                    <div class="zen-study-opt \${isCorrect ? 'is-correct' : ''}">
                      <span class="zen-study-opt-letter">\${letter}</span>
                      <div class="zen-study-opt-body">
                        <span class="rich-content" lang="ja">\${richHTML(o.text)}</span>
                      </div>
                      \${isCorrect ? \`<span class="zen-study-correct-badge">✓ Kunci</span>\` : ''}
                    </div>
                  \`;
                }).join('')}
              </div>

              <div class="zen-study-translation-panel \${transOpen ? '' : 'is-hidden'}" lang="id">
                \${item.promptTranslation ? \`
                  <div style="font-weight:600;margin-bottom:4px;">\${richHTML(item.promptTranslation)}</div>
                \` : \`<div style="color:var(--zen-muted);font-style:italic;">Terjemahan belum tersedia</div>\`}
                <div style="display:flex;flex-direction:column;gap:3px;margin-top:6px;font-size:13px;">
                  \${(item.options || []).map((o, idx) => {
                    const isKey = idx === item.correctIndex;
                    const letter = String.fromCharCode(65 + idx);
                    const optTrans = o.translation || o.textId || '';
                    return \`
                      <div style="display:flex;gap:6px;align-items:baseline;\${isKey ? 'font-weight:600;color:#2e5c1e;' : ''}">
                        <span>\${letter}.</span>
                        <span>\${optTrans ? richHTML(optTrans) : '—'}</span>
                        \${isKey ? '<span style="font-size:11px;background:#9ecb65;color:#1a3311;padding:1px 5px;border-radius:3px;">Kunci</span>' : ''}
                      </div>
                    \`;
                  }).join('')}
                </div>
              </div>

              \${item.explanation ? \`
                <div class="zen-study-explanation">
                  <strong>Pembahasan:</strong>
                  <div class="rich-content">\${richHTML(item.explanation)}</div>
                </div>
              \` : ''}
            </article>
          \`;
        }).join('')}
      </section>
    </div>
  \`;

  // Attach listeners
  const sInput = $('#study-search-input');
  if (sInput) {
    sInput.addEventListener('input', (e) => {
      state.studySearch = e.target.value;
      renderStudy();
      const nextInput = $('#study-search-input');
      if (nextInput) {
        nextInput.focus();
        nextInput.selectionStart = nextInput.selectionEnd = nextInput.value.length;
      }
    });
  }

  const pkgSelect = $('#study-pkg-select');
  if (pkgSelect) {
    pkgSelect.addEventListener('change', (e) => {
      state.studyPackageFilter = e.target.value;
      renderStudy();
    });
  }

  const sortSelect = $('#study-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.studySort = e.target.value;
      renderStudy();
    });
  }

  const resetBtn = $('#study-reset-filter-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.studySearch = '';
      state.studyPackageFilter = 'all';
      renderStudy();
    });
  }
}
`;

if (!code.includes('function renderStudy()')) {
  code = code.replace('function renderReview() {', studyHelpers + '\nfunction renderReview() {');
}

// 8. Add handleAction cases
const handleCases = `    case 'toggle-study-list': {
      const s = state.activeSession;
      if (!s || !Array.isArray(s.questions)) break;
      const q = s.questions[s.currentIndex];
      if (!q) break;
      const inStudy = await toggleStudyItem(q);
      el.classList.toggle('is-active', inStudy);
      el.setAttribute('aria-pressed', String(inStudy));
      el.setAttribute('title', inStudy ? t('studyRemoveTooltip') : t('studyAddTooltip'));
      el.setAttribute('aria-label', inStudy ? t('studyRemoveTooltip') : t('studyAddTooltip'));
      el.textContent = inStudy ? '✓' : '+';
      break;
    }
    case 'remove-study-item': {
      if (!id) break;
      await removeStudyItem(id);
      if (state.page === 'study') renderStudy();
      break;
    }
    case 'open-study-detail': {
      if (!id) break;
      const item = (state.studyList || []).find(x => x.id === id);
      if (item) openStudyDetail(item);
      break;
    }
    case 'toggle-study-card-furigana': {
      if (!id) break;
      const current = state.studyCardFurigana?.has(id) ? Boolean(state.studyCardFurigana.get(id)) : Boolean(state.examPrefs.showFurigana);
      const next = !current;
      if (!state.studyCardFurigana) state.studyCardFurigana = new Map();
      state.studyCardFurigana.set(id, next);
      const card = el.closest('.zen-study-card');
      if (card) {
        card.classList.toggle('furigana-on', next);
        card.classList.toggle('furigana-off', !next);
      }
      el.classList.toggle('is-active', next);
      el.setAttribute('aria-pressed', String(next));
      break;
    }
    case 'toggle-study-card-translation': {
      if (!id) break;
      if (!state.studyCardTrans) state.studyCardTrans = new Set();
      const isOpen = state.studyCardTrans.has(id);
      if (isOpen) state.studyCardTrans.delete(id);
      else state.studyCardTrans.add(id);
      const card = el.closest('.zen-study-card');
      if (card) {
        const panel = card.querySelector('.zen-study-translation-panel');
        if (panel) panel.classList.toggle('is-hidden', isOpen);
      }
      el.classList.toggle('is-active', !isOpen);
      el.setAttribute('aria-expanded', String(!isOpen));
      break;
    }
`;

if (!code.includes("case 'toggle-study-list':")) {
  code = code.replace("case 'toggle-furigana-quick': {", handleCases + "    case 'toggle-furigana-quick': {");
}

fs.writeFileSync('app.js', code, 'utf8');
console.log('app.js updated successfully!');
