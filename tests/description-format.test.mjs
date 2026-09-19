import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function renderJobContent(job, bf = s => s) {
  const format = job.format || 'bullets';
  let html = '';
  const buls = (job.bullets || []).filter(b => (b || '').trim());

  if (format === 'paragraph' || format === 'both') {
    if (job.paragraph) {
      html += '<div class="cv-jcd">' + bf(job.paragraph) + '</div>';
    } else if (job.desc && format === 'paragraph') {
      html += '<div class="cv-jcd">' + bf(job.desc) + '</div>';
    }
  }

  if (format === 'bullets' || format === 'both') {
    if (buls.length) {
      html += '<ul>' + buls.map(b => '<li>' + bf(b) + '</li>').join('') + '</ul>';
    }
  }
  return html;
}

describe('Description format switcher (Paragraph vs Bullets)', () => {
  it('renders only bullets when format is bullets', () => {
    const job = {
      format: 'bullets',
      paragraph: 'This is narrative text',
      bullets: ['Bullet 1', 'Bullet 2']
    };
    const html = renderJobContent(job);
    assert.ok(html.includes('<ul><li>Bullet 1</li><li>Bullet 2</li></ul>'));
    assert.ok(!html.includes('cv-jcd'));
  });

  it('renders only paragraph when format is paragraph', () => {
    const job = {
      format: 'paragraph',
      paragraph: 'Specialized in large-scale mobile applications with [Dietify](https://dietify.app).',
      bullets: ['Bullet 1']
    };
    const html = renderJobContent(job);
    assert.ok(html.includes('<div class="cv-jcd">Specialized in large-scale'));
    assert.ok(!html.includes('<ul>'));
  });

  it('renders both when format is both', () => {
    const job = {
      format: 'both',
      paragraph: 'Overview of the enterprise system.',
      bullets: ['Achievement 1', 'Achievement 2']
    };
    const html = renderJobContent(job);
    assert.ok(html.includes('<div class="cv-jcd">Overview of the enterprise system.</div>'));
    assert.ok(html.includes('<ul><li>Achievement 1</li><li>Achievement 2</li></ul>'));
  });

  it('defaults to bullets when format property is not set', () => {
    const job = {
      bullets: ['Old bullet format']
    };
    const html = renderJobContent(job);
    assert.ok(html.includes('<ul><li>Old bullet format</li></ul>'));
  });
});
