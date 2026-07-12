/*
 * app.js
 * App actions (reset, print) + bootstrap/init
 */

function resetTemplate(){
  if(confirm('Are you sure you want to discard all changes and reset to the default template?')){
    localStorage.removeItem('cv_data');
    location.reload();
  }
}

function printCV(){
  var printNow = function(){ window.focus(); window.print(); };
  if(!sessionStorage.getItem('cv_pdf_link_tip')){
    sessionStorage.setItem('cv_pdf_link_tip', '1');
    alert('For clickable links, set Destination to "Save as PDF" in Chrome or Edge. Do not use "Microsoft Print to PDF" or other printer drivers. Enable Background graphics if styles look incomplete.');
  }
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(printNow).catch(printNow);
  } else {
    setTimeout(printNow, 300);
  }
}

function init(){
  const saved = localStorage.getItem('cv_data');
  if(saved){
    try {
      const parsed = JSON.parse(saved);
      Object.assign(D, parsed);
    } catch(e) {
      console.error("Error loading data:", e);
    }
  }

  document.getElementById('f-name').value     = D.name || '';
  document.getElementById('f-title').value    = D.title;
  document.getElementById('f-phone').value    = D.phone;
  document.getElementById('f-email').value    = D.email;
  document.getElementById('f-location').value = D.location;
  document.getElementById('f-summary').value  = D.summary;
  document.getElementById('f-skills').value   = D.skills.join('\n');

  // Attach focus tracking for simple header fields
  ['f-name','f-title','f-phone','f-email','f-location','f-summary','f-skills'].forEach(function(id){
    var el = document.getElementById(id);
    el.addEventListener('focus', function(){ _el = this; });
    el.addEventListener('input', function(){ _s0=this.selectionStart; _s1=this.selectionEnd; render(); });
  });

  buildLinks();
  buildJobs();
  buildEdu();
  buildProj();
  buildCerts();
  buildRefs();
  render();
}

init();
