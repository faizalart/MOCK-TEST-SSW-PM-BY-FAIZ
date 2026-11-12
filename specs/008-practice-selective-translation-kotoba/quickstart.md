# Quickstart & Verification Guide: Feature 008 (Full Bank Coverage & Pathway B)

**Feature**: `specs/008-practice-selective-translation-kotoba`  
**Date**: 2026-11-12 (Updated for Full Bank Scope & Pathway B)  
**Target Branch**: `feat/practice-selective-translation-kotoba`

---

## 1. Quick Launch

1. Start a local HTTP server:
   ```bash
   python -m http.server 4176
   ```
2. Open your browser at `http://localhost:4176`.
3. From the Home Dashboard, click **Mulai Mock Test**.
4. Select **Mode Latihan (Tanpa Timer)** to launch untimed Practice Mode.

---

## 2. Step-by-Step Manual Verification Scenarios

### Scenario 1: Mode Isolation (Negative Verification)
1. Go to **Mulai Mock Test** -> select **Ujian Penuh Standar (70 Menit)**.
2. In the exam workspace, observe the question prompt and answer options.
3. **Verify**:
   - Zero left translation buttons exist.
   - Zero right Kotoba buttons exist.
   - Zero `.practice-prompt-row` or `.practice-option-row` wrappers exist.
   - Toolbar globe toggle is strictly omitted.

---

### Scenario 2: Answer Selection Independence (Click Isolation)
1. Launch an untimed Practice session.
2. On Question 1, observe the first option (Option A):
   - Notice the left button (`.practice-ctrl-trans`) and the right button (`.practice-ctrl-kotoba`).
3. Click the **left button** on Option A:
   - **Verify**: The sentence translation for Option A reveals beneath the Japanese text.
   - **Verify**: Option A radio is **NOT** selected (radio remains unselected).
4. Click the **right button** on Option A:
   - **Verify**: The Kotoba list for Option A reveals.
   - **Verify**: Option A radio is **NOT** selected.
5. Click the center area of Option A (`.answer-choice`):
   - **Verify**: Option A is now selected (orange highlight and radio indicator active).
6. Click Option B's center area:
   - **Verify**: Option B becomes selected. Option A's revealed translations and Kotoba remain open!

---

### Scenario 3: Furigana Control via Toolbar F Button
1. In an untimed Practice session, ensure the toolbar F button is **OFF** (`document.body` has class `hide-furigana`).
2. Click the right button (Kotoba) on Question 1 prompt or an option.
3. Observe the revealed Kotoba terms:
   - **Verify**: Terms display base Kanji without furigana (e.g. `整頓 — penataan`).
4. Click the **F button** on the toolbar (`.furigana-quick-button`):
   - **Verify**: Furigana readings appear immediately above the Kanji in the open Kotoba list (`せいとん` above `整頓`).
   - **Verify**: The Kotoba list did **NOT** close.
   - **Verify**: The Sentence Translation did **NOT** change state.
5. Click the **F button** again (toggle OFF):
   - **Verify**: Furigana readings disappear immediately, returning to base Kanji display.
   - **Verify**: The Kotoba list remains open.

---

### Scenario 4: Global Globe vs Selective Translation Interaction
1. Start with toolbar Globe button **OFF**.
2. Click the left button on Option A (reveals translation for Option A only; other options remain in Japanese only).
3. Click the toolbar **Globe button** (toggles ON):
   - **Verify**: All options and prompt translations reveal.
4. Click Option A's left button:
   - **Verify**: Option A translation hides while Option B, C, and prompt translations remain visible.
5. Click the toolbar **Globe button** again (toggles OFF):
   - **Verify**: All translations hide cleanly across the question.

---

### Scenario 5: Shuffling Invariance
1. Go to Home Dashboard -> **Pengaturan Ujian** -> enable **Acak Urutan Pilihan Jawaban (A, B, C)**.
2. Start an untimed Practice session.
3. Reveal translation and Kotoba on Option B (e.g., text *"職場や工場などのゴミを捨てる"*).
4. Click **Next** to go to Question 2.
5. Click **Back** to return to Question 1:
   - **Verify**: The exact option with text *"職場や工場などのゴミを捨てる"* still has translation and Kotoba open, regardless of its shuffled index!

---

### Scenario 6: Android Touchscreen Simulation (Mobile Viewport)
1. Open Chrome DevTools (`F12`) -> toggle Device Toolbar -> select **Pixel 7 / iPhone 14 (390px)**.
2. In an untimed Practice session, observe the layout:
   - Left button, center option choice, and right button are arranged horizontally without overflowing.
   - Control buttons measure at least 44 × 44 px.
   - Left and right buttons are separated by the full width of the answer choice.
3. Tap a control button:
   - **Verify**: Button activates without sticky hover artifacts after release.

---

### Scenario 7: Cross-Package Full Bank Coverage Verification
1. Launch untimed Practice Mode across multiple distinct packages:
   - **Package 1**: `kunci-ujian-1` (Official Exam 1).
   - **Package 2**: `kunci-ujian-7` (Official Exam 7).
   - **Package 3**: `bonus-soal-3` (Bonus Package 3).
   - **Package 4**: `tipe2-nguyen1` (Latsol Tipe 2).
   - **Package 5**: `special-lab-bundle` (Special Lab).
2. For each package:
   - **Verify**: Both left translation button and right Kotoba button render properly on every question and option.
   - **Verify**: Terms reference the centralized `sharedKotobaDictionary` without broken lookups or missing data errors.

---

### Scenario 8: Lexicographical Attribution Verification (Settings Modal `⚙`)
1. In the CBT exam toolbar, click the **Gear icon (`⚙`)** to open the Settings Popover/Modal.
2. Scroll to the **Informasi Lisensi & Atribusi Kosakata** section.
3. **Verify**:
   - Upstream attribution clearly states JMdict by EDRDG with a valid link to CC BY-SA 4.0 and EDRDG's license page.
   - Notice confirms the Indonesian translation was curated in-house under CC BY-SA 4.0.
   - Aggregation notice clarifies that the CBT engine software is proprietary and separate from the dictionary dataset.
