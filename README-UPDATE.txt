CLIPFORGE AI — UPDATED BUILD

Changes in this update
- Added a workspace switch between Short Clip Maker and Subtitles Studio.
- Kept subtitle generation/editing in its own tool view.
- Set the default YouTube segment to the first 30 seconds (00:00:00–00:00:30).
- Made output ratio, fit and effect settings available to YouTube exports too.
- Added stronger visual effect presets: Cinematic Pro, Dynamic Zoom, Vibrant, Golden Hour,
  Noir, Retro Film, Dreamy and Crisp Punch, in addition to Original and Fade.
- Improved processing messages so the interface speaks in user-friendly language rather
  than exposing FFmpeg implementation details.
- Random clip generation remains available for uploaded/imported video files.

Important integration notes
- The uploaded project did not contain a "Next" button, so there was no such control to remove.
- Google sign-in is NOT wired up in this ZIP. A real Google sign-in flow requires a Google
  OAuth Client ID (and, for secure mandatory authentication, backend token verification,
  session handling and protected processing endpoints). This project archive contains no
  OAuth/Firebase credentials. A visual-only sign-in button or localStorage flag would not
  securely enforce sign-in, so this update does not fake authentication.
- The YouTube "agree" confirmation remains required before URL export. Use only content
  you own or are authorised to download/edit and only where the acquisition method is allowed.

Run
  npm install
  npm test
  npm run build

Backend
  cd server
  npm install
  npm run dev
  Ensure FFmpeg, FFprobe and yt-dlp are installed and available on PATH.
