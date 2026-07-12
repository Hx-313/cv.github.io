/*
 * render.js
 * A4 pagination engine, height measurement, scaling, and live render + autosave
 */

let maxContentHeightPx = 0;      // usable content height on page 1 (full header)
let maxContentHeightRestPx = 0;  // usable content height on pages 2+ (running header reserved)

// Off-screen measuring node kept INSIDE #cv so all `#cv .foo` scoped styles
// (grids, flex skills, font sizes, etc.) apply during measurement. Measuring in
// a detached/unscoped sandbox inflates heights and breaks pages far too early.
function getMeasureNode() {
  const cv = document.getElementById('cv');
  let m = document.getElementById('cv-measure');
  if (!m) {
    m = document.createElement('div');
    m.id = 'cv-measure';
    m.style.cssText =
      'position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;' +
      'width:210mm;padding:15mm 15mm 20mm 15mm;box-sizing:border-box;' +
      'height:auto;overflow:visible;';
  }
  if (m.parentNode !== cv) cv.appendChild(m); // re-attach if a prior render wiped it
  return m;
}

function measureElementHeight(html) {
  // Outer height (incl. vertical margins) of a single element — used to reserve
  // room for the running header on continuation pages.
  const m = getMeasureNode();
  m.innerHTML = html;
  const el = m.firstElementChild;
  let h = 0;
  if (el) {
    const cs = getComputedStyle(el);
    h = el.getBoundingClientRect().height +
        (parseFloat(cs.marginTop) || 0) +
        (parseFloat(cs.marginBottom) || 0);
  }
  m.innerHTML = '';
  return h;
}

function updateMaxContentHeight() {
  // measureBlocksHeight() returns the sandbox BORDER-BOX height, i.e. it already
  // includes the 15mm top + 20mm bottom page padding. So the budget we compare it
  // against must also be a full page-box height, not a content-only figure.
  // A page is 297mm tall; the footer lives inside the 20mm bottom padding, so we
  // let content+padding fill almost the whole sheet and keep a small safety gap.
  const PAGE_BUDGET_MM = 291; // 297mm page − ~6mm safety margin
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.left = '-9999px';
  probe.style.top = '-9999px';
  probe.style.height = PAGE_BUDGET_MM + 'mm';
  document.body.appendChild(probe);
  maxContentHeightPx = probe.getBoundingClientRect().height;
  document.body.removeChild(probe);
}

function assembleBlocksHtml(blocksArray) {
  let html = '';
  let currentSection = null;
  let sectionBlocks = [];

  function flushSection() {
    if (sectionBlocks.length === 0) return;
    if (currentSection === 'header') {
      html += sectionBlocks.map(b => b.html).join('');
    } else {
      html += '<div class="sec">' + sectionBlocks.map(b => b.html).join('') + '</div>';
    }
    sectionBlocks = [];
  }

  blocksArray.forEach(block => {
    const secName = block.section || 'header';
    if (secName !== currentSection) {
      flushSection();
      currentSection = secName;
    }
    sectionBlocks.push(block);
  });
  flushSection();

  return html;
}

function measureBlocksHeight(blocksArray) {
  const m = getMeasureNode();
  m.innerHTML = assembleBlocksHtml(blocksArray);
  const h = m.getBoundingClientRect().height; // border-box incl. 15mm/20mm padding
  m.innerHTML = '';
  return h;
}

function adjustScale() {
  const panel = document.getElementById('preview-panel');
  const wrapper = document.getElementById('cv-scale-wrapper');
  const outer = document.getElementById('cv-scale-outer');
  if (!panel || !wrapper || !outer) return;

  const containerWidth = panel.clientWidth - 56; // padding
  const pageWidthPx = 794; // ~210mm at 96dpi

  if (containerWidth < pageWidthPx) {
    const scale = containerWidth / pageWidthPx;
    wrapper.style.transform = 'scale(' + scale + ')';
    wrapper.style.transformOrigin = 'top center';
    // Set outer height so scroll works properly
    outer.style.height = (wrapper.scrollHeight * scale) + 'px';
    outer.style.width = containerWidth + 'px';
  } else {
    wrapper.style.transform = 'none';
    outer.style.height = 'auto';
    outer.style.width = '210mm';
  }
}

window.addEventListener('resize', adjustScale);

function render(){
  const name    = document.getElementById('f-name').value;
  const title   = document.getElementById('f-title').value;
  const phone   = document.getElementById('f-phone').value;
  const email   = document.getElementById('f-email').value;
  const loc     = document.getElementById('f-location').value;
  const summary = document.getElementById('f-summary').value;
  const skills  = document.getElementById('f-skills').value.split('\n').map(function(s){return s.trim();}).filter(Boolean);

  updateMaxContentHeight();

  /* ── Running header for continuation pages (page 2+) ── */
  const runningHeaderHtml =
    '<div class="cv-running-header">' +
      '<span class="crh-name">' + bf(name) + '</span>' +
      (title ? '<span class="crh-role">' + bf(title) + '</span>' : '') +
    '</div>';
  // Reserve the running-header's footprint on continuation pages so content
  // never collides with it.
  maxContentHeightRestPx = maxContentHeightPx - measureElementHeight(runningHeaderHtml);

  /* ── Build logical blocks ── */
  const blocks = [];

  // HEADER
  var validLinks = D.links.filter(function(lk){ return lk.label && lk.url; });
  let hh = '<div class="cv-hd">';
  hh += '<div class="cv-name">'+bf(name)+'</div>';
  hh += '<div class="cv-role">'+bf(title)+'</div>';
  hh += '<div class="cv-contacts">';
  if(phone) hh += contactAnchor(phone, phoneIcon);
  if(email) hh += contactAnchor(email, emailIcon);
  validLinks.forEach(function(lk){
    hh += '<a class="ci-link" href="'+esc(linkHref(lk.url))+'" target="_blank" rel="noopener">'+linkIcon+esc(lk.label)+'</a>';
  });
  if(loc) hh += '<span class="ci">'+mapPinIcon+bf(loc)+'</span>';
  hh += '</div></div>';
  blocks.push({ type:'header', section:'header', html:hh });

  // SUMMARY
  if(summary){
    blocks.push({ type:'summary', section:'summary',
      html:'<div class="sec-ttl">Summary</div><div class="cv-sum">'+bf(summary)+'</div>'
    });
  }

  // EXPERIENCE
  if(D.jobs.length){
    blocks.push({ type:'section-title', section:'jobs', html:'<div class="sec-ttl">Experience</div>' });
    D.jobs.forEach(function(j, idx){
      var buls = j.bullets.filter(function(b){ return (b||'').trim(); });
      let jh = '<div class="cv-job">';
      jh += '<div class="cv-jt">'+bf(j.title)+'</div>';
      jh += '<div class="cv-jc">'+bf(j.company)+'</div>';
      jh += '<div class="cv-jmeta">' + renderDateLoc(j.date) + '</div>';
      if(j.desc) jh += '<div class="cv-jcd">'+bf(j.desc)+'</div>';
      if(buls.length){ jh += '<ul>'+buls.map(function(b){ return '<li>'+bf(b)+'</li>'; }).join('')+'</ul>'; }
      jh += '</div>';
      blocks.push({ type:'item', section:'jobs', itemIndex:idx, html:jh });
    });
  }

  // EDUCATION
  if(D.edu.length){
    blocks.push({ type:'section-title', section:'edu', html:'<div class="sec-ttl">Education</div>' });
    D.edu.forEach(function(e, idx){
      let eh = '<div class="cv-edu"><div>';
      eh += '<div class="cv-edu-deg">'+bf(e.degree)+'</div>';
      eh += '<div class="cv-edu-inst">'+bf(e.inst)+'</div>';
      eh += '<div class="cv-jmeta">' + renderDateLoc(e.date) + '</div>';
      eh += '</div><div class="cv-edu-r">';
      eh += renderGpaBox(e.gpa);
      eh += '</div></div>';
      blocks.push({ type:'item', section:'edu', itemIndex:idx, html:eh });
    });
  }

  // PROJECTS (paired into 2-col grid rows)
  if(D.projects.length){
    blocks.push({ type:'section-title', section:'projects', html:'<div class="sec-ttl">Side Projects</div>' });
    for(let i = 0; i < D.projects.length; i += 2) {
      const p1 = D.projects[i];
      const p2 = D.projects[i+1];
      let ph = '<div class="cv-proj-grid">';
      ph += '<div class="cv-proj-item"><div style="display:flex;gap:8px;align-items:flex-start;">';
      ph += getProjectIcon(p1.name);
      ph += '<div><div class="cv-proj-name">'+bf(p1.name)+'</div>';
      ph += '<div class="cv-proj-desc">'+bf(p1.desc)+'</div></div></div></div>';
      if(p2) {
        ph += '<div class="cv-proj-item"><div style="display:flex;gap:8px;align-items:flex-start;">';
        ph += getProjectIcon(p2.name);
        ph += '<div><div class="cv-proj-name">'+bf(p2.name)+'</div>';
        ph += '<div class="cv-proj-desc">'+bf(p2.desc)+'</div></div></div></div>';
      }
      ph += '</div>';
      blocks.push({ type:'item', section:'projects', itemIndex:i, html:ph });
    }
  }

  // SKILLS
  if(skills.length){
    blocks.push({ type:'section-title', section:'skills', html:'<div class="sec-ttl">Skills</div>' });
    let sh = '<div class="cv-skills">';
    skills.forEach(function(s){ sh += '<span class="cv-skill">'+bf(s)+'</span>'; });
    sh += '</div>';
    blocks.push({ type:'item', section:'skills', html:sh });
  }

  // CERTIFICATIONS
  if(D.certs.length){
    blocks.push({ type:'section-title', section:'certs', html:'<div class="sec-ttl">Certifications</div>' });
    D.certs.forEach(function(c, idx){
      let ch = '<div class="cv-cert">';
      ch += '<div class="cv-cert-name">'+bf(c.name)+'</div>';
      ch += '<div class="cv-cert-iss">'+bf(c.iss)+'</div>';
      ch += '</div>';
      blocks.push({ type:'item', section:'certs', itemIndex:idx, html:ch });
    });
  }

  // REFERENCES (paired into 2-col grid rows)
  if(D.refs.length){
    blocks.push({ type:'section-title', section:'refs', html:'<div class="sec-ttl">References</div>' });
    for(let i = 0; i < D.refs.length; i += 2) {
      const r1 = D.refs[i];
      const r2 = D.refs[i+1];
      let rh = '<div class="cv-refs"><div>';
      rh += '<div class="cv-ref-name">'+bf(r1.name)+'</div>';
      rh += '<div class="cv-ref-role">'+nl2br(r1.role)+'</div>';
      if(r1.email) rh += '<div class="cv-ref-c">'+contactAnchor(r1.email, emailIcon)+'</div>';
      if(r1.phone) rh += '<div class="cv-ref-c">'+contactAnchor(r1.phone, phoneIcon)+'</div>';
      rh += '</div>';
      if(r2) {
        rh += '<div>';
        rh += '<div class="cv-ref-name">'+bf(r2.name)+'</div>';
        rh += '<div class="cv-ref-role">'+nl2br(r2.role)+'</div>';
        if(r2.email) rh += '<div class="cv-ref-c">'+contactAnchor(r2.email, emailIcon)+'</div>';
        if(r2.phone) rh += '<div class="cv-ref-c">'+contactAnchor(r2.phone, phoneIcon)+'</div>';
        rh += '</div>';
      }
      rh += '</div>';
      blocks.push({ type:'item', section:'refs', itemIndex:i, html:rh });
    }
  }

  /* ── PAGINATION ALGORITHM ── */
  const pages = [[]];
  let pi = 0; // current page index

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    pages[pi].push(block);

    // Page 1 has the full header; pages 2+ reserve room for the running header.
    const pageMax = (pi === 0) ? maxContentHeightPx : maxContentHeightRestPx;
    const height = measureBlocksHeight(pages[pi]);
    if (height > pageMax && pages[pi].length > 1) {
      // Overflowed — pull the block off this page and carry it to the next one.
      pages[pi].pop();
      const carried = [block];

      // Widow protection: don't strand a section-title alone at the bottom of a
      // page — move it to the next page together with its first item.
      if (pages[pi].length > 0 &&
          pages[pi][pages[pi].length - 1].type === 'section-title') {
        carried.unshift(pages[pi].pop());
      }

      pi++;
      pages[pi] = carried;
    }
  }

  /* ── RENDER PAGES TO DOM ── */
  let finalHtml = '';
  const totalPages = pages.length;

  pages.forEach(function(pageBlocks, index) {
    const pageNum = index + 1;
    const pageContentHtml = assembleBlocksHtml(pageBlocks);

    finalHtml += '<div class="cv-page">';
    if (index > 0) finalHtml += runningHeaderHtml;
    finalHtml += pageContentHtml;
    finalHtml += '<div class="cv-page-footer">';
    finalHtml += '<div class="cv-footer-line"></div>';
    finalHtml += '<div class="cv-footer-content">';
    finalHtml += '<span>' + bf(name) + ' — CV</span>';
    finalHtml += '<span>Page ' + pageNum + ' of ' + totalPages + '</span>';
    finalHtml += '</div></div>';
    finalHtml += '</div>';
  });

  document.getElementById('cv').innerHTML = finalHtml;
  document.getElementById('cv-sandbox').innerHTML = '';

  const pvPages = document.getElementById('pv-pages');
  if (pvPages) pvPages.textContent = totalPages + (totalPages === 1 ? ' page' : ' pages');

  adjustScale();
  save();
}

function save(){
  try {
    D.name = document.getElementById('f-name').value;
    D.title = document.getElementById('f-title').value;
    D.phone = document.getElementById('f-phone').value;
    D.email = document.getElementById('f-email').value;
    D.location = document.getElementById('f-location').value;
    D.summary = document.getElementById('f-summary').value;
    D.skills = document.getElementById('f-skills').value.split('\n').map(function(s){return s.trim();}).filter(Boolean);
    localStorage.setItem('cv_data', JSON.stringify(D));
  } catch(e) {
    console.error("Error saving data:", e);
  }
}
