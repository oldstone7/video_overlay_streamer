## User Guide

### 1) Install prerequisites
- FFmpeg installed and on PATH
- MongoDB running locally (or Atlas connection string)
- Node 18+, Python 3.10+

### 2) Start the backend
```
cd backend
copy .env.example .env
# Edit .env with your Mongo URI if needed
pip install -r requirements.txt
python app.py
```

Backend runs at `http://localhost:5000`.

Optional HLS tuning (backend/.env):
```
# keep more history in playlist for seeking
HLS_LIST_SIZE=120
# prevent deletion of segments (DVR)
HLS_DELETE_SEGMENTS=0
# grow playlist
HLS_PLAYLIST_TYPE=event
```

### 3) Start the frontend
```
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 4) Provide an RTSP URL
- You can use services like `rtsp.me` to create a temporary RTSP link from a hosted video.
- Alternatively, use an IP camera RTSP URL or your own local RTSP server.

Note: Browsers cannot play RTSP directly; the backend transcodes to HLS for playback.

### 5) Start streaming
- Paste your RTSP URL in the input field and click "Start Stream".
- If FFmpeg can connect, the player will begin loading the HLS playlist. You may see a short loading period while the first segments are produced.

### 6) Add overlays
- Click "Add Text" to add a text overlay. Double-click text to edit.
- Click "Add Logo" to add an image overlay (enter image URL).
- Drag and resize overlays as needed.
- Use color picker, font size, and opacity controls for each element.
  - Controls won’t drag elements while you interact with them.

### 7) Save and manage overlay presets
- Click "Save as New" to store a preset in MongoDB.
- Select a saved overlay and click "Update Selected" to save changes.
- Click "Delete Selected" to remove a preset.

### Troubleshooting
- If starting a stream fails, ensure FFmpeg is installed and reachable. On Windows, set `FFMPEG_PATH` in `backend/.env` to the full ffmpeg.exe path.
- If the video loads slowly, increase your network buffer or use a lower-latency RTSP source.
- If you see CORS errors, confirm the backend is running on `http://localhost:5000` and that the frontend `.env` points to it.
 - To inspect FFmpeg logs, open `http://localhost:5000/logs/stream_<streamId>.log`.


