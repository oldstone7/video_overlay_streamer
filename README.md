## Stream Overlay App

React + Flask + MongoDB app that plays an RTSP livestream (via HLS) with draggable/resizable overlays (text and logos). Includes a CRUD API for overlay presets and documentation.

### Youtube demo
[![Watch the video](https://img.youtube.com/vi/fKxNltPqP5A/maxresdefault.jpg)](https://youtu.be/fKxNltPqP5A)


### Tech Stack
- React (Vite)
- Flask (Python)
- MongoDB
- FFmpeg (RTSP → HLS)

### Quick Start

1) Prerequisites
- Node 18+
- Python 3.10+
- FFmpeg installed and on PATH
- MongoDB (local or Atlas)

2) Backend setup
```
cd backend
copy .env.example .env  (Windows)  |  cp .env.example .env  (macOS/Linux)
# Edit .env with your Mongo connection string
pip install -r requirements.txt
python app.py
```

3) Frontend setup
```
cd frontend
copy .env.example .env  (Windows)  |  cp .env.example .env  (macOS/Linux)
npm install
npm run dev
```

4) Use the app
- Open http://localhost:5173
- Paste an RTSP URL and click Start Stream
- Add overlays (text/logo), drag/resize, and Save as a preset

### Documentation
- API docs: `backend/API_DOCS.md`
- User guide: `frontend/USER_GUIDE.md`

### Notes
- Browsers cannot play RTSP directly. The backend launches FFmpeg to transcode RTSP to HLS (m3u8 + ts) and serves it to the frontend player via hls.js.
- HLS segments are written under `backend/streams/` and are cleaned up when you stop a stream.

-To generate an RTSP link locally, you can stream a video from your pc. 
Download and install mediamtx in addition to ffmpeg. 

-Download from here -> https://github.com/bluenviron/mediamtx

-Then open a command prompt and run mediamtx by the command mediamtx or ./mediamtx (on where the mediamtx/ located)

-Download ffmpeg locally from here, https://www.gyan.dev/ffmpeg/builds/ 
click the ffmpeg-git-essentials.7z      .ver .sha256 and download and extract the zip.

-Then open another tab and run the ffmpeg this command in a directory where you can access the ffmpeg (make it a SYSTEM PATH you can access it from anywhere)

- ffmpeg -re -stream_loop -1 -i "C:\Path-to-your-video" -vf "scale=-2:720" -c:v libx264 -preset ultrafast -tune zerolatency -profile:v baseline -pix_fmt yuv420p -g 30 -keyint_min 30 -sc_threshold 0 -b:v 1500k -maxrate 2000k -bufsize 3000k -c:a aac -ar 44100 -b:a 96k -rtsp_transport tcp -f rtsp rtsp://127.0.0.1:8554/mystream

Replace the path-to-our-video with actual path of the video you want to stream. 

