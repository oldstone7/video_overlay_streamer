import os
import shutil
import uuid
import subprocess
import threading
import logging
from typing import Dict, Optional, Tuple
from dotenv import load_dotenv


load_dotenv()


class StreamManager:
    def __init__(self):
        self._lock = threading.Lock()
        self._process_by_id: Dict[str, subprocess.Popen] = {}
        self._dir_by_id: Dict[str, str] = {}
        self._logfile_by_id: Dict[str, object] = {}
        self.base_streams_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "streams"))
        self.base_logs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "logs"))
        self.ffmpeg_path = os.getenv("FFMPEG_PATH", "ffmpeg")
        self.hls_base_url = os.getenv("HLS_BASE_URL", "http://localhost:5000/hls")
        # HLS tunables via env
        self.hls_time_seconds = int(os.getenv("HLS_TIME", "4"))             # segment length
        self.hls_list_size = int(os.getenv("HLS_LIST_SIZE", "8"))           # playlist items kept
        self.hls_delete_segments = os.getenv("HLS_DELETE_SEGMENTS", "1") in ("1", "true", "TRUE", "yes", "YES")
        self.hls_playlist_type = os.getenv("HLS_PLAYLIST_TYPE", "live")     # "live" | "event"
        os.makedirs(self.base_logs_dir, exist_ok=True)

    def start_stream(self, rtsp_url: str) -> Tuple[str, str]:
        stream_id = uuid.uuid4().hex
        output_dir = os.path.join(self.base_streams_dir, stream_id)
        os.makedirs(output_dir, exist_ok=True)

        index_path = os.path.join(output_dir, "index.m3u8")
        segment_pattern = os.path.join(output_dir, "segment_%03d.ts")

        # FFmpeg command to transcode RTSP to HLS with low latency-ish settings
        cmd = [
            self.ffmpeg_path,
            "-nostdin",
            "-rtsp_transport", "tcp",
            "-i", rtsp_url,
            # Video encode tuned for stable HLS
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-tune", "zerolatency",
            "-profile:v", "main",
            "-pix_fmt", "yuv420p",
            # Keyframe (GOP) around 2s @ ~30fps; helps HLS segment boundaries
            "-g", "60",
            "-keyint_min", "60",
            "-sc_threshold", "0",
            # Bitrate control (adjust to your system/network)
            "-b:v", "2500k",
            "-maxrate", "3000k",
            "-bufsize", "6000k",
            # Optional downscale for performance; comment out to keep source size
            # "-vf", "scale=-2:720",
            # Audio
            "-c:a", "aac",
            "-ar", "48000",
            "-b:a", "128k",
            # HLS muxer settings
            "-f", "hls",
            "-hls_time", str(self.hls_time_seconds),
            "-hls_list_size", str(self.hls_list_size),
            "-hls_flags", ("append_list+program_date_time+delete_segments" if self.hls_delete_segments else "append_list+program_date_time"),
            "-hls_segment_filename", segment_pattern,
            index_path,
        ]

        if self.hls_playlist_type in ("event", "vod"):
            # "event" grows over time, enabling DVR; "vod" writes final playlist with EXT-X-ENDLIST
            cmd[0:0] = []  # no-op to keep list type comment above
            cmd.insert(-2, "-hls_playlist_type")
            cmd.insert(-2, self.hls_playlist_type)

        # Start ffmpeg process detached
        creationflags = 0
        if os.name == "nt":
            creationflags = subprocess.CREATE_NO_WINDOW

        log_path = os.path.join(self.base_logs_dir, f"stream_{stream_id}.log")
        log_file = open(log_path, "wb")
        process = subprocess.Popen(
            cmd,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            stdin=subprocess.DEVNULL,
            creationflags=creationflags,
        )

        with self._lock:
            self._process_by_id[stream_id] = process
            self._dir_by_id[stream_id] = output_dir
            self._logfile_by_id[stream_id] = log_file

        hls_url = f"{self.hls_base_url}/{stream_id}/index.m3u8"
        logging.getLogger(__name__).info("Started stream %s -> %s", stream_id, hls_url)
        return stream_id, hls_url

    def stop_stream(self, stream_id: str) -> bool:
        with self._lock:
            process = self._process_by_id.pop(stream_id, None)
            dir_path = self._dir_by_id.pop(stream_id, None)
            log_file = self._logfile_by_id.pop(stream_id, None)

        if not dir_path and not process:
            return False

        try:
            if process and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except Exception:
                    process.kill()
            if log_file:
                try:
                    log_file.flush()
                except Exception:
                    pass
                try:
                    log_file.close()
                except Exception:
                    pass
        finally:
            if dir_path and os.path.exists(dir_path):
                shutil.rmtree(dir_path, ignore_errors=True)

        logging.getLogger(__name__).info("Stopped stream %s", stream_id)
        return True

    def get_status(self, stream_id: str) -> Dict[str, object]:
        with self._lock:
            process = self._process_by_id.get(stream_id)
            dir_path = self._dir_by_id.get(stream_id)
        alive = bool(process and process.poll() is None)
        index_path = None
        has_index = False
        index_size = None
        index_mtime_iso = None
        if dir_path:
            index_path = os.path.join(dir_path, "index.m3u8")
            if os.path.exists(index_path):
                has_index = True
                try:
                    stat = os.stat(index_path)
                    index_size = stat.st_size
                    from datetime import datetime
                    index_mtime_iso = datetime.fromtimestamp(stat.st_mtime).isoformat()
                except Exception:
                    pass
        return {
            "alive": alive,
            "hasIndex": has_index,
            "indexSize": index_size,
            "indexMtime": index_mtime_iso,
        }

    def get_stream_directory(self, stream_id: str) -> Optional[str]:
        with self._lock:
            dir_path = self._dir_by_id.get(stream_id)
        return dir_path


stream_manager = StreamManager()


