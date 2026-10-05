"""Local server for the 20 LPA Run tracker.

Serves the site and stores everything you mark in data/db.json (one JSON file; the previous
version is kept as data/db.json.bak). Run:  python3 server.py   then open http://127.0.0.1:8765
Uses only the Python standard library.

Environment: PORT (default 8765), TRACKER_DB (path to the data file, for testing).
"""

import json
import os
import re
import shutil
import sys
import tempfile
import threading
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST, PORT = "127.0.0.1", int(os.environ.get("PORT", "8765"))
ROOT = Path(__file__).resolve().parent
DB_FILE = Path(os.environ["TRACKER_DB"]).resolve() if os.environ.get("TRACKER_DB") else ROOT / "data" / "db.json"
BACKUP_FILE = DB_FILE.with_name(DB_FILE.name + ".bak")
COLLECTIONS = {"logs", "problems", "apps", "weeks", "mocks", "meta"}
ID_RE = re.compile(r"^[A-Za-z0-9_.~:@+-]{1,200}$")
STATIC_FILE = re.compile(r"^/(data-[a-z0-9-]+\.js)$")  # the only files besides the page we serve
MAX_BODY = 1_000_000  # bytes per document
ALLOWED_HOSTS = {f"127.0.0.1:{PORT}", f"localhost:{PORT}"}
ALLOWED_ORIGINS = {f"http://{h}" for h in ALLOWED_HOSTS}
_lock = threading.Lock()


class DbError(Exception):
    pass


def load() -> dict:
    if not DB_FILE.exists():
        return {c: {} for c in COLLECTIONS}
    try:
        data = json.loads(DB_FILE.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("top level is not a JSON object")
    except (ValueError, OSError) as exc:
        raise DbError(f"{DB_FILE} is unreadable ({exc}). Restore it from {BACKUP_FILE} or fix it by hand.") from exc
    for c in COLLECTIONS:
        if not isinstance(data.get(c), dict):
            data[c] = {}
    return data


def save(data: dict) -> None:
    """Atomic write with a one-step backup: a crash mid-save never corrupts the file."""
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=DB_FILE.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1, sort_keys=True)
            f.flush()
            os.fsync(f.fileno())
        if DB_FILE.exists():
            shutil.copy2(DB_FILE, BACKUP_FILE)
        os.replace(tmp, DB_FILE)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


PAGE_HEAD = (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
    '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22%3E'
    '%3Crect width=%2216%22 height=%2216%22 rx=%224%22 fill=%22%23C96442%22/%3E%3Ccircle cx=%228%22 cy=%228%22 r=%222.5%22 '
    'fill=%22%23F5F4EE%22/%3E%3C/svg%3E">'
    "<title>20 LPA Run</title><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>"
    "</head><body>"
)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_request(self, code="-", size="-"):  # keep the terminal quiet except for errors
        if not str(getattr(code, "value", code)).startswith(("2", "3")):
            super().log_request(code, size)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    # ---- helpers ----
    def _send(self, status: int, body: bytes, ctype: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _json(self, status: int, body) -> None:
        self._send(status, json.dumps(body).encode(), "application/json")

    def _guard(self, mutating: bool = False) -> bool:
        """Block DNS rebinding (Host) and cross-site writes (Origin) from other websites in your browser."""
        if self.headers.get("Host") not in ALLOWED_HOSTS:
            self._json(421, {"detail": "unknown host"})
            return False
        origin = self.headers.get("Origin")
        if mutating and origin and origin not in ALLOWED_ORIGINS:
            self._json(403, {"detail": "cross-origin write blocked"})
            return False
        return True

    def _route(self):
        """Return (collection, doc_id|None) for /api/db/<collection>[/<doc_id>], else an error string."""
        parts = self.path.split("?")[0].strip("/").split("/")
        if parts[:2] != ["api", "db"] or not 3 <= len(parts) <= 4:
            return "use /api/db/<collection>[/<id>]"
        if parts[2] not in COLLECTIONS:
            return f"unknown collection '{parts[2]}'"
        doc_id = parts[3] if len(parts) == 4 else None
        if doc_id is not None and not ID_RE.match(doc_id):
            return "invalid document id"
        return parts[2], doc_id

    # ---- verbs ----
    def do_GET(self):
        if not self._guard():
            return
        path = self.path.split("?")[0]
        if path == "/api/ping":
            return self._json(200, {"ok": True, "file": str(DB_FILE)})
        if path.startswith("/api/"):
            r = self._route()
            if isinstance(r, str):
                return self._json(404, {"detail": r})
            try:
                with _lock:
                    docs = load()[r[0]]
            except DbError as exc:
                return self._json(500, {"detail": str(exc)})
            if r[1] is None:
                return self._json(200, docs)
            return self._json(200, docs[r[1]]) if r[1] in docs else self._json(404, {"detail": "not found"})
        if path in ("", "/", "/index.html"):
            body = (ROOT / "index.html").read_text(encoding="utf-8")
            return self._send(200, (PAGE_HEAD + body + "</body></html>").encode("utf-8"), "text/html; charset=utf-8")
        if STATIC_FILE.match(path):
            return super().do_GET()
        return self._json(404, {"detail": "not found"})

    def do_HEAD(self):
        self.do_GET()

    def do_PUT(self):
        if not self._guard(mutating=True):
            return
        r = self._route()
        if isinstance(r, str) or r[1] is None:
            return self._json(404, {"detail": r if isinstance(r, str) else "use /api/db/<collection>/<id>"})
        try:
            length = int(self.headers.get("Content-Length", ""))
        except ValueError:
            return self._json(411, {"detail": "Content-Length required"})
        if not 0 < length <= MAX_BODY:
            return self._json(413, {"detail": f"body must be 1..{MAX_BODY} bytes"})
        try:
            body = json.loads(self.rfile.read(length))
            if not isinstance(body, dict):
                raise ValueError("body must be a JSON object")
        except ValueError as exc:
            return self._json(400, {"detail": str(exc)})
        try:
            with _lock:
                data = load()
                data[r[0]][r[1]] = body
                save(data)
        except DbError as exc:
            return self._json(500, {"detail": str(exc)})
        return self._json(200, {"ok": True})

    def do_DELETE(self):
        if not self._guard(mutating=True):
            return
        r = self._route()
        if isinstance(r, str) or r[1] is None:
            return self._json(404, {"detail": r if isinstance(r, str) else "use /api/db/<collection>/<id>"})
        try:
            with _lock:
                data = load()
                data[r[0]].pop(r[1], None)
                save(data)
        except DbError as exc:
            return self._json(500, {"detail": str(exc)})
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()


if __name__ == "__main__":
    try:
        server = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError as exc:
        sys.exit(f"Cannot start on {HOST}:{PORT}: {exc}")
    print(f"20 LPA Run is running at http://{HOST}:{PORT}  (data: {DB_FILE})  Ctrl+C to stop", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
