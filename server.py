"""Local server for the 20 LPA Run tracker.

Serves the site and stores everything you mark in data/db.json (one JSON file you can back up).
Run:  python3 server.py        then open http://127.0.0.1:8765
Uses only the Python standard library.
"""

import json
import os
import re
import tempfile
import threading
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST, PORT = "127.0.0.1", int(os.environ.get("PORT", "8765"))
ROOT = Path(__file__).resolve().parent
DB_FILE = Path(os.environ["TRACKER_DB"]).resolve() if os.environ.get("TRACKER_DB") else ROOT / "data" / "db.json"
COLLECTIONS = {"logs", "problems", "apps", "weeks", "mocks", "meta"}
ID_RE = re.compile(r"^[A-Za-z0-9_.~:@+-]{1,200}$")
_lock = threading.Lock()


def load() -> dict:
    if not DB_FILE.exists():
        return {c: {} for c in COLLECTIONS}
    with DB_FILE.open(encoding="utf-8") as f:
        data = json.load(f)
    for c in COLLECTIONS:
        data.setdefault(c, {})
    return data


def save(data: dict) -> None:
    """Atomic write: a crash mid-save never corrupts the file."""
    DB_FILE.parent.mkdir(exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=DB_FILE.parent, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1, sort_keys=True)
    os.replace(tmp, DB_FILE)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):  # keep the terminal quiet except for errors
        if not str(args[1] if len(args) > 1 else "").startswith(("2", "3")):
            super().log_message(fmt, *args)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    # ---- helpers ----
    def _json(self, status: int, body) -> None:
        raw = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _route(self):
        """Return (collection, doc_id) for /api/db/<collection>[/<doc_id>], else None."""
        parts = self.path.split("?")[0].strip("/").split("/")
        if len(parts) < 3 or parts[:2] != ["api", "db"] or parts[2] not in COLLECTIONS:
            return None
        doc_id = parts[3] if len(parts) == 4 else None
        if doc_id is not None and not ID_RE.match(doc_id):
            return None
        return parts[2], doc_id

    # ---- verbs ----
    def do_GET(self):
        if self.path.startswith("/api/ping"):
            return self._json(200, {"ok": True, "file": str(DB_FILE)})
        if self.path.startswith("/api/db"):
            r = self._route()
            if not r:
                return self._json(404, {"detail": "unknown collection"})
            with _lock:
                docs = load()[r[0]]
            return self._json(200, docs if r[1] is None else docs.get(r[1]))
        if self.path.split("?")[0] in ("", "/", "/index.html"):
            return self._page()
        return super().do_GET()

    def _page(self) -> None:
        """index.html is written as a page body (claude.ai adds the document shell); add it here."""
        body = (ROOT / "index.html").read_text(encoding="utf-8")
        html = (
            '<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22%3E%3Crect width=%2216%22 height=%2216%22 rx=%224%22 fill=%22%232853C4%22/%3E%3Cpath d=%22M4 11l3-3 2 2 3-4%22 stroke=%22white%22 stroke-width=%221.6%22 fill=%22none%22/%3E%3C/svg%3E">'
            "<title>20 LPA Run</title><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>"
            f"</head><body>{body}</body></html>"
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(html)))
        self.end_headers()
        self.wfile.write(html)

    def do_PUT(self):
        r = self._route()
        if not r or r[1] is None:
            return self._json(404, {"detail": "use /api/db/<collection>/<id>"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length) or b"{}")
            if not isinstance(body, dict):
                raise ValueError("body must be a JSON object")
        except (ValueError, json.JSONDecodeError) as exc:
            return self._json(400, {"detail": str(exc)})
        with _lock:
            data = load()
            data[r[0]][r[1]] = body
            save(data)
        return self._json(200, {"ok": True})

    def do_DELETE(self):
        r = self._route()
        if not r or r[1] is None:
            return self._json(404, {"detail": "use /api/db/<collection>/<id>"})
        with _lock:
            data = load()
            data[r[0]].pop(r[1], None)
            save(data)
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()


if __name__ == "__main__":
    print(f"20 LPA Run is running at http://{HOST}:{PORT}  (data: {DB_FILE})  Ctrl+C to stop")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
