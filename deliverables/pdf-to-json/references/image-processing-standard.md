# Image Processing Standard (Reverse-Engineered from `app.js` & Production Assets)

The website supports two distinct visual asset categories via `getQuestionMainMedia()` and `getOptionMedia()` in `app.js`. All image paths are resolved by `mediaURL()` relative to `./assets/questions/`.

---

## 1. Strict Prohibition on Full-Page Screenshots

- **NEVER** save or attach a full PDF page screenshot as `questionImage`.
- Full-page screenshots contain irrelevant page headers, footers, adjacent questions, and sometimes reveal the answer options inside the question diagram.
- Every image asset must be **tightly cropped** around its exact visual boundary with natural aspect ratio preserved (`imageRatio: "auto"`).

---

## 2. Category 1: Question Illustration / Diagram (`questionImage`)

Use Category 1 when the question prompt refers to a diagram, photo, warning chart, flowchart, or table.

### Cropping Rules
- Crop tightly around the diagram/illustration/table only.
- Do **not** cut off axis labels, arrows, units, or Japanese captions inside the diagram.
- Do **not** include the question number (`問32`), page number, or choices `A / B / C / D`.
- Reference example: `examples/example-assets/nguyen01-q032.png` (`190 × 160 px` tight illustration of a worker lifting a heavy kettle).

### JSON Mapping
```json
{
  "questionImage": "assets/questions/<pkg>-q032.png",
  "imageMediaId": "media-<pkg>-q032",
  "imageSize": "medium",
  "imageRatio": "auto",
  "imagePosition": "center",
  "media": [
    {
      "id": "media-<pkg>-q032",
      "name": "<pkg>-q032.png",
      "type": "image/png",
      "path": "assets/questions/<pkg>-q032.png"
    }
  ]
}
```

---

## 3. Category 2: Visual Answer Options (`optionImage` / Option `mediaId`)

Use Category 2 when the choices `A`, `B`, `C` (and `D` if present) are individual safety signs, tools, food items, or posture illustrations.

### Cropping & Anti-Duplication Rules
1. **Separate Files Per Option:** Crop each option (`A`, `B`, `C`, `D`) into its own separate PNG file:
   - `assets/questions/<pkg>-q039-option-a.png`
   - `assets/questions/<pkg>-q039-option-b.png`
   - `assets/questions/<pkg>-q039-option-c.png`
   - `assets/questions/<pkg>-q039-option-d.png` (when 4 options exist)
2. **NO Composite Question Image:** Leave `questionImage: ""` and `imageMediaId: ""` on the question object. **Never** put a combined image showing all options A–D into `questionImage` when individual option images exist.
3. **Strict Alignment:** Verify visually that Option A's file matches Option A's label, Option B's file matches Option B, Option C's file matches Option C, and Option D's file matches Option D.
4. Reference examples: `examples/example-assets/nguyen01-q039-option-a.png`, `-b.png`, `-c.png`.

### JSON Mapping
```json
{
  "questionImage": "",
  "imageMediaId": "",
  "options": [
    {
      "id": "A",
      "text": "[標識A] <ruby>手<rt>て</rt></ruby>で<ruby>触<rt>ふ</rt></ruby>れるな",
      "mediaId": "media-<pkg>-q039-option-a",
      "translation": "Rambu larangan menyentuh dengan tangan."
    }
  ],
  "media": [
    {
      "id": "media-<pkg>-q039-option-a",
      "name": "<pkg>-q039-option-a.png",
      "type": "image/png",
      "path": "assets/questions/<pkg>-q039-option-a.png"
    }
  ]
}
```

---

## 4. Path & Format Requirements

- **Directory:** `assets/questions/`
- **Format:** `.png` (non-empty, non-corrupt, crisp text/line art)
- **Path Rule:** `mediaURL()` in `app.js` looks for the substring `assets/questions/` in `media.path` and rewrites it to `./assets/questions/<filename>?v=crop2`. Always format paths strictly as `assets/questions/<filename>.png`.

---

## 5. Handling Unprocessable Images

If the source PDF diagram cannot be extracted or cropped cleanly in the current environment:
1. **Do NOT fabricate or draw fake placeholder images.**
2. Set `questionImage` / `mediaId` cleanly or leave a clear flag in `generation-audit-report.md`.
3. Record the exact `questionId`, PDF filename, PDF page number, bounding description, and mark the package status as **`NEEDS_IMAGE_PROCESSING`** until the physical PNG files are supplied.
