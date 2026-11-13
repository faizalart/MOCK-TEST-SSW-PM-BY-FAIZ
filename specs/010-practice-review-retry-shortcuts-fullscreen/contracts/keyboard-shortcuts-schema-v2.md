# Contract: Keyboard Shortcuts Schema v2 & Event Dispatching (US2, US3, US5)

**Feature**: `010-practice-review-retry-shortcuts-fullscreen`  
**Contract ID**: `CTR-010-SHORTCUTS-V2`  
**Spec Reference**: [spec.md](../spec.md#user-story-2---arrow-up--arrow-down-to-scroll-the-question-page-priority-p2)

---

## 1. Action Registry & Default Key Mappings

| Action Identifier | Default Key | User-Facing Label (ID) | Category | Scope / Mode Guard |
|---|:---:|---|---|---|
| `prevQuestion` | `ArrowLeft` | Soal Sebelumnya | Navigasi Soal | All CBT |
| `nextQuestion` | `ArrowRight` | Soal Berikutnya | Navigasi Soal | All CBT |
| `scrollQuestionUp` | `ArrowUp` | Gulir Halaman ke Atas | Navigasi Soal | All CBT (workspace scroll) |
| `scrollQuestionDown` | `ArrowDown` | Gulir Halaman ke Bawah | Navigasi Soal | All CBT (workspace scroll) |
| `selectOption1` | `1` | Pilih Opsi 1 | Kontrol Jawaban | All CBT |
| `selectOption2` | `2` | Pilih Opsi 2 | Kontrol Jawaban | All CBT |
| `selectOption3` | `3` | Pilih Opsi 3 | Kontrol Jawaban | All CBT |
| `toggleFlag` | `w` | Tandai Ragu-ragu (⚑) | Kontrol Ujian | All CBT |
| `toggleMap` | `q` | Tampilkan/Sembunyikan Map Soal | Kontrol Ujian | All CBT |
| `toggleFurigana` | `e` | Tampilkan/Sembunyikan Furigana | Kontrol Teks | All CBT |
| `toggleTranslation` | `y` | Terjemahan Bahasa Indonesia (Global) | Kontrol Teks | Untimed Practice only |
| `toggleStudyList` | `t` | Tandai ke Study List (Toggle) | Alat Belajar | All CBT |
| `togglePracticeReveal` | `u` | Intip Kunci Jawaban (Eye Reveal) | Alat Belajar | Untimed Practice only |
| `toggleQuestionTrans` | `g` | Terjemahan Kalimat Soal | Terjemahan Praktik | Untimed Practice only |
| `toggleOption1Trans` | `a` | Terjemahan Opsi 1 | Terjemahan Praktik | Untimed Practice only |
| `toggleOption2Trans` | `s` | Terjemahan Opsi 2 | Terjemahan Praktik | Untimed Practice only |
| `toggleOption3Trans` | `d` | Terjemahan Opsi 3 | Terjemahan Praktik | Untimed Practice only |
| `toggleQuestionKotoba` | `v` | Kosakata Soal (Kotoba) | Kotoba Praktik | Untimed Practice only |
| `toggleOption1Kotoba` | `z` | Kosakata Opsi 1 (Kotoba) | Kotoba Praktik | Untimed Practice only |
| `toggleOption2Kotoba` | `x` | Kosakata Opsi 2 (Kotoba) | Kotoba Praktik | Untimed Practice only |
| `toggleOption3Kotoba` | `c` | Kosakata Opsi 3 (Kotoba) | Kotoba Praktik | Untimed Practice only |
| `finishExam` | `Enter` | Selesai Ujian | Navigasi Ujian | All CBT |
| `closeModal` | `Escape` | Tutup Modal / Dialog | Dialog Global | All |

---

## 2. Event Dispatching Specification

### 2.1 Input Field Bypass Guard
```javascript
function isInputOrEditable(element) {
  if (!element) return false;
  const tag = element.tagName ? element.tagName.toUpperCase() : '';
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return true;
  if (element.isContentEditable) return true;
  if (element.closest('.shortcut-capture-active')) return true;
  return false;
}
```
If `isInputOrEditable(e.target)` returns `true`:
- `handleKeyDown()` MUST immediately return without calling `e.preventDefault()`, allowing standard caret navigation, text entry, and form shortcuts.

### 2.2 Question Workspace Scrolling (US2)
```javascript
const workspace = document.querySelector('.exam-workspace');
if (workspace) {
  const SCROLL_DELTA = 80; // pixels per keypress
  if (action === 'scrollQuestionDown') {
    e.preventDefault();
    workspace.scrollTop += SCROLL_DELTA;
    return;
  }
  if (action === 'scrollQuestionUp') {
    e.preventDefault();
    workspace.scrollTop = Math.max(0, workspace.scrollTop - SCROLL_DELTA);
    return;
  }
}
```

### 2.3 Single-Letter Translation & Kotoba Dispatching (US5)
For option-level shortcuts (`a`, `s`, `d`, `z`, `x`, `c`):
1. Mode check: `if (s.mode !== 'practice') return;`
2. Option resolution respecting shuffle:
   ```javascript
   const displayed = getExamDisplayedOptions(s, q);
   const opt = displayed[targetVisualIndex]; // 0 for A/Z, 1 for S/X, 2 for D/C
   if (!opt) return; // Safely ignore non-existent option
   ```
3. Invocation:
   - For `toggleOptionNTrans`: `toggleSelectiveTranslation(s, q.id, opt.key);`
   - For `toggleOptionNKotoba`: `toggleSelectiveKotoba(s, q.id, opt.key);`
   - For `toggleQuestionTrans`: `toggleSelectiveTranslation(s, q.id, null);`
   - For `toggleQuestionKotoba`: `toggleSelectiveKotoba(s, q.id, null);`
4. Re-render question card with `{ preserveScroll: true }`.

### 2.4 Ergonomic Shortcuts (US3)
- `toggleStudyList` (`t`):
  ```javascript
  e.preventDefault();
  await toggleStudyItem(cq);
  renderExam({ preserveScroll: true });
  ```
- `togglePracticeReveal` (`u`):
  ```javascript
  if (s.mode !== 'practice') return;
  e.preventDefault();
  s.practiceReveal = !Boolean(s.practiceReveal);
  await persistExam();
  renderExam({ preserveScroll: true });
  ```
