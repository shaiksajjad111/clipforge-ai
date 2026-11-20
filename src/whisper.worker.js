import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriberPromise;

async function getTranscriber() {
  if (!transcriberPromise) {
    transcriberPromise = pipeline(
      'automatic-speech-recognition',
      'onnx-community/whisper-base',
      {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: progress => {
          if (progress.status === 'progress' && progress.total) {
            const percent = Math.round(progress.progress || 0);
            self.postMessage({
              type: 'progress',
              percent,
              message: `Downloading multilingual Whisper model: ${percent}%`
            });
          } else if (progress.status === 'ready') {
            self.postMessage({ type: 'progress', percent: 100, message: 'AI model ready. Starting transcription...' });
          } else if (progress.status === 'initiate') {
            self.postMessage({ type: 'progress', percent: 0, message: 'Preparing multilingual AI model...' });
          }
        }
      }
    );
  }
  return transcriberPromise;
}

self.addEventListener('message', async event => {
  const { type, audio, language } = event.data || {};
  if (type !== 'transcribe') return;

  try {
    const model = await getTranscriber();
    self.postMessage({ type: 'progress', percent: 100, message: 'Transcribing audio in background...' });

    const options = {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5
    };
    if (language) {
      options.language = language;
      options.task = 'transcribe';
    }

    const output = await model(audio, options);
    self.postMessage({ type: 'result', output });
  } catch (error) {
    transcriberPromise = null;
    self.postMessage({ type: 'error', error: error?.message || String(error) });
  }
});
