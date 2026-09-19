import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import or replicate helper logic for testing
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function bf(s){
  if(!s) return '';
  return (s+'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a class="cv-inline-link" href="$2" target="_blank" rel="noopener">$1</a>');
}

describe('bf() text formatter with bold and hyperlinks', () => {
  it('parses bold tags correctly', () => {
    assert.equal(bf('Hello **World**'), 'Hello <strong>World</strong>');
  });

  it('parses markdown hyperlinks correctly with protocol', () => {
    const input = 'Architected [Dietify](https://dietify.app) using Flutter';
    const expected = 'Architected <a class="cv-inline-link" href="https://dietify.app" target="_blank" rel="noopener">Dietify</a> using Flutter';
    assert.equal(bf(input), expected);
  });

  it('handles bold text adjacent to or inside links', () => {
    const input = '**Key Project**: [Portfolio](https://github.com/Hx-313)';
    const expected = '<strong>Key Project</strong>: <a class="cv-inline-link" href="https://github.com/Hx-313" target="_blank" rel="noopener">Portfolio</a>';
    assert.equal(bf(input), expected);
  });

  it('safely escapes HTML tags before injecting link anchor', () => {
    const input = '<img src=x onerror=alert(1)> [Safe Link](https://safe.com) & "quotes"';
    const result = bf(input);
    assert.ok(!result.includes('<img'));
    assert.ok(result.includes('&lt;img'));
    assert.ok(result.includes('<a class="cv-inline-link" href="https://safe.com" target="_blank" rel="noopener">Safe Link</a>'));
  });

  it('handles multiple links in a single bullet point', () => {
    const input = 'Worked on [Dietify](https://dietify.app) and [eBill](https://ebill.com)';
    const result = bf(input);
    assert.ok(result.includes('href="https://dietify.app"'));
    assert.ok(result.includes('href="https://ebill.com"'));
  });
});
