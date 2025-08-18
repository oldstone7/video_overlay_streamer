import os
import mimetypes
from flask import Flask, request, jsonify, send_from_directory, abort, Response
from flask_cors import CORS
from bson import ObjectId
from dotenv import load_dotenv

from db import get_db
from stream_manager import stream_manager
from logger import setup_logging
import logging


load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})


def _serialize_overlay(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


@app.route("/api/overlays", methods=["POST"])
def create_overlay():
    data = request.get_json(force=True, silent=True) or {}
    required = ["name", "elements", "canvas"]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    db = get_db()
    result = db.overlays.insert_one({
        "name": data["name"],
        "elements": data["elements"],
        "canvas": data["canvas"],
        "createdAt": data.get("createdAt"),
        "updatedAt": data.get("updatedAt"),
    })
    inserted = db.overlays.find_one({"_id": result.inserted_id})
    return jsonify(_serialize_overlay(inserted)), 201


@app.route("/api/overlays", methods=["GET"])
def list_overlays():
    db = get_db()
    overlays = [_serialize_overlay(doc) for doc in db.overlays.find().sort("_id", -1)]
    return jsonify(overlays)


@app.route("/api/overlays/<overlay_id>", methods=["GET"])
def get_overlay(overlay_id: str):
    try:
        oid = ObjectId(overlay_id)
    except Exception:
        return jsonify({"error": "Invalid id"}), 400
    db = get_db()
    doc = db.overlays.find_one({"_id": oid})
    if not doc:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_serialize_overlay(doc))


@app.route("/api/overlays/<overlay_id>", methods=["PUT"]) 
def update_overlay(overlay_id: str):
    try:
        oid = ObjectId(overlay_id)
    except Exception:
        return jsonify({"error": "Invalid id"}), 400
    data = request.get_json(force=True, silent=True) or {}
    update = {k: data[k] for k in ["name", "elements", "canvas", "updatedAt"] if k in data}
    if not update:
        return jsonify({"error": "No updatable fields provided"}), 400
    db = get_db()
    result = db.overlays.update_one({"_id": oid}, {"$set": update})
    if result.matched_count == 0:
        return jsonify({"error": "Not found"}), 404
    doc = db.overlays.find_one({"_id": oid})
    return jsonify(_serialize_overlay(doc))


@app.route("/api/overlays/<overlay_id>", methods=["DELETE"]) 
def delete_overlay(overlay_id: str):
    try:
        oid = ObjectId(overlay_id)
    except Exception:
        return jsonify({"error": "Invalid id"}), 400
    db = get_db()
    result = db.overlays.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"ok": True})


@app.route("/api/streams", methods=["POST"]) 
def start_stream():
    data = request.get_json(force=True, silent=True) or {}
    rtsp_url = data.get("rtspUrl")
    if not rtsp_url:
        return jsonify({"error": "rtspUrl is required"}), 400
    try:
        stream_id, hls_url = stream_manager.start_stream(rtsp_url)
        return jsonify({"streamId": stream_id, "hlsUrl": hls_url})
    except FileNotFoundError:
        return jsonify({"error": "FFmpeg not found. Ensure it is installed and on PATH or set FFMPEG_PATH"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/streams/<stream_id>", methods=["DELETE"]) 
def stop_stream(stream_id: str):
    stopped = stream_manager.stop_stream(stream_id)
    if not stopped:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"ok": True})


@app.route("/api/streams/<stream_id>/status", methods=["GET"]) 
def stream_status(stream_id: str):
    status = stream_manager.get_status(stream_id)
    if not status:
        return jsonify({"error": "Not found"}), 404
    return jsonify(status)

@app.route("/hls/<stream_id>/<path:filename>")
def serve_hls(stream_id: str, filename: str):
    # Always serve from on-disk directory to avoid in-memory mapping edge cases
    dir_path = os.path.join(stream_manager.base_streams_dir, stream_id)
    if not os.path.isdir(dir_path):
        abort(404)
    file_path = os.path.join(dir_path, filename)
    if not os.path.exists(file_path):
        abort(404)

    # Ensure proper MIME types
    if filename.endswith(".m3u8"):
        mimetype_value = "application/vnd.apple.mpegurl"
    elif filename.endswith(".ts"):
        mimetype_value = "video/MP2T"
    else:
        mimetype_value = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    response = send_from_directory(directory=dir_path, path=filename, mimetype=mimetype_value, as_attachment=False)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Cache-Control"] = "no-cache"
    return response


@app.route("/logs/<path:filename>")
def get_log(filename: str):
    # Only allow access inside backend/logs
    from stream_manager import stream_manager
    logs_dir = stream_manager.base_logs_dir
    full_path = os.path.join(logs_dir, filename)
    if not os.path.abspath(full_path).startswith(logs_dir):
        abort(403)
    if not os.path.exists(full_path):
        abort(404)
    return send_from_directory(directory=logs_dir, path=filename, mimetype="text/plain")


if __name__ == "__main__":
    setup_logging()
    logging.getLogger(__name__).info("Booting Flask app")
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    # Ensure base streams directory exists before run
    os.makedirs(stream_manager.base_streams_dir, exist_ok=True)
    app.run(host=host, port=port, debug=debug)


