---
name: CV Editor
description: Precision two-tier design system for CV Editor — developer-grade application chrome paired with high-fidelity A4 document typography.
colors:
  brand: "#2563eb"
  brand-hover: "#1d4ed8"
  brand-subtle: "#eff4ff"
  brand-border: "#dbe6fe"
  navy: "#1e3a5f"
  ink: "#0f172a"
  ink-muted: "#334155"
  ink-subtle: "#64748b"
  surface: "#ffffff"
  surface-subtle: "#f8fafc"
  surface-sunken: "#eef2f7"
  workspace: "#e6eaf0"
  line: "#e2e8f0"
  line-strong: "#cbd5e1"
  success: "#16a34a"
  danger: "#dc2626"
  cv-accent: "#0b5ed7"
  cv-ink: "#111111"
  cv-muted: "#555555"
  cv-line: "#cccccc"
typography:
  ui-display:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  ui-body:
    fontFamily: "'Plus Jakarta Sans', 'Source Sans 3', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "normal"
  cv-heading:
    fontFamily: "'Source Sans 3', sans-serif"
    fontSize: "22pt"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "1.8px"
  cv-body:
    fontFamily: "'Source Sans 3', sans-serif"
    fontSize: "9.4pt"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
rounded:
  sm: "7px"
  md: "10px"
  lg: "14px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "30px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-brand:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  input-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "7px 10px"
---

# Design System

## Overview

CV Editor operates on a deliberate two-tier design system:
1. **Application Shell (The Studio)**: A tactile, high-efficiency editor chrome built with Plus Jakarta Sans, neutral slate backgrounds (`#0f172a`, `#e6eaf0`), and purposeful cobalt accents (`#2563eb`, `#1e3a5f`). It maximizes spatial density, clarity, and quick input responsiveness.
2. **Document Canvas (The Sheet)**: A strict A4 dimensional viewport (210mm x 297mm) rendered with Source Sans 3, calibrated print margins (15mm / 20mm), crisp typographic hierarchy, and ATS-clean semantic structures.

## Colors

The application relies on high-contrast semantic palettes split between app UI and document print output:
- **App Chrome Neutrals**:
  - `workspace` (`#e6eaf0`): Neutral desk backdrop providing contrast around the white A4 page.
  - `surface` (`#ffffff`): Card and panel backgrounds.
  - `surface-subtle` (`#f8fafc`) & `surface-sunken` (`#eef2f7`): Secondary hover states and subtle badge containers.
  - `ink` (`#0f172a`), `ink-muted` (`#334155`), `ink-subtle` (`#64748b`): Strict 3-level typographic clarity.
- **Accents**:
  - `brand` (`#2563eb`) & `navy` (`#1e3a5f`): Anchor action colors for primary tools, modal triggers, and focused elements.
  - `success` (`#16a34a`): Live preview status and active sync indicator.
  - `danger` (`#dc2626`): Destructive and warning alerts.
- **Document Palette (Print-safe)**:
  - `cv-accent` (`#0b5ed7`): Section header underlines, bullet emphasis, and clickable project links.
  - `cv-ink` (`#111111`): Primary copy rendering at sharp 9.4pt print contrast.
  - `cv-muted` (`#555555`): Company subtitles, dates, and secondary metadata.

## Typography

Typography establishes clear role division between the workspace and the output:
- **UI Chrome Font**: `Plus Jakarta Sans`, modern geometric sans with high legibility at micro sizes (11px–15px).
  - Used for toolbar branding, input field labels, button actions, and modal instructions.
  - Sentence case preferred; letter-spacing clamped between `-0.015em` and `0.02em`.
- **Document Font**: `Source Sans 3`, a workhorse humanist sans optimized for readability in dense multi-line print documents.
  - Candidate Name: 22pt bold uppercase with 1.8px tracking.
  - Section Headings: 11pt bold uppercase with primary accent underline.
  - Job/Education Titles: 10.5pt bold.
  - Body & Bullets: 9.4pt regular, line-height 1.45 for optimal readability and vertical economy.
  - Inline Hyperlinks: Styled with subtle underline and document accent, maintaining print legibility when exported to PDF.

## Elevation

Elevation is minimal and structural, avoiding fuzzy or artificial blur overlays:
- `sh-xs` (`0 1px 2px rgba(15,23,42,.06)`): Low-profile borders and sticky app toolbar separation.
- `sh-sm` (`0 1px 3px rgba(15,23,42,.08), 0 1px 2px rgba(15,23,42,.04)`): Button active press depth and subtle container depth.
- `sh-md` (`0 6px 18px rgba(15,23,42,.09)`): Floating tooltips, dropdowns, and status badges.
- `sh-lg` (`0 22px 60px rgba(15,23,42,.22)`): Centered modal dialogs (AI ATS Tailor).
- **The Sheet Elevation**: The A4 page uses `0 4px 30px rgba(0,0,0,.15)` to float distinctly over the workspace canvas in preview mode, disappearing completely in print media.

## Components

- **App Toolbar (`#toolbar`)**:
  - Sticky top header, height 55px.
  - Contains brand identity, formatting shortcuts (`Bold`, `Link`), AI ATS Tailor trigger, Sync status, Reset, and Print/Export PDF action.
- **Split-Pane Workspace (`#app`)**:
  - Left panel (`#form-panel`): 380px fixed width, scrollable, structured into clear collapsible/expandable fieldsets (`.fs`).
  - Right panel (`#preview-col`): Flexible fluid viewport centering the auto-scaled A4 page canvas with page count and zoom controls.
- **Form Inputs (`.fg`)**:
  - Input height 34px, subtle 1px border (`--line-2`), smooth transition on focus with 2px brand outline ring.
  - Auto-growing textareas for summaries and bullet lists with native keyboard shortcut listener.
- **A4 Document Page (`.cv-page`)**:
  - Exact dimension: 210mm × 297mm with strict pagination boundaries.
  - Running continuation header on Page 2+ (`.cv-running-header`).
  - Absolute bottom running footer (`.cv-page-footer`) containing candidate name and dynamic page budget counter ("Page X of Y").
- **ATS Tailor Modal (`.ai-modal`)**:
  - Clean centered modal with backdrop blur, structured multi-step flow (Job Description input → Processing spinner → Review & Diff → Apply).

## Do's and Don'ts

### Do's
- **DO** maintain 1:1 parity between on-screen preview and PDF print output at all times.
- **DO** support standard keyboard shortcuts (`Ctrl+B` for bold, `Ctrl+K` for hyperlinks, `Ctrl+S` for sync).
- **DO** parse inline hyperlinks using clean markdown syntax (`[Project Name](url)`) that renders clickable in preview and export.
- **DO** calculate page budgets at granular bullet and item levels rather than pushing entire sections to new pages.
- **DO** provide responsive tab switching on tablet and mobile viewports so editing and previewing remain usable on smaller screens.

### Don'ts
- **DON'T** apply wide decorative drop shadows or pastel cream backgrounds to the application chrome.
- **DON'T** let section headers separate from their first child items (enforce widow/orphan protection).
- **DON'T** allow long monolithic blocks to push onto new pages when only a single line overflows.
- **DON'T** store data solely in isolated volatile local state without a cross-device persistence mechanism.
