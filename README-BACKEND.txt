CLIPFORGE AI — V2 + NODE PROCESSING API

This package preserves the existing Vite frontend, browser-based FFmpeg export,
Whisper subtitle implementation, clip tools, random clip planner and ZIP writer.
It adds a separate Node.js + Express processing API in /server.

IMPORTANT CURRENT STATUS
- Existing frontend continues to use its current browser FFmpeg pipeline.
- The new API is an additional backend foundation for server-side processing.
- The UI is NOT yet switched to the backend; that should be done in a separately
  tested integration step so the working subtitle and browser workflow are preserved.
- YouTube is still preview/timestamps only. The API accepts uploaded media files;
  it does not download YouTube streams or bypass platform restrictions.

FRONTEND
From the project root:
  npm.cmd install
  npm.cmd test
  npm.cmd run build
  npm.cmd run dev

NODE BACKEND (Windows PowerShell)
1. Install native FFmpeg and FFprobe on the computer/server and ensure both
   commands work in a new terminal:
     ffmpeg -version
     ffprobe -version
2. Open a second terminal:
     cd C:\ClipForge-AI-v2\server
     npm.cmd install
     npm.cmd run dev
3. Health check:
     http://localhost:3001/api/health

Environment variables:
  PORT=3001
  FRONTEND_ORIGIN=http://localhost:5173
  MAX_UPLOAD_BYTES=1073741824
  JOB_TTL_MS=3600000
  FFMPEG_PATH=ffmpeg
  FFPROBE_PATH=ffprobe
  WORK_DIR=(optional temporary work directory)

API
  GET  /api/health
  POST /api/jobs
       multipart/form-data:
         video  (file)
         start  (seconds)
         end    (seconds)
         format (original | 9:16 | 1:1)
         fit    (crop | blur)
         effect (normal | cinematic | zoom | fade)
       Returns 202 and a job id.
  GET  /api/jobs/:id
       Poll status.
  GET  /api/jobs/:id/download
       Download the completed MP4.

Example PowerShell upload test (replace the path):
  curl.exe -F "video=@C:\Videos\sample.mp4" -F "start=0" -F "end=15" `
    -F "format=9:16" -F "fit=crop" -F "effect=normal" `
    http://localhost:3001/api/jobs

Then poll the returned id:
  Invoke-RestMethod http://localhost:3001/api/jobs/JOB_ID

SECURITY / DEPLOYMENT NOTES
- Set FRONTEND_ORIGIN to the exact deployed frontend origin before public deployment.
- Add authentication/rate limits and per-user quotas before exposing this API publicly.
- Use persistent object storage or a managed job queue for production; local temp files
  are ephemeral and this in-memory job registry resets when the server restarts.
- Configure upload limits, concurrency limits, timeouts and automatic cleanup.
- Never accept arbitrary shell commands or arbitrary remote URLs from clients.
- The API processes user-provided files. Only upload media the user is authorised to use.

YOUTUBE URL CLIP EXPORT
This version also provides POST /api/youtube-jobs. Install yt-dlp on the backend machine and ensure it is on PATH (or set YTDLP_PATH). The endpoint uses yt-dlp --download-sections and then native FFmpeg for final MP4 output. In the YouTube tab, preview the URL, set start/end, tick the authorisation confirmation, then click Export YouTube segment as MP4.

Use only content you own or are authorised to download/edit and only where the acquisition method is permitted. yt-dlp is a tool, not a grant of rights or platform permission. Do not deploy an unrestricted public downloader; add authentication, rate limits, abuse controls, quotas and legal review first.


UPDATED EFFECT PRESETS
The API accepts: normal, cinematic, zoom, fade, vibrant, warm, noir, retro, dreamy, punch.
The frontend sends these values for uploaded-video backend exports and YouTube URL exports.
