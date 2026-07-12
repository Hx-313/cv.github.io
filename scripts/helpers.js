/*
 * helpers.js
 * Inline SVG icons + text formatting/escaping helpers
 */

const calendarIcon = `<svg class="cv-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v2h-5z"/></svg>`;
const mapPinIcon = `<svg class="cv-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`;
const phoneIcon = `<svg class="cv-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M6.62 10.79a15.15 15.15 0 0 0 6.59 6.59l2.2-2.2c.28-.28.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`;
const emailIcon = `<svg class="cv-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>`;
const linkIcon = `<svg class="cv-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;

function getProjectIcon(name) {
  name = name.toLowerCase();
  if (name.includes("masjid")) {
    return `<svg class="proj-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 2a8 8 0 0 1 8 8 8 8 0 0 1-8 8 8 8 0 0 1-8-8 8 8 0 0 1 8-8m1 4h-2v4H7v2h4v4h2v-4h4v-2h-4z"/></svg>`;
  } else if (name.includes("classifier") || name.includes("ai")) {
    return `<svg class="proj-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7m2 18h-4v1h4v-1zm-3-12a1 1 0 1 1-1-1 1 1 0 0 1 1 1z"/></svg>`;
  } else if (name.includes("game") || name.includes("hangaroo")) {
    return `<svg class="proj-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2m-10 7H8v3H6v-3H3v-2h3V8h2v3h3zm7 2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m2-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1"/></svg>`;
  } else if (name.includes("weather")) {
    return `<svg class="proj-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>`;
  }
  return `<svg class="proj-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg>`;
}

function renderDateLoc(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('|').map(s => s.trim());
  let res = `<span class="cv-meta-item">${calendarIcon}${bf(parts[0])}</span>`;
  if (parts[1]) {
    res += `<span class="cv-meta-item" style="margin-left: 14px;">${mapPinIcon}${bf(parts[1])}</span>`;
  }
  return res;
}

function renderGpaBox(gpaStr) {
  if (!gpaStr) return '';
  const idx = gpaStr.indexOf(':');
  let label = 'Result';
  let val = gpaStr;
  if (idx !== -1) {
    label = gpaStr.substring(0, idx).trim();
    val = gpaStr.substring(idx + 1).trim();
  } else {
    const spaceIdx = gpaStr.search(/\s\d/);
    if (spaceIdx !== -1) {
      label = gpaStr.substring(0, spaceIdx).trim();
      val = gpaStr.substring(spaceIdx).trim();
    }
  }
  return `<div class="cv-edu-gpa-label">${esc(label)}</div>` +
         `<div class="cv-edu-gpa-val">${bf(val)}</div>`;
}

function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function bf(s){
  if(!s) return '';
  return (s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
               .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
}
function nl2br(s){ return bf(s).replace(/\n/g,'<br>'); }
function linkHref(url){
  url = (url || '').trim();
  if(!url) return '';
  if(/^(https?:|mailto:|tel:)/i.test(url)) return url;
  if(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(url)) return 'mailto:' + url;
  if(/^\+?[\d\s().-]{7,}$/.test(url)) return 'tel:' + url.replace(/\s+/g, '');
  return 'https://' + url.replace(/^\/+/, '');
}
function contactAnchor(value, icon){
  if(!value) return '';
  return '<a class="ci-link" href="'+esc(linkHref(value))+'">'+icon+bf(value)+'</a>';
}
function tog(hd){
  hd.nextElementSibling.classList.toggle('open');
  hd.querySelector('.blk-arr').classList.toggle('open');
}
