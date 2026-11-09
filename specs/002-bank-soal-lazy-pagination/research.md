# Research & Bottleneck Analysis: Bank Soal (002-bank-soal-lazy-pagination)

## 1. Empirical Baseline Measurements (Pre-Optimization)

Measured using Chrome Headless CDP (`tests/benchmark-bank-soal.mjs`):
- **Total in-memory questions**: 1,006 questions across 27 packages
- **DOM elements before clicking Bank Soal tab**: 356 elements
- **DOM elements after clicking Bank Soal tab**: 54,120 elements (+53,764 elements)
- **Time to open Bank Soal tab**: **5,886.2 ms (~5.89 seconds)**
- **Rendered question cards**: 1,006 `.zen-q-item` cards
- **Search latency (single keystroke input)**: **1,393.2 ms (~1.39 seconds)**

## 2. Bottleneck Decomposition

1. **DOM Tree Explosion**:
   - Each question card generates approximately 53.4 DOM nodes (`<article class="zen-q-item">`, header, checkboxes, metadata, 3 action buttons, prompt container, multiple option divs, letters, and text containers).
   - Multiplying 53.4 nodes by 1,006 questions results in 53,764 DOM nodes created synchronously in `#view.innerHTML`.

2. **Synchronous HTML Sanitization & Tree Walking (`richHTML`)**:
   - For every question card, `richHTML(q.prompt)` and `richHTML(o.text)` for 3–4 options were invoked.
   - Total `sanitizeRichHTML` invocations exceeded 4,000 passes per render.
   - Each invocation of `sanitizeRichHTML` creates a `<template>` element, parses innerHTML, creates a `<div>`, and recursively walks every node to sanitize tags and style attributes.
   - 4,000+ DOM template parsing cycles block the JavaScript main thread for over 4.5 seconds.

3. **Search Inefficiency (`richPlainText`)**:
   - In `renderBank()`, search filtering invoked `richPlainText()` on `q.prompt`, `q.instructions`, and all `o.text` entries for all 1,006 questions on every keystroke.
   - `richPlainText()` creates a `div`, runs `sanitizeRichHTML()`, queries `querySelectorAll('rt, rp')`, removes ruby annotations, and extracts text content.
   - Doing this 5 times per question = 5,030 DOM element operations per search keystroke.

4. **Browser Style Calculation & Layout**:
   - Inserting 54,120 nodes causes a massive forced synchronous layout recalculation and paint operation, causing severe browser UI freeze.

## 3. Recommended Optimization Strategy

1. **Collapsed-by-Default Architecture**:
   - Keep Question Package Directory immediately accessible.
   - Keep 1,006 individual questions in collapsed state initially. Opening tab takes < 20 ms.
2. **On-Demand Paginated Rendering**:
   - Render only 50 questions per page when expanded.
   - Max 50 `.zen-q-item` cards in the DOM (~2,500 DOM elements total, a 95% reduction).
3. **Fast Regex Search Index**:
   - Use plain-text `q.questionText || cleanText(q.prompt)` without DOM parsing. Search time drops from 1,393 ms to < 5 ms.
4. **Clean Detachment on Collapse**:
   - Remove elements from DOM completely upon collapse.
