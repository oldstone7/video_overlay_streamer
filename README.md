## Stream Overlay App

React + Flask + MongoDB app that plays an RTSP livestream (via HLS) with draggable/resizable overlays (text and logos). Includes a CRUD API for overlay presets and documentation.

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


