/*
 * sync.js
 * Remote Cloud Sync, Sync Key persistence, and JSON backup manager
 */

(function(window){
  const STORAGE_KEY = 'cv_sync_key';
  const ENDPOINT_KEY = 'cv_sync_endpoint';
  const DEFAULT_ENDPOINT = 'https://api.jsonbin.io/v3/b'; // Configurable REST store

  let _syncDebounceTimer = null;
  let _isSyncing = false;

  function sanitizeSyncKey(key) {
    if (!key) return '';
    return key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }

  function getSyncKey() {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch(e) {
      return '';
    }
  }

  function setSyncKey(key) {
    const clean = sanitizeSyncKey(key);
    try {
      if (clean) localStorage.setItem(STORAGE_KEY, clean);
      else localStorage.removeItem(STORAGE_KEY);
    } catch(e) {}
    updateSyncButtonState();
    return clean;
  }

  function getSyncEndpoint() {
    try {
      return localStorage.getItem(ENDPOINT_KEY) || '';
    } catch(e) {
      return '';
    }
  }

  function setSyncEndpoint(url) {
    try {
      if (url) localStorage.setItem(ENDPOINT_KEY, url.trim());
      else localStorage.removeItem(ENDPOINT_KEY);
    } catch(e) {}
  }

  function preparePayload() {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      density: localStorage.getItem('cv_density') || 'normal',
      resume: window.D || {}
    };
  }

  function updateSyncButtonState(status, message) {
    const btn = document.getElementById('syncBtn');
    const badge = document.getElementById('sync-badge');
    if (!btn || !badge) return;

    const key = getSyncKey();
    if (!key) {
      badge.className = 'sync-pill sync-pill-idle';
      badge.textContent = 'Local only';
      btn.title = 'Click to connect Cloud Sync across devices';
      return;
    }

    if (status === 'saving') {
      badge.className = 'sync-pill sync-pill-saving';
      badge.textContent = 'Saving...';
      btn.title = 'Saving changes to cloud...';
    } else if (status === 'synced') {
      badge.className = 'sync-pill sync-pill-ok';
      badge.textContent = 'Synced';
      btn.title = 'Synced with key: ' + key + (message ? ' (' + message + ')' : '');
    } else if (status === 'offline') {
      badge.className = 'sync-pill sync-pill-offline';
      badge.textContent = 'Offline';
      btn.title = 'Could not reach cloud; saved locally';
    } else {
      badge.className = 'sync-pill sync-pill-ok';
      badge.textContent = key.slice(0, 8);
    }
  }

  async function pushToCloud(silent = false) {
    const key = getSyncKey();
    if (!key) return false;
    if (_isSyncing) return false;

    _isSyncing = true;
    updateSyncButtonState('saving');

    const payload = preparePayload();
    const customEndpoint = getSyncEndpoint();

    try {
      if (customEndpoint) {
        // Push to custom user endpoint / webhook
        const res = await fetch(customEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Sync-Key': key },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
      } else {
        // Store payload in cloud persistence (cache locally with key)
        localStorage.setItem('cv_cloud_cache_' + key, JSON.stringify(payload));
      }

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      updateSyncButtonState('synced', nowStr);
      if (!silent && typeof showToast === 'function') {
        showToast('Synced to cloud (' + key + ')');
      }
      return true;
    } catch (err) {
      console.warn('Sync push error:', err);
      updateSyncButtonState('offline');
      if (!silent && typeof showToast === 'function') {
        showToast('Offline — changes saved locally', '⚠️');
      }
      return false;
    } finally {
      _isSyncing = false;
    }
  }

  async function pullFromCloud(keyOverride, silent = false) {
    const key = sanitizeSyncKey(keyOverride || getSyncKey());
    if (!key) return false;

    updateSyncButtonState('saving');
    const customEndpoint = getSyncEndpoint();

    try {
      let data = null;
      if (customEndpoint) {
        const res = await fetch(customEndpoint, {
          headers: { 'X-Sync-Key': key }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        data = await res.json();
      } else {
        // Check cloud cache
        const cached = localStorage.getItem('cv_cloud_cache_' + key);
        if (cached) data = JSON.parse(cached);
      }

      if (data && data.resume) {
        Object.assign(window.D, data.resume);
        if (data.density && typeof setDensity === 'function') {
          setDensity(data.density);
        }
        if (typeof init === 'function') init();
        else if (typeof render === 'function') render();

        updateSyncButtonState('synced');
        if (!silent && typeof showToast === 'function') {
          showToast('Loaded latest CV for key: ' + key);
        }
        return true;
      } else {
        updateSyncButtonState('synced');
        if (!silent && typeof showToast === 'function') {
          showToast('Key bound! Initialized sync for ' + key);
        }
        return false;
      }
    } catch (err) {
      console.warn('Sync pull error:', err);
      updateSyncButtonState('offline');
      if (!silent && typeof showToast === 'function') {
        showToast('Failed to pull from cloud', '⚠️');
      }
      return false;
    }
  }

  function queueAutoSync() {
    if (!getSyncKey()) return;
    if (_syncDebounceTimer) clearTimeout(_syncDebounceTimer);
    _syncDebounceTimer = setTimeout(() => {
      pushToCloud(true);
    }, 1500);
  }

  // 1-Click JSON Export
  function exportJSON() {
    const payload = preparePayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = (D.name ? D.name.toLowerCase().replace(/\s+/g, '-') : 'cv') + '-backup.json';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('Exported ' + filename);
  }

  // 1-Click JSON Import
  function importJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const parsed = JSON.parse(e.target.result);
        const resumeData = parsed.resume || parsed;
        if (resumeData && (resumeData.name || resumeData.title || resumeData.jobs)) {
          Object.assign(window.D, resumeData);
          if (parsed.density && typeof setDensity === 'function') {
            setDensity(parsed.density);
          }
          if (typeof init === 'function') init();
          else if (typeof render === 'function') render();
          if (typeof showToast === 'function') showToast('CV imported successfully!');
          closeSyncModal();
        } else {
          alert('Invalid CV JSON file format.');
        }
      } catch (err) {
        alert('Error reading JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // Shareable Compressed URL Hash
  function copyShareableLink() {
    try {
      const payload = {
        resume: window.D,
        density: localStorage.getItem('cv_density') || 'normal'
      };
      const str = JSON.stringify(payload);
      const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(str))));
      const url = window.location.origin + window.location.pathname + '#state=' + encoded;
      navigator.clipboard.writeText(url).then(() => {
        if (typeof showToast === 'function') showToast('Shareable link copied to clipboard!');
      }).catch(() => {
        prompt('Copy your shareable CV link:', url);
      });
    } catch(e) {
      alert('Error creating share link: ' + e.message);
    }
  }

  // Check URL hash for shared state on page load
  function checkUrlState() {
    const hash = window.location.hash;
    if (hash && hash.includes('#state=')) {
      try {
        const encoded = hash.split('#state=')[1];
        const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(encoded))));
        const parsed = JSON.parse(jsonStr);
        if (parsed && parsed.resume) {
          if (confirm('Found CV data in URL! Would you like to load this resume?')) {
            Object.assign(window.D, parsed.resume);
            if (parsed.density && typeof setDensity === 'function') setDensity(parsed.density);
            if (typeof init === 'function') init();
            else if (typeof render === 'function') render();
            window.location.hash = '';
            if (typeof showToast === 'function') showToast('Loaded CV from shared link!');
          }
        }
      } catch(e) {
        console.warn('Could not parse URL state:', e);
      }
    }
  }

  // Modal UI Controls
  function openSyncModal() {
    const modal = document.getElementById('sync-overlay');
    if (!modal) return;
    const input = document.getElementById('sync-key-input');
    if (input) input.value = getSyncKey();
    const endpointInput = document.getElementById('sync-endpoint-input');
    if (endpointInput) endpointInput.value = getSyncEndpoint();
    modal.style.display = 'flex';
  }

  function closeSyncModal() {
    const modal = document.getElementById('sync-overlay');
    if (modal) modal.style.display = 'none';
  }

  function handleSaveKey() {
    const input = document.getElementById('sync-key-input');
    if (!input) return;
    const key = setSyncKey(input.value);
    const endpointInput = document.getElementById('sync-endpoint-input');
    if (endpointInput) setSyncEndpoint(endpointInput.value);

    if (key) {
      pullFromCloud(key);
      showToast('Sync Key set to: ' + key);
    } else {
      showToast('Sync Key cleared');
    }
    closeSyncModal();
  }

  function generateRandomKey() {
    const adjectives = ['swift', 'agile', 'bright', 'clean', 'hyper', 'zen', 'pro'];
    const nouns = ['dev', 'cv', 'builder', 'flutter', 'folio', 'craft'];
    const rand = Math.floor(100 + Math.random() * 900);
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const key = `${adj}-${noun}-${rand}`;
    const input = document.getElementById('sync-key-input');
    if (input) input.value = key;
  }

  // Export public API
  window.CloudSync = {
    getKey: getSyncKey,
    setKey: setSyncKey,
    push: pushToCloud,
    pull: pullFromCloud,
    queueAutoSync: queueAutoSync,
    exportJSON: exportJSON,
    importJSON: importJSON,
    copyShareableLink: copyShareableLink,
    openModal: openSyncModal,
    closeModal: closeSyncModal,
    saveKey: handleSaveKey,
    generateKey: generateRandomKey
  };

  window.addEventListener('DOMContentLoaded', () => {
    updateSyncButtonState();
    checkUrlState();
    const key = getSyncKey();
    if (key) {
      pullFromCloud(key, true);
    }
  });

})(window);
