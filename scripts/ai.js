/*
 * ai.js
 * AI CV Tailor — dynamic client-side call to the Anthropic Messages API
 */

const AI_DEFAULT_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const AI_DEFAULT_MODEL = 'claude-opus-4-8';
let _aiResult = null;

function openAI(){
  document.getElementById('ai-key').value      = localStorage.getItem('cv_api_key') || '';
  document.getElementById('ai-model').value    = localStorage.getItem('cv_api_model') || AI_DEFAULT_MODEL;
  document.getElementById('ai-endpoint').value = localStorage.getItem('cv_api_endpoint') || AI_DEFAULT_ENDPOINT;
  document.getElementById('ai-error').textContent = '';
  aiShowStep('input');
  document.getElementById('ai-overlay').classList.add('open');
  document.getElementById('ai-jd').focus();
}
function closeAI(){ document.getElementById('ai-overlay').classList.remove('open'); }
function aiShowStep(step){
  ['input','loading','result'].forEach(function(s){
    document.getElementById('ai-step-'+s).style.display = (s===step) ? 'block' : 'none';
  });
}
function aiBack(){ aiShowStep('input'); }

function aiBuildPrompt(jd){
  const cv = {
    current_summary: document.getElementById('f-summary').value,
    experience: D.jobs.map(function(j){
      return {
        title: j.title,
        company: j.company,
        bullets: (j.bullets||[]).filter(function(b){ return (b||'').trim(); })
      };
    })
  };
  return (
'TARGET JOB DESCRIPTION:\n"""\n' + jd + '\n"""\n\n' +
'CANDIDATE\'S CURRENT RESUME CONTENT (JSON):\n' + JSON.stringify(cv, null, 2) + '\n\n' +
'TASK:\n' +
'1. Write a new ATS-optimized professional SUMMARY (3-5 sentences) tailored to the target job. Naturally weave in exact keywords, tools, and phrasing from the job description that GENUINELY match the candidate\'s real background. Do not invent anything.\n' +
'2. For EACH experience entry, rewrite its bullet points to be ATS-friendly and aligned to the job description: strong action verbs, concise single-line bullets, relevant keywords. Keep the SAME jobs (same title & company), keep 3-5 bullets each, and keep every claim strictly truthful to the original bullets — rephrase and re-emphasize, never fabricate new employers, metrics, dates, or technologies.\n' +
'3. List the key ATS keywords from the job description that you incorporated.\n\n' +
'You may wrap a few critical keywords in **double asterisks** to bold them (the app renders that as bold), but use it sparingly.\n\n' +
'Respond with ONLY a valid JSON object (no markdown, no code fences) of this exact shape:\n' +
'{\n  "summary": "string",\n  "keywords": ["string"],\n  "jobs": [ { "title": "string", "company": "string", "bullets": ["string"] } ]\n}\n' +
'Preserve the order of jobs exactly as given.'
  );
}

async function runAI(){
  const key      = document.getElementById('ai-key').value.trim();
  const jd       = document.getElementById('ai-jd').value.trim();
  const model    = document.getElementById('ai-model').value.trim() || AI_DEFAULT_MODEL;
  const endpoint = document.getElementById('ai-endpoint').value.trim() || AI_DEFAULT_ENDPOINT;
  const err = document.getElementById('ai-error');
  err.textContent = '';

  if(!jd){ err.textContent = 'Please paste the job description first.'; return; }
  if(!key){ err.textContent = 'Please enter an API key. (No subscription? The editor still works fully without AI.)'; return; }

  // Persist the dynamic config for next time
  localStorage.setItem('cv_api_key', key);
  localStorage.setItem('cv_api_model', model);
  localStorage.setItem('cv_api_endpoint', endpoint);

  aiShowStep('loading');
  try{
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        system: 'You are an expert technical resume writer and ATS (Applicant Tracking System) optimization specialist. You rewrite resume content to maximize keyword alignment with a target job description while staying strictly truthful to the candidate\'s real experience. Never invent employers, job titles, dates, metrics, or technologies the candidate has not listed. Prefer strong action verbs and concise, single-line bullet points. Output valid JSON only.',
        messages: [{ role: 'user', content: aiBuildPrompt(jd) }]
      })
    });

    if(!res.ok){
      let msg = 'API error ' + res.status;
      try { const e = await res.json(); if(e && e.error && e.error.message) msg = e.error.message; } catch(_){}
      const err2 = new Error(msg); err2.status = res.status; throw err2;
    }

    const data = await res.json();
    const text = (data.content||[])
      .filter(function(b){ return b.type === 'text'; })
      .map(function(b){ return b.text; })
      .join('\n').trim();

    _aiResult = aiParseJson(text);
    if(!_aiResult || !_aiResult.summary){
      throw new Error('Could not read the AI response. Please try again.');
    }
    aiRenderResult(_aiResult);
    aiShowStep('result');
  } catch(e){
    aiShowStep('input');
    err.textContent = aiFriendlyError(e);
  }
}

function aiParseJson(text){
  if(!text) return null;
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  if(s !== -1 && e !== -1) t = t.slice(s, e + 1);
  try { return JSON.parse(t); } catch(_){ return null; }
}

function aiFriendlyError(e){
  const m = (e && e.message) || 'Unknown error';
  const st = e && e.status;
  if(/Failed to fetch|NetworkError|CORS/i.test(m)){
    return 'Could not reach the API. Check your internet connection, the endpoint URL, and that your key is valid.';
  }
  if(st === 401 || /authentication|invalid.*key|x-api-key/i.test(m)) return 'Invalid or missing API key. Please check your key in Advanced settings.';
  if(st === 402 || /credit|billing|insufficient|quota/i.test(m)) return 'No active subscription / credits on this API account. Add billing at console.anthropic.com, or skip AI — the editor works without it.';
  if(st === 429 || /rate limit/i.test(m)) return 'Rate limited. Please wait a moment and try again.';
  if(st === 404 || /model/i.test(m)) return 'Model or endpoint not found. Check the Model and API Endpoint in Advanced settings.';
  return m;
}

function aiRenderResult(r){
  let h = '';
  if(Array.isArray(r.keywords) && r.keywords.length){
    h += '<div class="ai-sec-lbl">ATS keywords incorporated</div><div class="ai-kw">' +
         r.keywords.map(function(k){ return '<span class="ai-kw-chip">' + esc(k) + '</span>'; }).join('') + '</div>';
  }
  h += '<div class="ai-sec-lbl">New ATS Summary</div><div class="ai-preview-box">' + bf(r.summary || '') + '</div>';
  if(Array.isArray(r.jobs) && r.jobs.length){
    h += '<div class="ai-sec-lbl">Rewritten Experience</div>';
    r.jobs.forEach(function(j){
      h += '<div class="ai-job"><div class="ai-job-t">' + esc(j.title||'') + ' — ' + esc(j.company||'') + '</div><ul>' +
           (j.bullets||[]).map(function(b){ return '<li>' + bf(b) + '</li>'; }).join('') + '</ul></div>';
    });
  }
  h += '<div class="ai-apply-note">Review the changes, then choose what to apply:</div>' +
       '<div class="ai-opts">' +
       '<label><input type="checkbox" id="ai-apply-sum" checked> Apply summary</label>' +
       '<label><input type="checkbox" id="ai-apply-exp" checked> Apply experience</label>' +
       '</div>';
  document.getElementById('ai-result-content').innerHTML = h;
}

function _aiNorm(s){ return (s||'').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function applyAI(){
  if(!_aiResult) return;
  const sumBox = document.getElementById('ai-apply-sum');
  const expBox = document.getElementById('ai-apply-exp');
  const doSum = sumBox ? sumBox.checked : true;
  const doExp = expBox ? expBox.checked : true;

  if(doSum && _aiResult.summary){
    D.summary = _aiResult.summary;
    document.getElementById('f-summary').value = _aiResult.summary;
  }
  if(doExp && Array.isArray(_aiResult.jobs)){
    let fallback = 0;
    _aiResult.jobs.forEach(function(rj){
      if(!rj || !Array.isArray(rj.bullets)) return;
      let idx = D.jobs.findIndex(function(j){
        return _aiNorm(j.title) === _aiNorm(rj.title) && _aiNorm(j.company) === _aiNorm(rj.company);
      });
      if(idx === -1) idx = fallback;
      if(D.jobs[idx]){ D.jobs[idx].bullets = rj.bullets.slice(); fallback = idx + 1; }
    });
    buildJobs();
  }
  render();
  closeAI();
}
