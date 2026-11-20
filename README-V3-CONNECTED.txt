CLIPFORGE AI — V3 CONNECTED BACKEND BUILD

WHAT CHANGED
- The existing V2 frontend, Whisper subtitle implementation, clip tools, random clip planner and ZIP writer are retained.
- Manual MP4 export now uploads the selected source file to the Node/Express backend.
- Random clip export now sends each planned clip to the backend and receives MP4 files.
- Backend uses native FFmpeg/FFprobe rather than FFmpeg.wasm for export.
- The existing browser subtitle pipeline remains separate and unchanged.

IMPORTANT YOUTUBE LIMITATION
- YouTube URL preview and timestamp links remain available.
- This package does NOT extract/download audiovisual streams from YouTube URLs.
- YouTube API/Terms restrictions apply independently of a creator's copyright permission. Do not use an extraction method unless YouTube/platform terms and the relevant rights explicitly authorise it.
- To export a YouTube-hosted lesson, download/provide the authorised original file through an approved route, then upload that file to ClipForge. A direct media URL from a provider that explicitly permits downloading can be imported separately if it supports browser CORS.

WINDOWS SETUP
1. Install native FFmpeg and FFprobe and add their bin folder to Windows PATH.
   Open a NEW PowerShell window and verify:
     ffmpeg -version
     ffprobe -version
2. FRONTEND terminal (project root):
     npm.cmd install
     npm.cmd test
     npm.cmd run build
     npm.cmd run dev
3. BACKEND terminal (second PowerShell window):
     cd C:\ClipForge-AI-v3\server
     npm.cmd install
     npm.cmd run dev
4. Check backend health:
     http://localhost:3001/api/health
5. Open the Vite URL, normally:
     http://localhost:5173

The frontend uses http://localhost:3001 by default. For deployment, set
VITE_API_BASE_URL to the deployed backend URL before building the frontend.
Set backend FRONTEND_ORIGIN to the exact frontend origin, e.g. the Render static-site URL.

BACKEND API
GET  /api/health
POST /api/jobs  (multipart: video, start, end, format, fit, effect)
GET  /api/jobs/:id
GET  /api/jobs/:id/download

SUPPORTED EXPORT SETTINGS
format: original | 9:16 | 1:1
fit: crop | pad | blur
effect: normal | cinematic | zoom | fade

NOTES
- Server upload limit defaults to 1 GB; adjust MAX_UPLOAD_BYTES if appropriate.
- Jobs are held in memory and files in temporary storage. This is a local/testing starter, not production-hardened hosting.
- Add authentication, rate limiting, concurrency limits, durable job storage and object storage before a public launch.
- Long videos consume server CPU and disk. A free host may not have enough resources for large jobs.
