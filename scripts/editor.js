/*
 * editor.js
 * Bold tool + form section builders (links, jobs, education, projects, certs, refs)
 */

let _el = null, _s0 = 0, _s1 = 0;
document.addEventListener('focusin', e => {
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') _el = e.target;
});
document.addEventListener('selectionchange', () => {
  if(_el){ _s0 = _el.selectionStart; _s1 = _el.selectionEnd; }
});
['mouseup','keyup','keydown'].forEach(ev =>
  document.addEventListener(ev, () => { if(_el){ _s0=_el.selectionStart; _s1=_el.selectionEnd; } })
);

function applyBold(){
  if(!_el){ alert('Click inside any text field first, select some text, then click Bold.'); return; }
  let s = _el.selectionStart, e = _el.selectionEnd;
  if(s===e){ s=_s0; e=_s1; }
  if(s===e){ alert('Please select some text first, then click Bold.'); return; }
  const v=_el.value, sel=v.slice(s,e), before=v.slice(0,s), after=v.slice(e);
  let nv, nc;
  if(before.endsWith('**')&&after.startsWith('**')){
    nv = v.slice(0,s-2)+sel+v.slice(e+2); nc = s-2+sel.length;
  } else {
    nv = before+'**'+sel+'**'+after; nc = s+2+sel.length+2;
  }
  _el.value = nv;
  _el.focus();
  _el.setSelectionRange(nc,nc);
  _el.dispatchEvent(new Event('input'));
  const btn=document.getElementById('boldBtn');
  btn.classList.add('active');
  setTimeout(()=>btn.classList.remove('active'),600);
}

function buildLinks(){
  const w = document.getElementById('links-wrap');
  w.innerHTML = '';
  D.links.forEach(function(lk, i){
    const row = document.createElement('div');
    row.className = 'link-row';
    row.innerHTML =
      '<div class="lr-fields">' +
        '<div><div class="lr-small">LABEL (shown in CV)</div>' +
          '<input class="lr-input" placeholder="e.g. LinkedIn, Portfolio" value="' + esc(lk.label) + '" data-i="' + i + '" data-f="label"></div>' +
        '<div><div class="lr-small">URL (full https:// link)</div>' +
          '<input class="lr-input" placeholder="https://..." value="' + esc(lk.url) + '" data-i="' + i + '" data-f="url"></div>' +
      '</div>' +
      '<button class="link-rm" data-i="' + i + '" title="Remove">✕</button>';
    w.appendChild(row);
  });
  w.querySelectorAll('.lr-input').forEach(function(inp){
    inp.addEventListener('input', function(){
      const idx = parseInt(this.dataset.i);
      const field = this.dataset.f;
      D.links[idx][field] = this.value;
      render();
    });
    inp.addEventListener('focus', function(){ _el = this; });
  });
  w.querySelectorAll('.link-rm').forEach(function(btn){
    btn.addEventListener('click', function(){
      const idx = parseInt(this.dataset.i);
      D.links.splice(idx, 1);
      buildLinks();
      render();
    });
  });
}
function addLink(){ D.links.push({label:'',url:''}); buildLinks(); render(); }

function buildJobs(){
  const w = document.getElementById('jobs-wrap');
  w.innerHTML = '';
  D.jobs.forEach(function(j, i){
    const d = document.createElement('div');
    d.className = 'blk';
    d.innerHTML =
      '<div class="blk-hd" onclick="tog(this)">' +
        '<span class="blk-lbl">' + (esc(j.title)||'New Job') + '</span>' +
        '<span class="blk-arr open">▶</span>' +
      '</div>' +
      '<div class="blk-body open">' +
        '<div class="fg"><label>Job Title</label>' +
          '<input data-i="'+i+'" data-f="title" value="'+esc(j.title)+'"></div>' +
        '<div class="fg"><label>Company</label>' +
          '<input data-i="'+i+'" data-f="company" value="'+esc(j.company)+'"></div>' +
        '<div class="fg"><label>Company Description</label>' +
          '<input data-i="'+i+'" data-f="desc" value="'+esc(j.desc)+'"></div>' +
        '<div class="fg"><label>Date / Location</label>' +
          '<input data-i="'+i+'" data-f="date" value="'+esc(j.date)+'"></div>' +
        '<div class="fg"><label>Bullet Points (one per line)</label>' +
          '<textarea class="tall" data-i="'+i+'" data-f="bullets">'+esc(j.bullets.join('\n'))+'</textarea>' +
          '<div class="hint">Select text → Bold button</div></div>' +
        '<button class="btn-rm" data-i="'+i+'" data-rm="job">✕ Remove this job</button>' +
      '</div>';
    w.appendChild(d);
  });
  w.querySelectorAll('input[data-f]').forEach(function(inp){
    inp.addEventListener('input', function(){
      D.jobs[+this.dataset.i][this.dataset.f] = this.value;
      if(this.dataset.f==='title') this.closest('.blk').querySelector('.blk-lbl').textContent = this.value||'New Job';
      render();
    });
    inp.addEventListener('focus', function(){ _el=this; });
  });
  w.querySelectorAll('textarea[data-f]').forEach(function(ta){
    ta.addEventListener('input', function(){
      D.jobs[+this.dataset.i].bullets = this.value.split('\n');
      render();
    });
    ta.addEventListener('focus', function(){ _el=this; });
  });
  w.querySelectorAll('.btn-rm[data-rm="job"]').forEach(function(btn){
    btn.addEventListener('click', function(){ D.jobs.splice(+this.dataset.i,1); buildJobs(); render(); });
  });
}
function addJob(){ D.jobs.push({title:'',company:'',desc:'',date:'',bullets:['']}); buildJobs(); render(); }

function buildEdu(){
  const w = document.getElementById('edu-wrap');
  w.innerHTML = '';
  D.edu.forEach(function(e, i){
    const d = document.createElement('div');
    d.className = 'blk';
    d.innerHTML =
      '<div class="blk-hd" onclick="tog(this)">' +
        '<span class="blk-lbl">'+(esc(e.degree)||'Education')+'</span>' +
        '<span class="blk-arr open">▶</span>' +
      '</div>' +
      '<div class="blk-body open">' +
        '<div class="fg"><label>Degree</label><input data-i="'+i+'" data-f="degree" value="'+esc(e.degree)+'"></div>' +
        '<div class="fg"><label>Institution</label><input data-i="'+i+'" data-f="inst" value="'+esc(e.inst)+'"></div>' +
        '<div class="fg"><label>Date / Location</label><input data-i="'+i+'" data-f="date" value="'+esc(e.date)+'"></div>' +
        '<div class="fg"><label>GPA / Result</label><input data-i="'+i+'" data-f="gpa" value="'+esc(e.gpa)+'"></div>' +
        '<button class="btn-rm" data-i="'+i+'" data-rm="edu">✕ Remove</button>' +
      '</div>';
    w.appendChild(d);
  });
  w.querySelectorAll('input[data-f]').forEach(function(inp){
    inp.addEventListener('input', function(){
      D.edu[+this.dataset.i][this.dataset.f] = this.value;
      if(this.dataset.f==='degree') this.closest('.blk').querySelector('.blk-lbl').textContent = this.value||'Education';
      render();
    });
    inp.addEventListener('focus', function(){ _el=this; });
  });
  w.querySelectorAll('.btn-rm[data-rm="edu"]').forEach(function(btn){
    btn.addEventListener('click', function(){ D.edu.splice(+this.dataset.i,1); buildEdu(); render(); });
  });
}
function addEdu(){ D.edu.push({degree:'',inst:'',date:'',gpa:''}); buildEdu(); render(); }

function buildProj(){
  const w = document.getElementById('proj-wrap');
  w.innerHTML = '';
  D.projects.forEach(function(p, i){
    const d = document.createElement('div');
    d.className = 'blk';
    d.innerHTML =
      '<div class="blk-hd" onclick="tog(this)">' +
        '<span class="blk-lbl">'+(esc(p.name)||'Project')+'</span>' +
        '<span class="blk-arr open">▶</span>' +
      '</div>' +
      '<div class="blk-body open">' +
        '<div class="fg"><label>Project Name</label><input data-i="'+i+'" data-f="name" value="'+esc(p.name)+'"></div>' +
        '<div class="fg"><label>Description</label><textarea data-i="'+i+'" data-f="desc">'+esc(p.desc)+'</textarea></div>' +
        '<button class="btn-rm" data-i="'+i+'" data-rm="proj">✕ Remove</button>' +
      '</div>';
    w.appendChild(d);
  });
  w.querySelectorAll('input[data-f]').forEach(function(inp){
    inp.addEventListener('input', function(){
      D.projects[+this.dataset.i][this.dataset.f] = this.value;
      if(this.dataset.f==='name') this.closest('.blk').querySelector('.blk-lbl').textContent = this.value||'Project';
      render();
    });
    inp.addEventListener('focus', function(){ _el=this; });
  });
  w.querySelectorAll('textarea[data-f]').forEach(function(ta){
    ta.addEventListener('input', function(){ D.projects[+this.dataset.i][this.dataset.f]=this.value; render(); });
    ta.addEventListener('focus', function(){ _el=this; });
  });
  w.querySelectorAll('.btn-rm[data-rm="proj"]').forEach(function(btn){
    btn.addEventListener('click', function(){ D.projects.splice(+this.dataset.i,1); buildProj(); render(); });
  });
}
function addProj(){ D.projects.push({name:'',desc:''}); buildProj(); render(); }

function buildCerts(){
  const w = document.getElementById('cert-wrap');
  w.innerHTML = '';
  D.certs.forEach(function(c, i){
    const d = document.createElement('div');
    d.className = 'blk';
    d.innerHTML =
      '<div class="blk-hd" onclick="tog(this)">' +
        '<span class="blk-lbl">'+(esc(c.name)||'Certification')+'</span>' +
        '<span class="blk-arr open">▶</span>' +
      '</div>' +
      '<div class="blk-body open">' +
        '<div class="fg"><label>Certificate Name</label><input data-i="'+i+'" data-f="name" value="'+esc(c.name)+'"></div>' +
        '<div class="fg"><label>Issuing Organization</label><input data-i="'+i+'" data-f="iss" value="'+esc(c.iss)+'"></div>' +
        '<button class="btn-rm" data-i="'+i+'" data-rm="cert">✕ Remove</button>' +
      '</div>';
    w.appendChild(d);
  });
  w.querySelectorAll('input[data-f]').forEach(function(inp){
    inp.addEventListener('input', function(){
      D.certs[+this.dataset.i][this.dataset.f] = this.value;
      if(this.dataset.f==='name') this.closest('.blk').querySelector('.blk-lbl').textContent = this.value||'Certification';
      render();
    });
    inp.addEventListener('focus', function(){ _el=this; });
  });
  w.querySelectorAll('.btn-rm[data-rm="cert"]').forEach(function(btn){
    btn.addEventListener('click', function(){ D.certs.splice(+this.dataset.i,1); buildCerts(); render(); });
  });
}
function addCert(){ D.certs.push({name:'',iss:''}); buildCerts(); render(); }

function buildRefs(){
  const w = document.getElementById('refs-wrap');
  w.innerHTML = '';
  D.refs.forEach(function(r, i){
    const d = document.createElement('div');
    d.className = 'blk';
    d.innerHTML =
      '<div class="blk-hd" onclick="tog(this)">' +
        '<span class="blk-lbl">'+(esc(r.name)||'Reference')+'</span>' +
        '<span class="blk-arr open">▶</span>' +
      '</div>' +
      '<div class="blk-body open">' +
        '<div class="fg"><label>Name</label><input data-i="'+i+'" data-f="name" value="'+esc(r.name)+'"></div>' +
        '<div class="fg"><label>Role / Company</label><textarea data-i="'+i+'" data-f="role">'+esc(r.role)+'</textarea></div>' +
        '<div class="fg"><label>Email</label><input data-i="'+i+'" data-f="email" value="'+esc(r.email)+'"></div>' +
        '<div class="fg"><label>Phone</label><input data-i="'+i+'" data-f="phone" value="'+esc(r.phone)+'"></div>' +
        '<button class="btn-rm" data-i="'+i+'" data-rm="ref">✕ Remove</button>' +
      '</div>';
    w.appendChild(d);
  });
  w.querySelectorAll('input[data-f]').forEach(function(inp){
    inp.addEventListener('input', function(){
      D.refs[+this.dataset.i][this.dataset.f] = this.value;
      if(this.dataset.f==='name') this.closest('.blk').querySelector('.blk-lbl').textContent = this.value||'Reference';
      render();
    });
    inp.addEventListener('focus', function(){ _el=this; });
  });
  w.querySelectorAll('textarea[data-f]').forEach(function(ta){
    ta.addEventListener('input', function(){ D.refs[+this.dataset.i][this.dataset.f]=this.value; render(); });
    ta.addEventListener('focus', function(){ _el=this; });
  });
  w.querySelectorAll('.btn-rm[data-rm="ref"]').forEach(function(btn){
    btn.addEventListener('click', function(){ D.refs.splice(+this.dataset.i,1); buildRefs(); render(); });
  });
}
function addRef(){ D.refs.push({name:'',role:'',email:'',phone:''}); buildRefs(); render(); }
