import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function decomposeExperience(jobs) {
  const blocks = [];
  if (!jobs || !jobs.length) return blocks;

  blocks.push({ type: 'section-title', section: 'jobs', html: '<div class="sec-ttl">Experience</div>' });

  jobs.forEach((j, jIdx) => {
    const fmt = j.format || 'bullets';
    const buls = (j.bullets || []).filter(b => (b || '').trim());
    const para = j.paragraph || (fmt === 'paragraph' ? j.desc : '');

    // Header block with title, company, meta, and paragraph (if applicable)
    blocks.push({
      type: 'job-header',
      section: 'jobs',
      jobIndex: jIdx,
      job: j,
      hasParagraph: !!para,
      paragraph: para
    });

    // Individual bullet blocks
    if (fmt === 'bullets' || fmt === 'both') {
      buls.forEach((b, bIdx) => {
        blocks.push({
          type: 'job-bullet',
          section: 'jobs',
          jobIndex: jIdx,
          bulletIndex: bIdx,
          totalBullets: buls.length,
          bulletText: b
        });
      });
    }
  });

  return blocks;
}

function assembleJobBlocks(pageBlocks) {
  let html = '';
  let i = 0;
  while (i < pageBlocks.length) {
    const block = pageBlocks[i];
    if (block.type === 'section-title') {
      html += block.html;
      i++;
    } else if (block.type === 'job-header' || block.type === 'job-bullet') {
      const currentJobIndex = block.jobIndex;
      const jobBlocks = [];
      while (i < pageBlocks.length && pageBlocks[i].jobIndex === currentJobIndex) {
        jobBlocks.push(pageBlocks[i]);
        i++;
      }

      const hasHeader = jobBlocks.some(b => b.type === 'job-header');
      const headerBlock = jobBlocks.find(b => b.type === 'job-header');
      const bullets = jobBlocks.filter(b => b.type === 'job-bullet');

      let jh = '<div class="cv-job' + (!hasHeader ? ' cv-job-cont' : '') + '">';
      if (hasHeader && headerBlock) {
        jh += '<div class="cv-jt">' + headerBlock.job.title + '</div>';
        jh += '<div class="cv-jc">' + headerBlock.job.company + '</div>';
        if (headerBlock.paragraph) jh += '<div class="cv-jcd">' + headerBlock.paragraph + '</div>';
      } else if (!hasHeader && bullets.length) {
        jh += '<div class="cv-jmeta cv-cont-lbl">Continued...</div>';
      }

      if (bullets.length) {
        jh += '<ul>' + bullets.map(b => '<li>' + b.bulletText + '</li>').join('') + '</ul>';
      }
      jh += '</div>';
      html += jh;
    } else {
      html += block.html || '';
      i++;
    }
  }
  return html;
}

describe('Granular Experience Pagination Decomposition', () => {
  it('decomposes experience into header and bullet sub-blocks', () => {
    const jobs = [
      {
        title: 'Flutter Developer',
        company: 'TeraMob',
        bullets: ['Bullet 1', 'Bullet 2', 'Bullet 3']
      }
    ];
    const blocks = decomposeExperience(jobs);
    assert.equal(blocks.length, 5); // 1 section-title + 1 header + 3 bullets
    assert.equal(blocks[0].type, 'section-title');
    assert.equal(blocks[1].type, 'job-header');
    assert.equal(blocks[2].type, 'job-bullet');
    assert.equal(blocks[4].bulletIndex, 2);
  });

  it('assembles a job split across pages cleanly', () => {
    const jobs = [
      {
        title: 'Flutter Developer',
        company: 'TeraMob',
        bullets: ['Bullet 1', 'Bullet 2', 'Bullet 3']
      }
    ];
    const blocks = decomposeExperience(jobs);

    // Page 1 gets header + bullet 1 + bullet 2
    const page1Blocks = [blocks[0], blocks[1], blocks[2], blocks[3]];
    const page1Html = assembleJobBlocks(page1Blocks);
    assert.ok(page1Html.includes('Flutter Developer'));
    assert.ok(page1Html.includes('<li>Bullet 1</li><li>Bullet 2</li>'));
    assert.ok(!page1Html.includes('Bullet 3'));

    // Page 2 gets bullet 3 (continuation)
    const page2Blocks = [blocks[4]];
    const page2Html = assembleJobBlocks(page2Blocks);
    assert.ok(page2Html.includes('cv-job-cont'));
    assert.ok(page2Html.includes('<li>Bullet 3</li>'));
  });
});
