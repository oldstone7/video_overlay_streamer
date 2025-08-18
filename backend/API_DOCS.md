## API Documentation

Base URL: `http://localhost:5000`

All responses are JSON. Errors have shape: `{ "error": "message" }`.

### Streaming

POST `/api/streams`
- Starts transcoding from RTSP to HLS.
- Body:
```json
{ "rtspUrl": "rtsp://..." }
```
- 200 OK:
```json
{ "streamId": "<id>", "hlsUrl": "http://localhost:5000/hls/<id>/index.m3u8" }
```
 - Notes:
   - The `hlsUrl` points to the backend. The frontend player should load this URL directly.
   - Initial startup can take a few seconds while the first segments are produced.

DELETE `/api/streams/{streamId}`
- Stops transcoding and removes HLS output directory.
- 200 OK: `{ "ok": true }`
- 404 Not Found if unknown id.

GET `/hls/{streamId}/{filename}`
- Serves `.m3u8` and `.ts` files for the active stream.

GET `/api/streams/{streamId}/status`
- Returns basic status for a running stream.
- 200 OK example:
```json
{ "alive": true, "hasIndex": true, "indexSize": 596, "indexMtime": "2025-08-18T19:22:55.989466" }
```
- 404 Not Found if unknown id.

GET `/logs/stream_<id>.log`
- Returns the FFmpeg log for the given stream id. Useful for debugging RTSP connectivity/auth/codec issues.

### Overlay Presets (CRUD)

Overlay document
```json
{
  "id": "<ObjectId>",
  "name": "My Preset",
  "canvas": { "width": 1280, "height": 720 },
  "elements": [
    {
      "id": "el-1",
      "type": "text",  // "text" | "image"
      "text": "Live!",
      "imageUrl": null,
      "x": 50,
      "y": 60,
      "width": 200,
      "height": 60,
      "color": "#ffffff",
      "fontSize": 24,
      "opacity": 1
    }
  ]
}
```

POST `/api/overlays`
- Create overlay preset
- Body: overlay document without `id`
- 201 Created: returns created overlay with `id`

GET `/api/overlays`
- List overlays
- 200 OK: `[{...}]`

GET `/api/overlays/{id}`
- Get overlay by id
- 200 OK: `{...}`
- 404 Not Found

PUT `/api/overlays/{id}`
- Update overlay fields
- Body: any of `name`, `elements`, `canvas`, `updatedAt`
- 200 OK: updated document

DELETE `/api/overlays/{id}`
- Delete overlay by id
- 200 OK: `{ "ok": true }`

### Environment and Behavior

- Required env (backend/.env):
  - `MONGO_URI` (e.g., `mongodb://127.0.0.1:27017`)
  - `HLS_BASE_URL` (default `http://localhost:5000/hls`)
  - `FFMPEG_PATH` (set to full path to ffmpeg if not on PATH)
- Optional HLS tuning:
  - `HLS_TIME` segment duration seconds (default 4)
  - `HLS_LIST_SIZE` number of items kept in playlist (default 8)
  - `HLS_DELETE_SEGMENTS` set `0` to keep old segments (enables simple DVR; increases disk usage)
  - `HLS_PLAYLIST_TYPE` `live` or `event` (use `event` for a growing playlist)


