"""Server tests: JSON Merge Patch semantics and the PATCH endpoint.  Run: python3 tests/test_server.py"""
import json
import os
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from server import merge_patch  # noqa: E402


class MergePatch(unittest.TestCase):
    def test_rfc7396(self):
        self.assertEqual(merge_patch({"a": "b"}, {"a": "c"}), {"a": "c"})
        self.assertEqual(merge_patch({"a": "b"}, {"b": "c"}), {"a": "b", "b": "c"})
        self.assertEqual(merge_patch({"a": "b"}, {"a": None}), {})
        self.assertEqual(merge_patch({"a": "b", "b": "c"}, {"a": None}), {"b": "c"})
        self.assertEqual(merge_patch({"a": ["b"]}, {"a": "c"}), {"a": "c"})
        self.assertEqual(merge_patch({"a": {"b": "c"}}, {"a": {"b": "d", "c": None}}), {"a": {"b": "d"}})
        self.assertEqual(merge_patch({"a": [{"b": "c"}]}, {"a": [1]}), {"a": [1]})
        self.assertEqual(merge_patch(None, {"a": {"b": None}}), {"a": {}})
        self.assertEqual(merge_patch({"e": None}, {"a": 1}), {"e": None, "a": 1})
        self.assertEqual(merge_patch({}, {"a": {"bb": {"ccc": None}}}), {"a": {"bb": {}}})

    def test_does_not_mutate(self):
        t = {"done": {"x": 1}}
        merge_patch(t, {"done": {"y": 2}})
        self.assertEqual(t, {"done": {"x": 1}})


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


class Endpoint(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.port = free_port()
        env = dict(os.environ, PORT=str(cls.port), TRACKER_DB=os.path.join(cls.tmp.name, "db.json"))
        cls.proc = subprocess.Popen([sys.executable, str(ROOT / "server.py")], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(50):
            try:
                urllib.request.urlopen(cls.url("/api/ping"), timeout=0.5)
                break
            except OSError:
                time.sleep(0.1)

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        cls.proc.wait()
        cls.tmp.cleanup()

    @classmethod
    def url(cls, path):
        return f"http://127.0.0.1:{cls.port}{path}"

    def req(self, method, path, body=None):
        data = None if body is None else json.dumps(body).encode()
        r = urllib.request.Request(self.url(path), data=data, method=method, headers={"content-type": "application/json"})
        try:
            with urllib.request.urlopen(r) as resp:
                raw = resp.read()
                return resp.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"null")

    def test_patch_creates_merges_and_deletes(self):
        self.assertEqual(self.req("PATCH", "/api/db/meta/learn", {"done": {"a": "2026-10-05"}})[0], 200)
        self.req("PATCH", "/api/db/meta/learn", {"done": {"b": "2026-10-06"}, "last": "b"})
        self.assertEqual(self.req("GET", "/api/db/meta/learn")[1], {"done": {"a": "2026-10-05", "b": "2026-10-06"}, "last": "b"})
        self.req("PATCH", "/api/db/meta/learn", {"done": {"a": None}})
        self.assertEqual(self.req("GET", "/api/db/meta/learn")[1], {"done": {"b": "2026-10-06"}, "last": "b"})

    def test_patch_rejects_bad_input(self):
        self.assertEqual(self.req("PATCH", "/api/db/nope/x", {"a": 1})[0], 404)
        self.assertEqual(self.req("PATCH", "/api/db/meta", {"a": 1})[0], 404)
        self.assertEqual(self.req("PATCH", "/api/db/meta/x", [1])[0], 400)

    def test_static_whitelist(self):
        for f in ("/app.js", "/logic.js", "/styles.css", "/data-plan.js"):
            self.assertEqual(urllib.request.urlopen(self.url(f)).status, 200, f)
        for f in ("/server.py", "/tests/test_server.py", "/start.sh", "/data/db.json"):
            with self.assertRaises(urllib.error.HTTPError, msg=f):
                urllib.request.urlopen(self.url(f))


if __name__ == "__main__":
    unittest.main(verbosity=2)
