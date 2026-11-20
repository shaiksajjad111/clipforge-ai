CLIPFORGE AI — YOUTUBE URL CLIP EXPORT

This version includes a YouTube URL clipping route using yt-dlp + native FFmpeg.

LOCAL WINDOWS SETUP
1. Install Node.js 24.
2. Install FFmpeg and FFprobe and add their bin directory to PATH.
3. Install yt-dlp and add its directory to PATH. Verify: yt-dlp --version, ffmpeg -version, ffprobe -version.
4. Frontend terminal, from project root: npm.cmd install; npm.cmd test; npm.cmd run build; npm.cmd run dev.
5. Backend terminal: cd server; npm.cmd install; npm.cmd run dev.
6. Backend health check: http://localhost:3001/api/health
7. Open the Vite URL, usually http://localhost:5173.

YOUTUBE EXPORT
Paste a YouTube URL and click Preview. Select start/end times, choose effects/ratio, tick the authorisation confirmation, then click Export YouTube segment as MP4. The frontend sends the URL and range to POST /api/youtube-jobs. The backend runs yt-dlp with --download-sections and then native FFmpeg for output effects and ratio. The completed MP4 appears in the normal result panel.

IMPORTANT
- yt-dlp is a third-party program; installing it or checking the box does not itself grant copyright, creator, or YouTube platform permission. Use only videos you own or are expressly authorised to download/edit and only where this method is permitted.
- Some videos may be unavailable due to age, region, login, DRM, account or platform restrictions. This application does not bypass DRM, paywalls or access controls.
- This endpoint has no login, rate limiting or queue isolation. Do not expose it as an unrestricted public downloader. Add authentication, abuse prevention, concurrency limits, quotas, storage limits and legal review before public deployment.
- Render static sites cannot run this backend. Deploy the Node service separately on a host that supports FFmpeg, FFprobe and yt-dlp binaries.
- Job state is in memory and files are temporary. This is a local MVP, not production-hardened.
