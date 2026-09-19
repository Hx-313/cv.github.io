import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function sanitizeSyncKey(key) {
  if (!key) return '';
  return key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

function prepareSyncPayload(data) {
  return JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    resume: data
  });
}

function parseRemotePayload(rawText, currentLocalTime) {
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || !parsed.resume) return null;
    const remoteTime = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 0;
    const isNewer = remoteTime > currentLocalTime;
    return {
      isValid: true,
      isNewer,
      updatedAt: parsed.updatedAt,
      resume: parsed.resume
    };
  } catch (e) {
    return null;
  }
}

describe('Remote Cloud Sync (Option A)', () => {
  it('sanitizes user input for valid key slug', () => {
    assert.equal(sanitizeSyncKey('Ali Abdullah #313!'), 'aliabdullah313');
    assert.equal(sanitizeSyncKey('  my-KEY_2026  '), 'my-key_2026');
    assert.equal(sanitizeSyncKey(''), '');
  });

  it('formats payload with timestamp, version, and resume data', () => {
    const sampleData = { name: 'Hafiz Ali Abdullah', title: 'Flutter Specialist' };
    const raw = prepareSyncPayload(sampleData);
    const parsed = JSON.parse(raw);
    assert.equal(parsed.version, 1);
    assert.equal(parsed.resume.name, 'Hafiz Ali Abdullah');
    assert.ok(parsed.updatedAt);
  });

  it('correctly compares timestamps between local and remote versions', () => {
    const localTime = new Date('2026-09-19T10:00:00Z').getTime();
    const newerRemote = JSON.stringify({
      version: 1,
      updatedAt: '2026-09-19T12:00:00Z',
      resume: { name: 'Updated on Work PC' }
    });
    const olderRemote = JSON.stringify({
      version: 1,
      updatedAt: '2026-09-19T08:00:00Z',
      resume: { name: 'Old version' }
    });

    const newerRes = parseRemotePayload(newerRemote, localTime);
    assert.ok(newerRes && newerRes.isNewer);

    const olderRes = parseRemotePayload(olderRemote, localTime);
    assert.ok(olderRes && !olderRes.isNewer);
  });
});
