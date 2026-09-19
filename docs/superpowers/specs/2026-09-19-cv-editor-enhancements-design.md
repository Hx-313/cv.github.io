# Design Specification: CV Editor Enhancements

**Date**: 2026-09-19  
**Status**: Approved  
**Topic**: Inline Links, Shortcuts & Ergonomics, Remote Sync, and Granular 2-Page Budget Pagination  

---

## 1. Overview & Motivation

CV Editor (`cv.editor.io`) is an in-browser A4 resume builder designed for developers and technical professionals. While the core split-pane layout and Anthropic Claude AI tailoring modal provide strong baseline capabilities, everyday use exposed four critical friction points:

1. **No Inline Hyperlinks**: Users could not link portfolio projects (e.g. *Dietify*, GitHub repositories, live websites) directly inside work experience descriptions or bullet points.
2. **Cumbersome Formatting & Rigidity**: Formatting required manual mouse highlighting and toolbar button clicks; no standard keyboard shortcuts (`Ctrl+B`, `Ctrl+K`, `Ctrl+S`) existed, and smaller laptop/tablet viewports experienced cramped split panes.
3. **No Cross-Device Persistence**: Data resided solely in a single browser's `window.localStorage`. Switching computers (e.g. home desktop to work laptop) loaded stale versions.
4. **Coarse Monolithic Pagination Bug**: When even a single line of an experience entry overflowed Page 1, the pagination engine dumped the *entire* job (title, company, and all bullets) onto Page 2. This caused massive empty white space on Page 1 and spawned an unwanted Page 3.
5. **Rigid Description Format**: Experience entries forced rigid bullets with no easy option to use cohesive narrative paragraphs where appropriate.

This specification defines the architectural and UI enhancements to solve these issues cleanly without breaking print fidelity.

---

## 2. Goals and Non-Goals

### Goals
- **Inline Hyperlink Support**: Enable markdown-style links `[Text](url)` inside descriptions, bullets, and summaries that compile to clickable anchors in preview and exported PDFs.
- **Keyboard-First Hotkeys**: Implement `Ctrl+B` (bold), `Ctrl+K` (insert/edit link), `Ctrl+S` (cloud save) across all editor inputs.
- **Description Flexibility**: Provide a per-entry format toggle (`[• Bullets]` vs. `[¶ Paragraph]`) for jobs and projects.
- **Zero-Setup Remote Cloud Sync**: Allow users to bind a personal Sync Key (e.g. `ali-313`) to persist and retrieve resume state across multiple PCs with automatic debounced background saves and offline caching.
- **Granular Bullet-Level Pagination**: Break experience entries at the individual bullet level across page boundaries to eliminate dead whitespace.
- **2-Page Fit Budget & Density Controls**: Provide density presets (`Compact`, `Normal`, `Relaxed`) and a live page-budget gauge so users can reliably target an exact 2-page fit.
- **Responsive Workspace**: Enable full-width tab switching (`[Split] | [Edit] | [Preview]`) for tablet and laptop screens.

### Non-Goals
- Full WYSIWYG `contentEditable` editors (which introduce document structure corruption, cursor jumping, and break A4 height measurement).
- Mandatory user accounts, passwords, or complex OAuth walls (cloud sync uses lightweight sync keys for zero-friction portability).
- Arbitrary non-A4 page sizes (the system is calibrated for precision A4 portrait print).

---

## 3. Detailed Component Architecture

### 3.1. Inline Hyperlinks & Markdown Text Formatting
- **Syntax**: 
  - Bold: `**keyword**`
  - Hyperlink: `[Link Title](https://example.com)`
- **Compilation Engine (`scripts/helpers.js`)**:
  - Update `bf(text)`:
    ```javascript
    function bf(s) {
      if (!s) return '';
      return (s + '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a class="cv-inline-link" href="$2" target="_blank" rel="noopener">$1</a>');
    }
    ```
- **Visual Styling (`styles/resume.css`)**:
  - `.cv-inline-link`: Printable cobalt (`#0b5ed7`), subtle underline (`text-decoration: underline 1px solid rgba(11, 94, 215, 0.45)`), color contrast ≥ 4.5:1, mouse hover feedback in web preview, clean vector link in PDF export.

### 3.2. Editor Ergonomics & Keyboard Shortcuts
- **Keyboard Handler (`scripts/editor.js`)**:
  - Global `keydown` listener active on all form inputs and textareas:
    - **`Ctrl+B` / `Cmd+B`**: Wraps selection in `**...**` or removes `**` if already wrapped. Preserves cursor selection range.
    - **`Ctrl+K` / `Cmd+K`**: Opens a clean floating prompt or dialog at the cursor position:
      - Defaults to selected text as title.
      - User inputs/pastes URL.
      - Inserts `[selected text](url)` and updates live preview immediately.
    - **`Ctrl+S` / `Cmd+S`**: Intercepts browser save, triggers instant local save + remote cloud push.
- **Auto-Expanding Textareas**:
  - All textareas automatically adjust `style.height` based on `scrollHeight` to prevent internal scrolling.
- **Responsive Split Workspace (`styles/app.css`, `scripts/app.js`)**:
  - On viewports < 1100px or by user preference, a mode switcher in the toolbar offers:
    - `Split` (side-by-side)
    - `Editor Only` (focus mode)
    - `Preview Only` (full-sheet inspection)

### 3.3. Description Modes: Paragraph vs. Bullets
- **Model Definition (`scripts/data.js`)**:
  ```javascript
  {
    title: "Flutter & System Developer",
    company: "Webticians",
    format: "bullets", // "bullets" | "paragraph" | "both"
    desc: "Engineered a multi-platform 5-in-1 restaurant ecosystem...",
    bullets: [
      "Architected Web Ordering System (WOS) with [Dietify](https://dietify.app)...",
      "Digitized ordering pipelines using **Riverpod** and Clean Architecture..."
    ]
  }
  ```
- **UI Form Controls**:
  - Each job/project card includes a clean segmented pill toggle: `[ • Bullets ]` · `[ ¶ Paragraph ]`.
  - Switching toggles updates `j.format` and dynamically shows either the bullet row manager or the narrative textarea without losing data from the other format.
- **Render Output (`scripts/render.js`)**:
  - If `format === 'paragraph'`, renders `<div class="cv-jcd">${bf(j.desc)}</div>`.
  - If `format === 'bullets'`, renders `<ul>...<li>${bf(bullet)}</li>...</ul>`.
  - If `both`, renders the paragraph overview followed by the bullet items.

### 3.4. Remote Cloud Persistence (`scripts/sync.js`)
- **Backend Protocol (Option A)**:
  - Client-side REST integration using a lightweight, key-value store (e.g. KVdb / JSONBin) with public/shared read-write keyed by the user's secret Sync Key.
  - Endpoints:
    - `GET /keys/{syncKey}`: Retrieves latest stored CV JSON.
    - `PUT /keys/{syncKey}`: Persists updated CV JSON.
- **Persistence Strategy**:
  - **Local-first**: Any keystroke updates `localStorage` at 0ms latency.
  - **Debounced Cloud Push**: Keystrokes start a 1500ms debounce timer. Once idle, payload is pushed to cloud store. `Ctrl+S` pushes immediately.
  - **Toolbar Cloud Widget**:
    - States:
      - `☁️ Local Only` (no Sync Key bound; clicking prompts for key)
      - `☁️ Saving...` (pulsing indicator)
      - `☁️ Synced · 4:21 PM` (green status)
      - `⚠️ Offline` (network failure, local cache preserved)
  - **Modal / Drawer Dialog**:
    - Manage personal Sync Key (generate new or enter existing).
    - Manual "Sync Now" button.
    - 1-click "Export JSON" and "Import JSON" for hard offline file backup.

### 3.5. Granular Pagination & 2-Page Budget Controller
- **Deconstructed Block Model (`scripts/render.js`)**:
  - Replace monolithic job blocks with decomposed sub-blocks:
    1. `job-header`: Title, Company, Meta, Date, and Paragraph Description (if enabled).
    2. `job-bullet`: Each individual bullet point is an independent block.
- **Pagination Algorithm Flow**:
  1. Calculate usable page heights: `maxContentHeightPx` (Page 1) and `maxContentHeightRestPx` (Page 2+ with running header).
  2. When Page 1 reaches capacity:
     - If a job's header and first 1–2 bullets fit on Page 1, they remain on Page 1.
     - Remaining bullets overflow cleanly to Page 2 under continuation.
  3. **Widow/Orphan Safeguards**:
     - Never strand a `section-title` alone at the bottom of a page.
     - Never strand a `job-header` alone at the bottom of a page without at least its first bullet or paragraph. If the first bullet doesn't fit, move the `job-header` together with it.
- **Density Controller**:
  - Added to `#pv-bar`:
    - `Density`: `[ Compact ]` | `[ Normal ]` | `[ Relaxed ]`
    - In CSS:
      - `body[data-density="compact"]`: `--cv-line-height: 1.38; --cv-item-gap: 7px; --cv-sec-gap: 8px;`
      - `body[data-density="normal"]`: `--cv-line-height: 1.45; --cv-item-gap: 10px; --cv-sec-gap: 12px;`
      - `body[data-density="relaxed"]`: `--cv-line-height: 1.50; --cv-item-gap: 12px; --cv-sec-gap: 15px;`
- **Page Budget Indicator**:
  - Displays dynamic status:
    - When 2 pages: `✓ Exactly 2 Pages (100% Fit)`
    - When 3 pages with small overflow: `⚠️ 3 Pages — 2 lines overflow on Page 3 (Switch to Compact)`

---

## 4. Error Handling & Edge Cases

1. **Network Disconnection During Sync**:
   - Pushes fail silently to user flow without interrupting typing.
   - Status badge turns to `⚠️ Offline (Saved locally)`. Next successful connection syncs the latest local state.
2. **Malformed URLs in Hyperlinks**:
   - `bf()` regex strictly verifies protocols `(https?://...)` or automatically prefixes `https://` if omitted.
   - Escapes quotes and special characters to prevent XSS.
3. **Extreme Content Volume (4+ Pages)**:
   - Density controller displays informative text rather than trying to compress 5 pages into 2. The user is notified how many pages are used.
4. **First-Time Users on a New Device**:
   - Entering an invalid or non-existent Sync Key prompts: *"No resume found for key [key]. Start fresh with this key?"* preventing accidental overwrites.

---

## 5. Verification & Testing Plan

1. **Hyperlink Rendering & PDF Export**:
   - Add `[Dietify](https://example.com)` into job bullet.
   - Verify link renders with cobalt underline in live preview.
   - Test clicking link opens new tab.
   - Test `window.print()` / PDF export retains clickable link annotations in Acrobat/Chrome.
2. **Keyboard Shortcuts**:
   - Highlight word, press `Ctrl+B`: verify `**word**` toggles correctly.
   - Highlight word, press `Ctrl+K`: verify prompt opens and formats `[word](url)`.
   - Press `Ctrl+S`: verify immediate local + remote save triggers.
3. **Description Mode Toggle**:
   - Switch job from Bullets to Paragraph: verify UI renders paragraph textarea, preview renders narrative paragraph.
   - Switch back to Bullets: verify bullet points remain intact.
4. **Pagination & 2-Page Fit**:
   - Input long content that previously pushed 150px of blank space to Page 1.
   - Verify job header + first bullets stay on Page 1 while remaining bullets transition smoothly to Page 2.
   - Toggle Density to `Compact`: verify overflow lines pull back onto Page 2.
5. **Cross-Device Remote Sync**:
   - Set Sync Key `test-ali-123` on Browser A, make an edit.
   - Open Browser B (or Incognito window), enter `test-ali-123`: verify latest edit loads automatically.
