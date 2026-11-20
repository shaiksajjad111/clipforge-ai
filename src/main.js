
import './style.css';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

const app = document.querySelector('#app');

app.innerHTML = `
<header class="navbar">
  <a class="brand" href="#">✂ ClipForge <span>AI</span></a>
  <nav><a href="#editor">Editor</a><a href="#features">Features</a></nav>
  <span class="free-badge">100% FREE</span>
</header>

<main>
  <section class="hero">
    <div class="eyebrow">✦ YOUR FREE AI VIDEO STUDIO</div>
    <h1>Long videos.<br><span>Short-form magic.</span></h1>
    <p>Turn long videos into engaging vertical clips with AI-powered subtitles.</p>
  </section>

  <section class="editor" id="editor">
    <div class="section-heading">
      <div><span class="step-label">YOUR WORKSPACE</span><h2>Video Studio</h2></div>
      <span class="status" id="status">Ready to start</span>
    </div>

    <div class="import-panel">
      <div class="import-tabs">
        <button class="import-tab active" data-tab="upload">↑ Upload Video</button>
        <button class="import-tab" data-tab="direct">↗ Video URL</button>
        <button class="import-tab" data-tab="youtube">▶ YouTube</button>
      </div>

      <div class="import-content" id="uploadTab">
        <label class="upload-area" for="videoInput" id="uploadArea">
          <div class="upload-icon">↑</div>
          <h3>Drop your video here</h3>
          <p>or click to browse your computer</p>
          <span class="file-info">MP4, MOV, WEBM supported</span>
          <input type="file" id="videoInput" accept="video/*" hidden />
        </label>
      </div>

      <div class="import-content hidden" id="directTab">
        <h3>Import from direct video URL</h3>
        <p>Paste a direct link to an accessible MP4 or WebM file.</p>
        <div class="url-input-row">
          <input type="url" id="directUrl" placeholder="https://example.com/video.mp4" />
          <button id="importDirect" class="import-btn">Import</button>
        </div>
        <p class="import-note">Use a direct .mp4, .webm or other browser-accessible video file URL. Ordinary webpage links are not direct video URLs; the host must allow CORS.</p>
      </div>

      <div class="import-content hidden" id="youtubeTab">
        <h3>Preview a YouTube video</h3>
        <p>Paste a YouTube video link to preview it here.</p>
        <div class="url-input-row">
          <input type="url" id="youtubeUrl" placeholder="https://www.youtube.com/watch?v=..." />
          <button id="previewYoutube" class="import-btn">Preview</button>
        </div>
        <p class="import-note">Preview only. Upload an authorized video file separately to edit it.</p>
      </div>
    </div>

    <div class="workspace hidden" id="workspace">
      <div class="video-container">
        <video id="videoPreview" controls playsinline></video>
        <iframe id="youtubePreview" class="hidden"
          title="YouTube video preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>

      <p id="youtubeNotice" class="import-note hidden">
        YouTube preview mode. You can preview a selected time range and copy its YouTube link.
        To export an MP4, upload an authorised video file or use a direct video-file URL.
      </p>
      <div id="youtubeActions" class="youtube-actions hidden">
        <button class="import-btn" id="previewYoutubeSegment" type="button">▶ Preview selected YouTube segment</button>
        <button class="import-btn" id="copyYoutubeSegment" type="button">Copy segment link</button>
      </div>

      <div class="video-details">
        <div><span class="step-label">SOURCE VIDEO</span><h3 id="fileName">Your video</h3></div>
        <span id="durationLabel">00:00</span>
      </div>

      <div class="controls">
        <div class="field">
          <label for="startTime">Start time (seconds)</label>
          <input type="number" id="startTime" value="0" min="0" step="0.1" />
        </div>
        <div class="field">
          <label for="endTime">End time (seconds)</label>
          <input type="number" id="endTime" value="15" min="0.1" step="0.1" />
        </div>
      </div>

      <div class="field">
        <label>Output format</label>
        <div class="format-options">
          <label><input type="radio" name="format" value="9:16" checked /> 9:16 Shorts</label>
          <label><input type="radio" name="format" value="original" /> Original ratio</label>
        </div>
      </div>

      <div class="field effect-field">
        <label for="manualEffect">Video effect</label>
        <select id="manualEffect" class="effect-select">
          <option value="normal">Normal — original look</option>
          <option value="cinematic">Cinematic — subtle colour</option>
          <option value="zoom">Smooth zoom</option>
          <option value="fade">Fade in and out</option>
        </select>
        <p class="import-note">Preview the exported clip before downloading.</p>
      </div>

      <button class="primary-btn" id="createClip">✦ Create my clip</button>

      <section class="random-panel" id="randomPanel">
        <div class="random-heading">
          <span class="step-label">QUICK CLIPS</span>
          <h2>Random Clip Generator</h2>
          <p>Generate different sections from your video. Choose the duration and how many clips you want.</p>
        </div>
        <div class="random-controls">
          <div class="field">
            <label for="randomDuration">Each clip duration</label>
            <select id="randomDuration" class="effect-select">
              <option value="15">15 seconds</option>
              <option value="30" selected>30 seconds</option>
              <option value="45">45 seconds</option>
              <option value="60">60 seconds</option>
            </select>
          </div>
          <div class="field">
            <label for="randomCount">Number of clips</label>
            <select id="randomCount" class="effect-select">
              <option value="1">1 clip</option>
              <option value="3" selected>3 clips</option>
              <option value="5">5 clips</option>
              <option value="10">10 clips</option>
            </select>
          </div>
          <div class="field">
            <label for="randomEffect">Effect for generated clips</label>
            <select id="randomEffect" class="effect-select">
              <option value="normal">Normal — original look</option>
              <option value="cinematic">Cinematic — subtle colour</option>
              <option value="zoom">Smooth zoom</option>
              <option value="fade">Fade in and out</option>
            </select>
          </div>
        </div>
        <button class="primary-btn secondary-action" id="generateRandomClips">✦ Generate random clips</button>
        <div class="progress-wrap hidden" id="randomProgressWrap">
          <div class="progress-track"><div id="randomProgressBar"></div></div>
          <p id="randomProgressText">Preparing clips...</p>
        </div>
        <div id="randomResults" class="random-results"></div>
      </section>

      <div class="progress-wrap hidden" id="progressWrap">
        <div class="progress-track"><div id="progressBar"></div></div>
        <p id="progressText">Preparing video...</p>
      </div>

      <section id="subtitlePanel" style="
        margin-top:28px;padding:22px;border:1px solid #34343d;
        border-radius:14px;background:#17171d;">
        <div style="margin-bottom:16px">
          <span class="step-label">WHISPER AI</span>
          <h2 style="margin:7px 0">Automatic subtitles</h2>
          <p style="color:#aaa;font-size:14px">
            Generate subtitles from the speech in your uploaded video.
          </p>
        </div>

        <button id="generateSubtitles" class="primary-btn" style="width:100%">
          ✦ Generate AI subtitles
        </button>

        <div id="aiProgress" style="display:none;margin-top:15px">
          <div class="progress-track"><div id="aiProgressBar"></div></div>
          <p id="aiProgressText" style="color:#aaa;margin-top:8px;font-size:13px">
            Preparing AI...
          </p>
        </div>

        <div id="subtitleEditor" style="display:none;margin-top:20px">
          <h3 style="margin-bottom:12px">Edit your subtitles</h3>
          <div id="subtitleList"></div>
          <button id="downloadSrt" class="download-btn" style="
            display:inline-block;margin-top:15px;border:0;cursor:pointer;">
            ↓ Download subtitles (SRT)
          </button>
        </div>
      </section>

      <div class="result hidden" id="result">
        <h3>✓ Your clip is ready!</h3>
        <video id="resultPreview" controls playsinline></video>
        <a id="downloadBtn" class="download-btn" download="clipforge-short.mp4">
          ↓ Download MP4
        </a>
      </div>
    </div>
  </section>

  <section class="features" id="features">
    <div class="section-heading">
      <div><span class="step-label">WHY CLIPFORGE?</span><h2>Everything you need</h2></div>
    </div>
    <div class="feature-grid">
      <article class="feature-card"><span>✂</span><h3>Easy clipping</h3><p>Select the exact moments you want to turn into Shorts.</p></article>
      <article class="feature-card"><span>▯</span><h3>Vertical video</h3><p>Convert videos into a vertical 9:16 format.</p></article>
      <article class="feature-card"><span>✦</span><h3>AI subtitles</h3><p>Generate subtitles automatically using Whisper AI.</p></article>
    </div>
  </section>
</main>

<footer>
  <a class="brand" href="#">✂ ClipForge <span>AI</span></a>
  <p>Free video creation for everyone.</p>
  <p>© 2026 ClipForge AI</p>
</footer>
`;

const $ = selector => document.querySelector(selector);

const videoInput = $('#videoInput');
const videoPreview = $('#videoPreview');
const youtubePreview = $('#youtubePreview');
const workspace = $('#workspace');
const uploadArea = $('#uploadArea');
const createClipButton = $('#createClip');

let sourceFile = null;
let sourceUrl = null;
let resultUrl = null;
let ffmpeg = null;
let ffmpegLoaded = false;
let transcriber = null;
let subtitles = [];
let processing = false;
let transcribing = false;

function setStatus(message) {
  $('#status').textContent = message;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
}

function activateVideoFile(file) {
  if (!file || !file.type.startsWith('video/')) {
    alert('Please select a valid video file.');
    return;
  }

  if (file.size > 500 * 1024 * 1024) {
    alert('Please choose a video smaller than 500 MB.');
    return;
  }

  if (sourceUrl) URL.revokeObjectURL(sourceUrl);

  sourceFile = file;
  sourceUrl = URL.createObjectURL(file);
  subtitles = [];

  $('#subtitleEditor').style.display = 'none';
  $('#aiProgress').style.display = 'none';

  youtubePreview.src = '';
  youtubePreview.classList.add('hidden');
  videoPreview.classList.remove('hidden');
  $('#youtubeNotice').classList.add('hidden');

  videoPreview.src = sourceUrl;
  workspace.classList.remove('hidden');
  uploadArea.classList.add('compact');

  $('#fileName').textContent = file.name;
  $('#durationLabel').textContent = 'Loading video...';
  createClipButton.disabled = true;
  $('#result').classList.add('hidden');
  $('#randomResults').innerHTML = '';
  $('#youtubeActions').classList.add('hidden');
  $('#youtubeNotice').classList.add('hidden');

  setStatus('Video loaded; preparing preview...');
}

videoInput.addEventListener('change', () => {
  activateVideoFile(videoInput.files[0]);
});

videoPreview.addEventListener('loadedmetadata', () => {
  const duration = videoPreview.duration;

  $('#durationLabel').textContent = formatTime(duration);
  $('#startTime').max = duration;
  $('#endTime').max = duration;
  $('#endTime').value = Math.min(15, duration).toFixed(1);

  createClipButton.disabled = false;
  setStatus('Video ready to edit');
});

document.querySelectorAll('.import-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.import-tab').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.import-content').forEach(item => item.classList.add('hidden'));

    tab.classList.add('active');
    $(`#${tab.dataset.tab}Tab`).classList.remove('hidden');
  });
});

uploadArea.addEventListener('dragover', event => {
  event.preventDefault();
  uploadArea.classList.add('dragging');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragging');
});

uploadArea.addEventListener('drop', event => {
  event.preventDefault();
  uploadArea.classList.remove('dragging');

  const file = event.dataTransfer.files[0];

  if (file?.type.startsWith('video/')) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    videoInput.files = transfer.files;
    activateVideoFile(file);
  }
});

$('#importDirect').addEventListener('click', async () => {
  const url = $('#directUrl').value.trim();
  if (!url) return alert('Please paste a video URL.');

  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are supported.');
    }

    setStatus('Downloading source video...');
    const response = await fetch(url);

    if (!response.ok) throw new Error('Could not access this video.');

    const blob = await response.blob();
    if (!blob.size) throw new Error('The video URL returned an empty file.');
    if (blob.size > 500 * 1024 * 1024) throw new Error('Please use a video smaller than 500 MB.');
    const path = new URL(url).pathname.toLowerCase();
    const extension = path.endsWith('.webm') ? 'webm' : path.endsWith('.mov') ? 'mov' : path.endsWith('.m4v') ? 'm4v' : 'mp4';
    const mime = blob.type.startsWith('video/') ? blob.type : `video/${extension === 'mov' ? 'quicktime' : extension}`;
    activateVideoFile(new File([blob], `imported-video.${extension}`, { type: mime }));
  } catch (error) {
    console.error(error);
    setStatus('URL import failed');
    alert('Could not import this video. The link may not be direct, or its host may block browser access (CORS).');
  }
});

function getYouTubeId(url) {
  try {
    const parsed = new URL(url);
    let id = '';

    if (parsed.hostname === 'youtu.be') {
      id = parsed.pathname.slice(1);
    } else if (
      parsed.hostname === 'youtube.com' ||
      parsed.hostname.endsWith('.youtube.com')
    ) {
      if (parsed.pathname === '/watch') {
        id = parsed.searchParams.get('v') || '';
      } else {
        const match = parsed.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
        id = match ? match[1] : '';
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

$('#previewYoutube').addEventListener('click', () => {
  const id = getYouTubeId($('#youtubeUrl').value.trim());
  if (!id) return alert('Please enter a valid YouTube video URL.');

  sourceFile = null;
  createClipButton.disabled = true;

  videoPreview.pause();
  videoPreview.removeAttribute('src');
  videoPreview.load();
  videoPreview.classList.add('hidden');

  youtubePreview.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
  youtubePreview.classList.remove('hidden');

  workspace.classList.remove('hidden');
  $('#youtubeNotice').classList.remove('hidden');
  $('#youtubeActions').classList.remove('hidden');
  $('#fileName').textContent = 'YouTube preview';
  $('#durationLabel').textContent = 'Preview only';
  $('#result').classList.add('hidden');
  $('#randomResults').innerHTML = '';

  setStatus('YouTube preview loaded — MP4 export unavailable for embed URLs');
});

// Convert video audio into mono 16 kHz audio for Whisper.
async function extractAudio(file) {
  const audioContext = new AudioContext();
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(arrayBuffer);

    const channels = [];
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      channels.push(decoded.getChannelData(channel));
    }

    const mono = new Float32Array(decoded.length);

    for (let i = 0; i < decoded.length; i++) {
      let total = 0;
      for (const channel of channels) total += channel[i];
      mono[i] = total / channels.length;
    }

    const targetRate = 16000;
    const outputLength = Math.floor(mono.length * targetRate / decoded.sampleRate);
    const resampled = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const position = i * decoded.sampleRate / targetRate;
      const left = Math.floor(position);
      const right = Math.min(left + 1, mono.length - 1);
      const fraction = position - left;
      resampled[i] = mono[left] * (1 - fraction) + mono[right] * fraction;
    }

    return resampled;
  } finally {
    await audioContext.close();
  }
}

// Initialize Whisper only when the user requests subtitles.
async function loadWhisper() {
  if (transcriber) return transcriber;

  $('#aiProgress').style.display = 'block';
  $('#aiProgressText').textContent = 'Downloading Whisper AI model for the first time...';

  transcriber = await pipeline(
    'automatic-speech-recognition',
    'onnx-community/whisper-tiny',
    {
      dtype: 'q8',
      device: 'wasm',
      progress_callback: progress => {
        if (progress.status === 'progress' && progress.total) {
          const percent = Math.round(progress.progress || 0);
          $('#aiProgressBar').style.width = `${percent}%`;
          $('#aiProgressText').textContent =
            `Downloading AI model: ${percent}%`;
        } else if (progress.status === 'ready') {
          $('#aiProgressText').textContent = 'AI model ready.';
        }
      }
    }
  );

  return transcriber;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function renderSubtitles() {
  const list = $('#subtitleList');
  list.innerHTML = '';

  subtitles.forEach((item, index) => {
    const row = document.createElement('div');

    row.style.cssText =
      'display:grid;grid-template-columns:95px 1fr;gap:10px;margin:10px 0;align-items:center';

    const time = document.createElement('span');
    time.textContent = formatTime(item.start);
    time.style.cssText = 'font-size:12px;color:#aaa';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = item.text;
    input.style.cssText =
      'width:100%;padding:11px;border:1px solid #454550;border-radius:8px;background:#22222a;color:white';

    input.addEventListener('input', () => {
      subtitles[index].text = input.value;
    });

    row.append(time, input);
    list.appendChild(row);
  });

  $('#subtitleEditor').style.display = 'block';
}

function toSrtTime(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function createSrt() {
  return subtitles.map((item, index) => {
    const end = item.end ?? item.start + 3;

    return `${index + 1}\n${toSrtTime(item.start)} --> ${toSrtTime(end)}\n${item.text.trim()}\n`;
  }).join('\n');
}

$('#generateSubtitles').addEventListener('click', async () => {
  if (transcribing) return;

  if (!sourceFile) {
    return alert('Upload a video with speech first.');
  }

  if (videoPreview.duration > 600) {
    return alert('For this first version, please use a video of 10 minutes or less.');
  }

  transcribing = true;
  $('#generateSubtitles').disabled = true;
  $('#aiProgress').style.display = 'block';
  $('#aiProgressBar').style.width = '0%';
  $('#aiProgressText').textContent = 'Preparing audio...';

  try {
    setStatus('Generating AI subtitles...');

    const audio = await extractAudio(sourceFile);

    if (!audio.length) throw new Error('No usable audio was found.');

    const model = await loadWhisper();

    $('#aiProgressText').textContent = 'Whisper is listening to your video...';

    const output = await model(audio, {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5
    });

    const chunks = output.chunks || [];

    subtitles = chunks.map(chunk => ({
      start: Array.isArray(chunk.timestamp) ? chunk.timestamp[0] ?? 0 : 0,
      end: Array.isArray(chunk.timestamp) ? chunk.timestamp[1] ?? 0 : 0,
      text: (chunk.text || '').trim()
    })).filter(item => item.text);

    if (!subtitles.length && output.text?.trim()) {
      subtitles = [{
        start: 0,
        end: videoPreview.duration,
        text: output.text.trim()
      }];
    }

    if (!subtitles.length) {
      throw new Error('No speech was detected. Check that your video contains clear speech.');
    }

    renderSubtitles();

    $('#aiProgressBar').style.width = '100%';
    $('#aiProgressText').textContent =
      `Finished! Generated ${subtitles.length} subtitle segments.`;

    setStatus('AI subtitles ready');

  } catch (error) {
    console.error('Whisper error:', error);

    $('#aiProgressText').textContent =
      `Could not generate subtitles: ${error.message || error}`;

    setStatus('Subtitle generation failed');

    alert(
      'AI subtitle generation failed. Check the browser console for details. ' +
      'Try a shorter video with clear speech.'
    );

  } finally {
    transcribing = false;
    $('#generateSubtitles').disabled = false;
  }
});

$('#downloadSrt').addEventListener('click', () => {
  if (!subtitles.length) return;

  const blob = new Blob([createSrt()], {
    type: 'text/plain;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'clipforge-subtitles.srt';
  link.click();

  URL.revokeObjectURL(url);
});

// FFmpeg video processing
async function loadFFmpeg() {
  if (ffmpegLoaded) return;

  setStatus('Loading video engine...');

  if (!ffmpeg) {
    ffmpeg = new FFmpeg();

    ffmpeg.on('progress', ({ progress }) => {
      const percent = Math.min(100, Math.round(progress * 100));
      $('#progressBar').style.width = `${percent}%`;
      $('#progressText').textContent = `Processing video: ${percent}%`;
    });
  }

  await ffmpeg.load({ coreURL, wasmURL });
  ffmpegLoaded = true;
}

function buildVideoFilter(effect, duration, vertical) {
  const filters = [];

  // Fill the 9:16 canvas without stretching the source.
  if (vertical) {
    filters.push('scale=720:1280:force_original_aspect_ratio=increase', 'crop=720:1280');
  }

  if (effect === 'cinematic') {
    filters.push('eq=saturation=1.12:contrast=1.08:brightness=-0.02');
  } else if (effect === 'zoom') {
    // Scale up slightly, then crop back to the frame size for a gentle zoom.
    filters.push('scale=iw*1.08:ih*1.08', 'crop=iw/1.08:ih/1.08');
  } else if (effect === 'fade') {
    const fadeDuration = Math.max(0.05, Math.min(0.35, duration / 3));
    const fadeOutStart = Math.max(0, duration - fadeDuration);
    filters.push(`fade=t=in:st=0:d=${fadeDuration}`, `fade=t=out:st=${fadeOutStart}:d=${fadeDuration}`);
  }

  return filters;
}

function makeExportArgs({ inputName, outputName, start, duration, effect, vertical }) {
  const args = [
    '-ss', String(start), '-i', inputName, '-t', String(duration),
    '-map', '0:v:0', '-map', '0:a:0?',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '25',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart'
  ];
  const filters = buildVideoFilter(effect, duration, vertical);
  if (filters.length) args.push('-vf', filters.join(','));
  args.push('-y', outputName);
  return args;
}

$('#previewYoutubeSegment').addEventListener('click', () => {
  const id = getYouTubeId($('#youtubeUrl').value.trim());
  if (!id) return alert('Enter and preview a valid YouTube URL first.');
  const start = Math.max(0, Number($('#startTime').value) || 0);
  const end = Math.max(start + 1, Number($('#endTime').value) || start + 15);
  youtubePreview.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?start=${Math.floor(start)}&end=${Math.floor(end)}&autoplay=1`;
});

$('#copyYoutubeSegment').addEventListener('click', async () => {
  const id = getYouTubeId($('#youtubeUrl').value.trim());
  if (!id) return alert('Enter and preview a valid YouTube URL first.');
  const start = Math.max(0, Math.floor(Number($('#startTime').value) || 0));
  const link = `https://www.youtube.com/watch?v=${id}&t=${start}s`;
  try {
    await navigator.clipboard.writeText(link);
    setStatus('YouTube timestamp link copied');
    alert('YouTube timestamp link copied. This shares the starting point; it does not download an MP4.');
  } catch {
    prompt('Copy this YouTube timestamp link:', link);
  }
});

createClipButton.addEventListener('click', async () => {
  if (processing) return;

  if (!sourceFile) return alert('Please upload a video first.');

  const start = Number($('#startTime').value);
  const end = Number($('#endTime').value);
  const vertical = $('input[name="format"]:checked').value === '9:16';

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end <= start ||
    end > videoPreview.duration
  ) {
    return alert('Please enter valid start and end times.');
  }

  if (end - start > 180) {
    return alert('For this first version, select a clip of 3 minutes or less.');
  }

  const extension = sourceFile.name.split('.').pop()
    .toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';

  const inputName = `input.${extension}`;
  const outputName = 'clipforge-output.mp4';

  processing = true;
  createClipButton.disabled = true;

  $('#result').classList.add('hidden');
  $('#progressWrap').classList.remove('hidden');
  $('#progressBar').style.width = '0%';
  $('#progressText').textContent = 'Preparing video...';

  setStatus('Processing video...');

  try {
    await loadFFmpeg();
    await ffmpeg.writeFile(inputName, await fetchFile(sourceFile));

    const args = makeExportArgs({
      inputName, outputName, start, duration: end - start,
      effect: $('#manualEffect').value, vertical
    });
    const exitCode = await ffmpeg.exec(args);
    if (exitCode !== 0) throw new Error(`FFmpeg export failed (exit code ${exitCode}). Try Normal effect or a shorter clip.`);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: 'video/mp4' });

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);

    $('#resultPreview').src = resultUrl;
    $('#downloadBtn').href = resultUrl;

    $('#result').classList.remove('hidden');
    $('#progressWrap').classList.add('hidden');

    setStatus('Clip ready!');
    $('#result').scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (error) {
    console.error('ClipForge processing error:', error);
    setStatus('Processing failed');
    $('#progressText').textContent = 'Processing failed. Check the browser console.';
    alert(`Video processing failed: ${error.message || error}`);

  } finally {
    try {
      await ffmpeg?.deleteFile(inputName);
      await ffmpeg?.deleteFile(outputName);
    } catch {
      // Temporary files may not exist if processing failed.
    }

    processing = false;
    createClipButton.disabled = !sourceFile;
  }
});

$('#generateRandomClips').addEventListener('click', async () => {
  if (processing) return;
  if (!sourceFile) return alert('Please upload a video first.');

  const duration = Number($('#randomDuration').value);
  const count = Number($('#randomCount').value);
  const effect = $('#randomEffect').value;
  const totalDuration = videoPreview.duration;

  if (!Number.isFinite(totalDuration) || totalDuration < duration) {
    return alert(`Your video must be at least ${duration} seconds long for this selection.`);
  }

  // Select random, non-overlapping sections whenever the source is long enough.
  const starts = [];
  const maxStart = Math.max(0, totalDuration - duration);
  const minimumGap = Math.min(2, duration * 0.1);
  let attempts = 0;
  while (starts.length < count && attempts < count * 100) {
    attempts++;
    const candidate = Math.random() * maxStart;
    const overlaps = starts.some(value =>
      candidate < value + duration + minimumGap && candidate + duration + minimumGap > value
    );
    if (!overlaps) starts.push(candidate);
  }
  if (!starts.length) starts.push(0);
  starts.sort((a, b) => a - b);

  processing = true;
  $('#generateRandomClips').disabled = true;
  createClipButton.disabled = true;
  $('#randomResults').innerHTML = '';
  $('#randomProgressWrap').classList.remove('hidden');
  $('#randomProgressBar').style.width = '0%';
  $('#randomProgressText').textContent = `Preparing ${starts.length} random clip(s)...`;
  setStatus('Generating random clips...');

  const extension = sourceFile.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  const inputName = `random-source.${extension}`;
  const outputNames = [];

  try {
    await loadFFmpeg();
    await ffmpeg.writeFile(inputName, await fetchFile(sourceFile));

    for (let index = 0; index < starts.length; index++) {
      const start = starts[index];
      const outputName = `clipforge-random-${index + 1}.mp4`;
      const vertical = $('input[name="format"]:checked').value === '9:16';
      const args = makeExportArgs({ inputName, outputName, start, duration, effect, vertical });

      $('#randomProgressText').textContent = `Creating clip ${index + 1} of ${starts.length}...`;
      const exitCode = await ffmpeg.exec(args);
      if (exitCode !== 0) throw new Error(`FFmpeg failed while creating clip ${index + 1} (exit code ${exitCode}).`);
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      outputNames.push(outputName);

      const card = document.createElement('article');
      card.className = 'random-result-card';
      const heading = document.createElement('h3');
      heading.textContent = `Clip ${index + 1} · ${formatTime(start)} – ${formatTime(start + duration)}`;
      const preview = document.createElement('video');
      preview.controls = true;
      preview.playsInline = true;
      preview.src = url;
      const link = document.createElement('a');
      link.className = 'download-btn';
      link.href = url;
      link.download = `clipforge-random-${index + 1}.mp4`;
      link.textContent = '↓ Download this clip';
      card.append(heading, preview, link);
      $('#randomResults').appendChild(card);

      $('#randomProgressBar').style.width = `${Math.round(((index + 1) / starts.length) * 100)}%`;
    }

    $('#randomProgressText').textContent = `Finished! ${starts.length} clip(s) are ready. Preview and download the ones you like.`;
    setStatus('Random clips ready');
  } catch (error) {
    console.error('Random clip generation failed:', error);
    $('#randomProgressText').textContent = `Could not finish generating clips: ${error.message || error}`;
    setStatus('Random clip generation failed');
    alert(`Random clip generation failed: ${error.message || error}`);
  } finally {
    try {
      await ffmpeg?.deleteFile(inputName);
      for (const name of outputNames) await ffmpeg?.deleteFile(name);
    } catch { /* Temporary files may already be removed. */ }
    processing = false;
    $('#generateRandomClips').disabled = false;
    createClipButton.disabled = !sourceFile;
  }
});

window.addEventListener('beforeunload', () => {
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  if (resultUrl) URL.revokeObjectURL(resultUrl);
});
