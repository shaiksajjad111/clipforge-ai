// ClipForge AI - pure helper functions (no DOM, no FFmpeg instance).
// Kept separate from main.js so the logic can be unit-tested in Node.

export const MAX_MANUAL_CLIP_SECONDS = 180;
export const MAX_SOURCE_BYTES = 500 * 1024 * 1024;
export const WARN_SOURCE_BYTES = 250 * 1024 * 1024;

export const EFFECTS = {
  normal: 'Original look, no visual modification.',
  cinematic: 'Rich teal shadows, warm highlights, film contrast and vignette.',
  zoom: 'Dynamic smooth 18% push-in with a gentle centre crop.',
  fade: 'Smooth fade in and out for picture and sound.',
  vibrant: 'High-energy social look: vivid colour, crisp detail and stronger contrast.',
  warm: 'Golden-hour warmth with glowing highlights and soft contrast.',
  noir: 'High-contrast black and white with a dramatic film finish.',
  retro: 'Vintage film colour, lifted blacks, warm tint and subtle grain.',
  dreamy: 'Soft glow, pastel colour and gentle vignette.',
  punch: 'Crisp creator look with sharpened detail and saturated colour.'
};

// ---------------------------------------------------------------------------
// Timestamps
// ---------------------------------------------------------------------------

/**
 * Parse "35", "35.5", "1:05", "1:05.5", "01:02:03" or "01:02:03.25".
 * Returns { ok: true, seconds } or { ok: false, error }.
 */
export function parseTimestamp(text, label = 'Time') {
  const value = String(text ?? '').trim();
  if (!value) return { ok: false, error: `${label} is empty. Enter seconds (e.g. 5) or HH:MM:SS.` };
  if (value.startsWith('-')) return { ok: false, error: `${label} cannot be negative.` };

  const bad = { ok: false, error: `${label} "${value}" is not valid. Use seconds (35), MM:SS (1:05) or HH:MM:SS (00:01:05).` };

  let match = value.match(/^(\d+(?:\.\d+)?)$/);
  if (match) return { ok: true, seconds: Number(match[1]) };

  match = value.match(/^(\d+):([0-5]?\d(?:\.\d+)?)$/);
  if (match) return { ok: true, seconds: Number(match[1]) * 60 + Number(match[2]) };

  match = value.match(/^(\d+):([0-5]?\d):([0-5]?\d(?:\.\d+)?)$/);
  if (match) return { ok: true, seconds: Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) };

  return bad;
}

/** HH:MM:SS, with one decimal only when the value is fractional. */
export function formatClock(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const tenths = Math.round(safe * 10);
  const whole = Math.floor(tenths / 10);
  const frac = tenths % 10;
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  const base = [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
  return frac ? `${base}.${frac}` : base;
}

/** Compact label for file names, e.g. 83.5 -> "01m23s". */
export function fileStamp(seconds) {
  const whole = Math.floor(Math.max(0, seconds));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`;
}

/**
 * Validate a manual clip range.
 * duration may be null (YouTube: length unknown).
 */
export function validateRange(startText, endText, duration, { maxLength = null } = {}) {
  const start = parseTimestamp(startText, 'Start time');
  if (!start.ok) return { ok: false, error: start.error };
  const end = parseTimestamp(endText, 'End time');
  if (!end.ok) return { ok: false, error: end.error };

  if (end.seconds <= start.seconds) {
    return { ok: false, error: 'End time must be greater than start time.' };
  }
  if (Number.isFinite(duration)) {
    if (start.seconds >= duration) {
      return { ok: false, error: `Start time is beyond the end of the video (${formatClock(duration)}).` };
    }
    if (end.seconds > duration + 0.05) {
      return { ok: false, error: `End time exceeds the video length (${formatClock(duration)}).` };
    }
  }
  const length = end.seconds - start.seconds;
  if (maxLength && length > maxLength) {
    return { ok: false, error: `Please select a clip of ${maxLength / 60} minutes or less (browser processing limit).` };
  }
  const clampedEnd = Number.isFinite(duration) ? Math.min(end.seconds, duration) : end.seconds;
  return { ok: true, start: start.seconds, end: clampedEnd, length: clampedEnd - start.seconds };
}

// ---------------------------------------------------------------------------
// YouTube
// ---------------------------------------------------------------------------

export function getYouTubeId(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    let id = '';

    if (host === 'youtu.be') {
      id = parsed.pathname.slice(1).split('/')[0];
    } else if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com') {
      if (parsed.pathname === '/watch') {
        id = parsed.searchParams.get('v') || '';
      } else {
        const match = parsed.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
        id = match ? match[1] : '';
      }
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Reads t= / start= from a YouTube URL ("90", "90s", "1m30s", "1h2m3s"). */
export function getYouTubeStart(url) {
  try {
    const parsed = new URL(url);
    const raw = parsed.searchParams.get('t') || parsed.searchParams.get('start') || '';
    if (!raw) return 0;
    if (/^\d+$/.test(raw)) return Number(raw);
    const match = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if (!match) return 0;
    return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
  } catch {
    return 0;
  }
}

export function youtubeWatchLink(id, start) {
  return `https://www.youtube.com/watch?v=${id}&t=${Math.floor(start)}s`;
}

export function youtubeEmbedLink(id, start, end, autoplay = false) {
  const params = new URLSearchParams({ start: String(Math.floor(start)), end: String(Math.ceil(end)), rel: '0' });
  if (autoplay) params.set('autoplay', '1');
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Output geometry + FFmpeg filters
// ---------------------------------------------------------------------------

const even = n => Math.max(2, Math.round(n / 2) * 2);

/** Output size in pixels. Always even (required by yuv420p / libx264). */
export function getOutputSize(format, srcW, srcH) {
  if (format === '9:16') return { w: 720, h: 1280 };
  if (format === '1:1') return { w: 720, h: 720 };
  let w = Number(srcW) || 0;
  let h = Number(srcH) || 0;
  if (w < 2 || h < 2) throw new Error('The source video size is unknown, so the original ratio cannot be exported.');
  const longSide = Math.max(w, h);
  if (longSide > 1920) {
    const k = 1920 / longSide;
    w *= k;
    h *= k;
  }
  return { w: even(w), h: even(h) };
}

export function fadeLength(duration) {
  return Number(Math.min(duration / 3, Math.min(1, Math.max(0.3, duration * 0.08))).toFixed(2));
}

/**
 * Returns the ordered list of video filters.
 * Order: geometry (ratio) -> effect -> pixel format.
 */
export function buildVideoFilters({ format, fit = 'crop', effect = 'normal', duration, srcW, srcH }) {
  if (!(duration > 0)) throw new Error('Clip duration must be greater than zero.');
  if (!(effect in EFFECTS)) throw new Error(`Unknown effect "${effect}".`);
  const { w, h } = getOutputSize(format, srcW, srcH);
  const filters = [];

  // 1. Geometry - never stretches the picture.
  if (format === 'original') {
    filters.push(`scale=${w}:${h}:flags=bicubic`);
  } else if (fit === 'pad') {
    filters.push(
      `scale=${w}:${h}:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=bicubic`,
      `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black`
    );
  } else {
    filters.push(
      `scale=${w}:${h}:force_original_aspect_ratio=increase:force_divisible_by=2:flags=bicubic`,
      `crop=${w}:${h}`
    );
  }
  filters.push('setsar=1');

  // 2. Effect.
  if (effect === 'cinematic') {
    filters.push(
      'eq=contrast=1.08:saturation=1.08:gamma=0.97',
      'colorbalance=rs=-0.03:bs=0.04:rh=0.03:bh=-0.03'
    );
  } else if (effect === 'zoom') {
    const progress = `min(t/${duration.toFixed(3)},1)`;
    const zoom = `(1+0.18*${progress})`;
    filters.push(
      `scale=w='2*trunc(${w}*${zoom}/2)':h='2*trunc(${h}*${zoom}/2)':eval=frame:flags=bicubic`,
      `crop=${w}:${h}`
    );
  } else if (effect === 'fade') {
    const f = fadeLength(duration);
    filters.push(`fade=t=in:st=0:d=${f}`, `fade=t=out:st=${Math.max(0, duration - f).toFixed(3)}:d=${f}`);
  } else if (effect === 'vibrant') {
    filters.push('eq=contrast=1.22:saturation=1.48:gamma=0.96', 'unsharp=5:5:1.0:5:5:0.0', 'vignette=PI/5');
  } else if (effect === 'warm') {
    filters.push('eq=contrast=1.10:saturation=1.28:gamma=1.04', 'colorbalance=rs=0.12:gs=0.03:bs=-0.10:rh=0.10:gh=0.02:bh=-0.08', 'vignette=PI/6');
  } else if (effect === 'noir') {
    filters.push('hue=s=0', 'eq=contrast=1.42:brightness=-0.025', 'unsharp=5:5:0.7:5:5:0.0', 'vignette=PI/4');
  } else if (effect === 'retro') {
    filters.push('eq=contrast=0.92:saturation=0.78:gamma=1.08', 'colorbalance=rs=0.10:gs=0.02:bs=-0.10:rm=0.04:bm=-0.04', 'noise=alls=8:allf=t+u', 'vignette=PI/5');
  } else if (effect === 'dreamy') {
    filters.push('eq=contrast=0.90:saturation=1.16:brightness=0.025', 'gblur=sigma=0.7', 'vignette=PI/7');
  } else if (effect === 'punch') {
    filters.push('eq=contrast=1.28:saturation=1.32:gamma=0.94', 'unsharp=7:7:1.35:7:7:0.0');
  }

  // 3. Pixel format for broad MP4 compatibility.
  filters.push('format=yuv420p');
  return filters;
}

export function buildAudioFilters({ effect, duration }) {
  if (effect !== 'fade') return [];
  const f = fadeLength(duration);
  return [`afade=t=in:st=0:d=${f}`, `afade=t=out:st=${Math.max(0, duration - f).toFixed(3)}:d=${f}`];
}

/**
 * Full FFmpeg argument list for one clip.
 * hasAudio: true  -> audio is mapped (and faded for the Fade effect)
 *           false -> no audio stream in the source
 *           null  -> unknown: audio is mapped if it exists, but not filtered
 */
export function makeExportArgs({ inputName, outputName, start, duration, format, fit, effect, srcW, srcH, hasAudio = null }) {
  const video = buildVideoFilters({ format, fit, effect, duration, srcW, srcH });
  const args = [
    '-ss', Number(start).toFixed(3),
    '-i', inputName,
    '-t', Number(duration).toFixed(3),
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-sn', '-dn',
    '-vf', video.join(',')
  ];
  if (hasAudio === true) {
    const audio = buildAudioFilters({ effect, duration });
    if (audio.length) args.push('-af', audio.join(','));
  }
  args.push(
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-ac', '2',
    '-movflags', '+faststart',
    '-max_muxing_queue_size', '1024',
    '-y', outputName
  );
  return args;
}

// ---------------------------------------------------------------------------
// Random clip planner
// ---------------------------------------------------------------------------

/**
 * Picks non-overlapping random sections.
 * Method: with n clips of length d in a video of length T, the free space is
 * T - n*d. Draw n random offsets in the free space, sort them and add i*d.
 * That is uniformly random and guarantees no overlap and nothing past T.
 * If the video cannot hold `count` clips without overlap, fewer clips are made
 * (reduced = true) rather than overlapping them.
 */
export function planRandomClips(total, duration, count, rng = Math.random) {
  if (!Number.isFinite(total) || total <= 0) {
    return { ok: false, error: 'The video length is not known yet.' };
  }
  if (total < duration) {
    return { ok: false, error: `This video is only ${formatClock(total)} long, which is shorter than the ${duration}-second clips you selected. Choose a shorter clip duration.` };
  }
  const fits = Math.floor(total / duration + 1e-9);
  const n = Math.min(count, fits);
  const free = total - n * duration;
  const offsets = Array.from({ length: n }, () => rng() * free).sort((a, b) => a - b);
  const clips = offsets.map((offset, i) => {
    const start = Math.floor((offset + i * duration) * 10) / 10;
    return { start, end: start + duration };
  });
  return { ok: true, clips, reduced: n < count, fits };
}
