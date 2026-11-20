// Run with: npm test   (Node 18+; no browser or FFmpeg needed)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTimestamp, formatClock, validateRange, getYouTubeId, getYouTubeStart,
  youtubeWatchLink, youtubeEmbedLink, getOutputSize, buildVideoFilters,
  buildAudioFilters, makeExportArgs, planRandomClips
} from '../src/clipTools.js';
import { createZip, crc32 } from '../src/zip.js';

test('parseTimestamp accepts seconds, MM:SS and HH:MM:SS', () => {
  assert.equal(parseTimestamp('5').seconds, 5);
  assert.equal(parseTimestamp('35.5').seconds, 35.5);
  assert.equal(parseTimestamp('1:05').seconds, 65);
  assert.equal(parseTimestamp('01:02:03').seconds, 3723);
  assert.equal(parseTimestamp(' 00:00:35.25 ').seconds, 35.25);
});

test('parseTimestamp rejects empty, negative and malformed input', () => {
  for (const bad of ['', '   ', '-5', 'abc', '1:75', '1:2:3:4', '1,5', '00:61:00']) {
    assert.equal(parseTimestamp(bad).ok, false, `"${bad}" should be rejected`);
  }
  assert.match(parseTimestamp('-5', 'Start time').error, /negative/);
});

test('formatClock', () => {
  assert.equal(formatClock(0), '00:00:00');
  assert.equal(formatClock(65), '00:01:05');
  assert.equal(formatClock(3723.5), '01:02:03.5');
});

test('validateRange: example 5s -> 35s is a 30 second clip', () => {
  const r = validateRange('5', '35', 120);
  assert.equal(r.ok, true);
  assert.equal(r.length, 30);
});

test('validateRange rules', () => {
  assert.equal(validateRange('-1', '10', 60).ok, false);
  assert.equal(validateRange('10', '10', 60).ok, false);
  assert.equal(validateRange('20', '10', 60).ok, false);
  assert.match(validateRange('0', '61', 60).error, /exceeds the video length/);
  assert.equal(validateRange('', '10', 60).ok, false);
  assert.equal(validateRange('0', '', 60).ok, false);
  assert.equal(validateRange('0', '200', 600, { maxLength: 180 }).ok, false);
  assert.equal(validateRange('5', '9999', null).ok, true);          // YouTube: length unknown
});

test('YouTube id extraction', () => {
  const id = 'dQw4w9WgXcQ';
  for (const url of [
    `https://www.youtube.com/watch?v=${id}`, `https://youtu.be/${id}?t=10`, `https://youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`, `https://m.youtube.com/watch?v=${id}&list=x`, `https://www.youtube.com/live/${id}`
  ]) assert.equal(getYouTubeId(url), id, url);
  for (const url of ['https://example.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=short', 'not a url', 'https://evilyoutube.com/watch?v=dQw4w9WgXcQ']) {
    assert.equal(getYouTubeId(url), null, url);
  }
  assert.equal(getYouTubeStart('https://youtu.be/dQw4w9WgXcQ?t=90'), 90);
  assert.equal(getYouTubeStart('https://youtu.be/dQw4w9WgXcQ?t=1m30s'), 90);
  assert.equal(getYouTubeStart('https://youtu.be/dQw4w9WgXcQ'), 0);
  assert.equal(youtubeWatchLink(id, 12.9), `https://www.youtube.com/watch?v=${id}&t=12s`);
  assert.match(youtubeEmbedLink(id, 5, 35.2), /start=5&end=36/);
});

test('output sizes are always even and never exceed 1920', () => {
  assert.deepEqual(getOutputSize('9:16', 1, 1), { w: 720, h: 1280 });
  assert.deepEqual(getOutputSize('1:1', 1, 1), { w: 720, h: 720 });
  assert.deepEqual(getOutputSize('original', 853, 479), { w: 854, h: 480 });
  const big = getOutputSize('original', 3840, 2160);
  assert.deepEqual(big, { w: 1920, h: 1080 });
  assert.throws(() => getOutputSize('original', 0, 0));
});

test('every effect adds its own filter, and Normal adds none', () => {
  const base = { format: '9:16', fit: 'crop', duration: 10, srcW: 1280, srcH: 720 };
  const join = effect => buildVideoFilters({ ...base, effect }).join(',');
  assert.ok(!/eq=|fade=|eval=frame/.test(join('normal')));
  assert.match(join('cinematic'), /eq=contrast/);
  assert.match(join('zoom'), /eval=frame/);
  assert.match(join('fade'), /fade=t=in.*fade=t=out/);
  assert.match(join('fade'), /fade=t=out:st=9\./);   // out-fade starts before the end
  assert.deepEqual(buildAudioFilters({ effect: 'normal', duration: 10 }), []);
  assert.equal(buildAudioFilters({ effect: 'fade', duration: 10 }).length, 2);
  assert.throws(() => buildVideoFilters({ ...base, effect: 'nope' }));
});

test('makeExportArgs puts the effect in -vf and keeps audio mapping optional', () => {
  const args = makeExportArgs({ inputName: 'i.mp4', outputName: 'o.mp4', start: 5, duration: 30, format: '9:16', fit: 'crop', effect: 'fade', srcW: 1920, srcH: 1080, hasAudio: true });
  assert.equal(args[args.indexOf('-ss') + 1], '5.000');
  assert.equal(args[args.indexOf('-t') + 1], '30.000');
  assert.ok(args[args.indexOf('-vf') + 1].includes('fade=t=in'));
  assert.ok(args.includes('-af'));
  assert.ok(args.includes('0:a:0?'));
  const noAudio = makeExportArgs({ inputName: 'i.mp4', outputName: 'o.mp4', start: 0, duration: 5, format: 'original', effect: 'fade', srcW: 640, srcH: 360, hasAudio: false });
  assert.ok(!noAudio.includes('-af'));
});

test('planRandomClips: in range, non-overlapping, sorted', () => {
  for (let run = 0; run < 500; run++) {
    const total = 60 + Math.random() * 900;
    const duration = [15, 30, 45, 60][run % 4];
    const count = [1, 3, 5, 10][run % 3 + (run % 2)] ?? 3;
    const plan = planRandomClips(total, duration, count);
    if (total < duration) { assert.equal(plan.ok, false); continue; }
    assert.equal(plan.ok, true);
    assert.ok(plan.clips.length >= 1 && plan.clips.length <= count);
    assert.equal(plan.reduced, plan.clips.length < count);
    plan.clips.forEach((c, i) => {
      assert.ok(c.start >= 0, 'start >= 0');
      assert.ok(c.end <= total + 1e-9, `end ${c.end} within ${total}`);
      if (i) assert.ok(c.start >= plan.clips[i - 1].end - 1e-9, 'no overlap');
    });
  }
});

test('planRandomClips: shorter than clip -> helpful error; exact fit works', () => {
  const short = planRandomClips(20, 30, 3);
  assert.equal(short.ok, false);
  assert.match(short.error, /shorter than the 30-second/);
  const exact = planRandomClips(90, 30, 3);
  assert.deepEqual(exact.clips.map(c => c.start), [0, 30, 60]);
  assert.equal(planRandomClips(100, 60, 10).clips.length, 1);
});

test('createZip produces a structurally valid archive', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  const files = [{ name: 'a.mp4', data: new Uint8Array([1, 2, 3]) }, { name: 'clip-é.mp4', data: new Uint8Array(1000).fill(7) }];
  return createZip(files).arrayBuffer().then(buffer => {
    const view = new DataView(buffer);
    assert.equal(view.getUint32(0, true), 0x04034b50);
    const end = buffer.byteLength - 22;
    assert.equal(view.getUint32(end, true), 0x06054b50);
    assert.equal(view.getUint16(end + 10, true), 2);
  });
});
