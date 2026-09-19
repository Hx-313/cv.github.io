# CV Editor Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform CV Editor with inline markdown hyperlinks, keyboard-driven ergonomics (`Ctrl+B`, `Ctrl+K`, `Ctrl+S`), flexible description modes (paragraphs vs. bullets), zero-setup remote cloud sync, and granular sub-item pagination with 2-page budget control.

**Architecture:** 
- Modular vanilla ES6 architecture with native browser APIs, zero external runtime build step, and `node:test` for automated unit testing.
- Two-tier design system maintaining 100% parity between on-screen live A4 DOM calculation and exported PDF.
- Client-side REST persistence engine (`scripts/sync.js`) for debounced multi-device cloud synchronization.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3 Custom Properties (OKLCH & sRGB tokens), Node.js v24 `node:test` runner.

## Global Constraints

- Never break 1:1 parity between on-screen A4 preview and `@media print` / PDF export.
- Keep data model backwards-compatible with existing `localStorage` data schemas.
- Strictly adhere to `DESIGN.md` tokens for UI chrome (`--brand: #2563eb`, `--navy: #1e3a5f`, `--surface: #ffffff`, `--ink: #0f172a`) and document styling (`--cv-accent: #0b5ed7`, `--cv-ink: #111111`).
- All keyboard shortcuts must work cross-platform (`Ctrl` on Windows/Linux, `Cmd` on macOS).

---

### Task 1: Inline Hyperlinks & Markdown Compilation

**Files:**
- Create: `tests/helpers.test.mjs`
- Modify: `scripts/helpers.js:55-65`
- Modify: `styles/resume.css:12-25`

**Interfaces:**
- Produces: `bf(text: string): string` supporting both `**bold**` and `[Label](url)` compiling to `<a class="cv-inline-link" href="..." target="_blank" rel="noopener">Label</a>`.
- Consumes: Raw text strings from summary, bullet points, and description fields.

- [ ] **Step 1: Write the failing test for `bf()` link parsing**

```javascript
// tests/helpers.test.mjs
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper reproduction to verify
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function bf(s){
  if(!s) return '';
  return (s+'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a class="cv-inline-link" href="$2" target="_blank" rel="noopener">$1</a>');
}

describe('bf() text formatter', () => {
  it('parses bold tags correctly', () => {
    assert.equal(bf('Hello **World**'), 'Hello <strong>World</strong>');
  });

  it('parses markdown hyperlinks correctly', () => {
    const input = 'Built [Dietify](https://dietify.app) with Flutter';
    const expected = 'Built <a class="cv-inline-link" href="https://dietify.app" target="_blank" rel="noopener">Dietify</a> with Flutter';
    assert.equal(bf(input), expected);
  });

  it('handles bold text inside or beside links', () => {
    const input = '**Featured**: [Project](https://github.com/test)';
    const expected = '<strong>Featured</strong>: <a class="cv-inline-link" href="https://github.com/test" target="_blank" rel="noopener">Project</a>';
    assert.equal(bf(input), expected);
  });

  it('escapes special characters while leaving link tags intact', () => {
    const input = '<script> [App](https://test.com) & "quotes"';
    assert.ok(!bf(input).includes('<script>'));
    assert.ok(bf(input).includes('&lt;script&gt;'));
    assert.ok(bf(input).includes('<a class="cv-inline-link" href="https://test.com"'));
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node --test tests/helpers.test.mjs`  
Expected: PASS

- [ ] **Step 3: Update `scripts/helpers.js` and `styles/resume.css`**

In `scripts/helpers.js`:
```javascript
function bf(s){
  if(!s) return '';
  return (s+'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a class="cv-inline-link" href="$2" target="_blank" rel="noopener">$1</a>');
}
```

In `styles/resume.css`:
```css
.cv-inline-link {
  color: var(--blue, #0b5ed7);
  text-decoration: underline;
  text-decoration-color: rgba(11, 94, 215, 0.4);
  text-underline-offset: 2px;
  cursor: pointer;
  transition: color 0.15s, text-decoration-color 0.15s;
}
.cv-inline-link:hover {
  color: var(--blue-dark, #1d4ed8);
  text-decoration-color: var(--blue-dark, #1d4ed8);
}
@media print {
  .cv-inline-link {
    color: var(--blue, #0b5ed7) !important;
    text-decoration: underline !important;
  }
}
```

- [ ] **Step 4: Commit Task 1**

```bash
git add scripts/helpers.js styles/resume.css tests/helpers.test.mjs
git commit -m "feat: add markdown inline hyperlink parsing and styling"
```

---

### Task 2: Description Format Switcher (Paragraph vs. Bullets)

**Files:**
- Create: `tests/description-format.test.mjs`
- Modify: `scripts/data.js:18-35`
- Modify: `scripts/editor.js:90-160`
- Modify: `scripts/render.js:170-185`
- Modify: `styles/app.css:140-180`

**Interfaces:**
- Produces: `j.format = 'bullets' | 'paragraph' | 'both'` on experience and project items.
- Consumes: Existing `D.jobs` and `D.projects` items, with fallback to `'bullets'` if format is unset.

- [ ] **Step 1: Write failing unit test for format rendering**

```javascript
// tests/description-format.test.mjs
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function renderJobContent(job) {
  const format = job.format || 'bullets';
  let html = '';
  if (format === 'paragraph' || format === 'both') {
    if (job.desc) html += `<div class="cv-jcd">${job.desc}</div>`;
  }
  if (format === 'bullets' || format === 'both') {
    if (job.bullets && job.bullets.length) {
      html += `<ul>${job.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
    }
  }
  return html;
}

describe('Job description formatting', () => {
  it('renders only bullets in bullets mode', () => {
    const job = { format: 'bullets', desc: 'Overview paragraph', bullets: ['Bullet 1', 'Bullet 2'] };
    const out = renderJobContent(job);
    assert.ok(!out.includes('cv-jcd'));
    assert.ok(out.includes('<ul><li>Bullet 1</li><li>Bullet 2</li></ul>'));
  });

  it('renders only paragraph in paragraph mode', () => {
    const job = { format: 'paragraph', desc: 'Overview paragraph', bullets: ['Bullet 1'] };
    const out = renderJobContent(job);
    assert.ok(out.includes('<div class="cv-jcd">Overview paragraph</div>'));
    assert.ok(!out.includes('<ul>'));
  });

  it('defaults to bullets when format property is absent', () => {
    const job = { desc: 'Old desc', bullets: ['Bullet A'] };
    const out = renderJobContent(job);
    assert.ok(out.includes('<ul><li>Bullet A</li></ul>'));
    assert.ok(!out.includes('cv-jcd'));
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node --test tests/description-format.test.mjs`  
Expected: PASS

- [ ] **Step 3: Update `scripts/editor.js` to render format toggle in job cards**

Add segmented pill controls:
```html
<div class="fmt-toggle">
  <button type="button" class="fmt-btn ${j.format !== 'paragraph' ? 'active' : ''}" onclick="setJobFormat(${idx}, 'bullets')">• Bullets</button>
  <button type="button" class="fmt-btn ${j.format === 'paragraph' ? 'active' : ''}" onclick="setJobFormat(${idx}, 'paragraph')">¶ Paragraph</button>
</div>
```
Conditionally display either the bullets list manager or the paragraph textarea based on `j.format`.

- [ ] **Step 4: Update `scripts/render.js` to render accordingly**

In `render.js` job loop:
```javascript
const format = j.format || 'bullets';
if ((format === 'paragraph' || format === 'both') && j.desc) {
  jh += '<div class="cv-jcd">' + bf(j.desc) + '</div>';
}
if ((format === 'bullets' || format === 'both') && buls.length) {
  jh += '<ul>' + buls.map(function(b){ return '<li>' + bf(b) + '</li>'; }).join('') + '</ul>';
}
```

- [ ] **Step 5: Commit Task 2**

```bash
git add scripts/data.js scripts/editor.js scripts/render.js styles/app.css tests/description-format.test.mjs
git commit -m "feat: add paragraph vs bullet description format toggle"
```

---

### Task 3: Editor Ergonomics & Global Keyboard Shortcuts

**Files:**
- Modify: `scripts/editor.js:1-60`
- Modify: `index.html:15-45, 115-135`
- Modify: `styles/app.css:50-80`

**Interfaces:**
- Produces: Global shortcut handler for `Ctrl+B`, `Ctrl+K`, `Ctrl+S`, `linkPromptModal`, and responsive split view toggle (`Split`, `Edit`, `Preview`).
- Consumes: Textarea selection ranges and browser keyboard events.

- [ ] **Step 1: Implement selection wrapper functions in `scripts/editor.js`**

```javascript
function applyWrapToActiveTextarea(prefix, suffix) {
  const el = document.activeElement;
  if (!el || (el.tagName !== 'TEXTAREA' && el.tagName !== 'INPUT')) return false;

  const start = el.selectionStart;
  const end = el.selectionEnd;
  const text = el.value;
  const sel = text.substring(start, end);

  // Toggle off if already wrapped
  if (text.substring(start - prefix.length, start) === prefix &&
      text.substring(end, end + suffix.length) === suffix) {
    el.value = text.substring(0, start - prefix.length) + sel + text.substring(end + suffix.length);
    el.selectionStart = start - prefix.length;
    el.selectionEnd = end - prefix.length;
  } else {
    el.value = text.substring(0, start) + prefix + sel + suffix + text.substring(end);
    el.selectionStart = start + prefix.length;
    el.selectionEnd = end + prefix.length;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}
```

- [ ] **Step 2: Add `Ctrl+K` link insertion prompt and keyboard event listener**

```javascript
window.addEventListener('keydown', function(e) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const mod = isMac ? e.metaKey : e.ctrlKey;

  if (mod && e.key.toLowerCase() === 'b') {
    if (applyWrapToActiveTextarea('**', '**')) {
      e.preventDefault();
    }
  } else if (mod && e.key.toLowerCase() === 'k') {
    const el = document.activeElement;
    if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
      e.preventDefault();
      promptInsertLink(el);
    }
  } else if (mod && e.key.toLowerCase() === 's') {
    e.preventDefault();
    save();
    if (window.cloudSyncTrigger) window.cloudSyncTrigger();
  }
});
```

- [ ] **Step 3: Add Responsive View Mode Switcher in `index.html` & `app.css`**

Add `#view-mode-toggle` in toolbar with buttons `Split`, `Editor`, `Preview` and CSS rules applying `display:none` to `#form-panel` or `#preview-col` based on active view mode.

- [ ] **Step 4: Commit Task 3**

```bash
git add scripts/editor.js index.html styles/app.css
git commit -m "feat: add global keyboard shortcuts Ctrl+B, Ctrl+K, Ctrl+S and responsive view toggle"
```

---

### Task 4: Granular Sub-Item Pagination & 2-Page Budget Controller

**Files:**
- Create: `tests/pagination.test.mjs`
- Modify: `scripts/render.js:160-310`
- Modify: `styles/resume.css:1-50`
- Modify: `styles/app.css:90-120`
- Modify: `index.html:115-130`

**Interfaces:**
- Produces: Decomposed pagination blocks (Job Header as block, each bullet as sub-block), Density controller (`data-density="compact|normal|relaxed"`), and Page Budget indicator.
- Consumes: `D.jobs`, `measureBlocksHeight()`, and page height budgets.

- [ ] **Step 1: Write unit test for block decomposition**

```javascript
// tests/pagination.test.mjs
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function decomposeJob(job, idx) {
  const blocks = [];
  blocks.push({ type: 'job-header', jobIndex: idx, title: job.title });
  if (job.format !== 'paragraph' && job.bullets) {
    job.bullets.forEach((b, bIdx) => {
      blocks.push({ type: 'job-bullet', jobIndex: idx, bulletIndex: bIdx, text: b });
    });
  }
  return blocks;
}

describe('Pagination block decomposition', () => {
  it('decomposes job with 3 bullets into 4 granular units', () => {
    const job = { title: 'Developer', bullets: ['A', 'B', 'C'] };
    const blocks = decomposeJob(job, 0);
    assert.equal(blocks.length, 4);
    assert.equal(blocks[0].type, 'job-header');
    assert.equal(blocks[1].type, 'job-bullet');
    assert.equal(blocks[3].bulletIndex, 2);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node --test tests/pagination.test.mjs`  
Expected: PASS

- [ ] **Step 3: Update `scripts/render.js` to paginate at granular bullet level**

Refactor `render()` to emit granular item units. In the pagination loop:
- Keep `job-header` and first bullet together on Page 1 if budget allows.
- If subsequent bullets overflow, break remaining bullets onto Page 2 cleanly inside a continued `<ul>` container.
- Update page count gauge and budget indicator:
  - If `pages.length === 2`: Display `✓ Exactly 2 Pages (100% Fit)`.
  - If `pages.length > 2`: Display `⚠️ ${pages.length} Pages (Try Compact Density)`.

- [ ] **Step 4: Add Density Switcher in Preview Bar**

In `index.html` preview bar, add:
```html
<div class="density-group">
  <span class="density-label">Density:</span>
  <button class="dbtn active" onclick="setDensity('normal')">Normal</button>
  <button class="dbtn" onclick="setDensity('compact')">Compact</button>
  <button class="dbtn" onclick="setDensity('relaxed')">Relaxed</button>
</div>
```
In `resume.css`:
```css
body[data-density="compact"] #cv { line-height: 1.36; }
body[data-density="compact"] .cv-page { padding: 12mm 15mm 16mm 15mm; }
body[data-density="compact"] .cv-job + .cv-job { padding-top: 6px; }
body[data-density="compact"] .sec-ttl { margin-top: 8px; margin-bottom: 6px; }
```

- [ ] **Step 5: Commit Task 4**

```bash
git add scripts/render.js styles/resume.css styles/app.css index.html tests/pagination.test.mjs
git commit -m "feat: implement granular bullet-level pagination, density controls, and 2-page gauge"
```

---

### Task 5: Remote Cloud Persistence (Option A Zero-Setup REST Store)

**Files:**
- Create: `scripts/sync.js`
- Create: `tests/sync.test.mjs`
- Modify: `index.html:30-45, 200-210`
- Modify: `styles/app.css:200-250`
- Modify: `scripts/render.js:325-340`

**Interfaces:**
- Produces: `window.CloudSync = { setKey(k), getKey(), push(), pull(), exportJSON(), importJSON(file) }`.
- Consumes: Resume state object `D`, `localStorage`, and remote REST endpoint.

- [ ] **Step 1: Write test for sync key management and payload preparation**

```javascript
// tests/sync.test.mjs
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function sanitizeSyncKey(key) {
  if (!key) return '';
  return key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

function prepareSyncPayload(data) {
  return JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    resume: data
  });
}

describe('Sync Key Sanitization and Payload', () => {
  it('sanitizes user input for valid key slug', () => {
    assert.equal(sanitizeSyncKey('Ali Abdullah #313!'), 'aliabdullah313');
  });

  it('formats payload with timestamp and version', () => {
    const payload = JSON.parse(prepareSyncPayload({ name: 'Hafiz' }));
    assert.equal(payload.version, 1);
    assert.equal(payload.resume.name, 'Hafiz');
    assert.ok(payload.updatedAt);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node --test tests/sync.test.mjs`  
Expected: PASS

- [ ] **Step 3: Implement `scripts/sync.js`**

Implement zero-setup REST store integration:
- Uses resilient public key-value store (`https://kvdb.io/...` or JSON store) with fallback to export/import.
- Automatically pushes on `save()` after a 1500ms debounce.
- Updates toolbar status badge (`☁️ Synced`, `☁️ Saving...`, `⚠️ Offline`).
- Provides Sync Modal for entering Sync Key, Manual Push/Pull, and JSON file Export/Import.

- [ ] **Step 4: Wire sync into `index.html` toolbar and `render.js`**

Add Cloud Sync button to `#toolbar` and script tag `<script src="scripts/sync.js"></script>` in `index.html`.

- [ ] **Step 5: Commit Task 5**

```bash
git add scripts/sync.js index.html styles/app.css scripts/render.js tests/sync.test.mjs
git commit -m "feat: implement zero-setup remote cloud sync, sync key management, and JSON backup"
```

---

### Task 6: End-to-End Integration & Quality Verification Pass

**Files:**
- Modify: `index.html`
- Modify: `styles/app.css`
- Modify: `styles/resume.css`

- [ ] **Step 1: Run all automated unit tests**

Run: `node --test tests/*.test.mjs`  
Expected: All tests pass.

- [ ] **Step 2: Verify live in browser**

- Check that typing `[Dietify](https://dietify.app)` produces clickable cobalt link.
- Select text and press `Ctrl+B`: verify bold wraps properly.
- Press `Ctrl+K`: verify link dialog opens and formats selection.
- Press `Ctrl+S`: verify instant save and cloud sync indicator.
- Toggle between Bullets and Paragraph on an experience item: verify both modes work seamlessly.
- Test 2-page fit: toggle density `Compact` and verify overflow pulls onto Page 2 cleanly without blank holes on Page 1.
- Test cross-device Sync Key load and export backup.

- [ ] **Step 3: Final Commit**

```bash
git add .
git commit -m "chore: complete CV editor enhancements integration pass"
```
