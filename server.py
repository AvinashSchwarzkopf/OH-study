#!/usr/bin/env python3
"""Local preview server for the OH study, with a /save endpoint.

    python3 server.py [port]        ->  http://localhost:8000

POSTs to /save with {"filename": ..., "csv": ...} are written into data/.
This is fine for piloting on your own machine. For a live MTurk run put the
folder behind real hosting (see README).
"""
import json, os, re, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data")

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def do_POST(self):
        if self.path.rstrip("/") != "/save":
            return self.send_error(404)
        try:
            n = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(n) or b"{}")
            name = re.sub(r"[^A-Za-z0-9._-]", "_", payload.get("filename") or "data.csv")
            if not name.endswith(".csv"):
                name += ".csv"
            os.makedirs(DATA, exist_ok=True)
            with open(os.path.join(DATA, name), "w", newline="") as f:
                f.write(payload.get("csv", ""))
            print("saved data/%s" % name)
            body = json.dumps({"ok": True, "file": name}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:                       # noqa: BLE001
            print("save failed:", e)
            self.send_error(500, "save failed")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "GET" not in fmt % args:
            super().log_message(fmt, *args)

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print("OH study running at http://localhost:%d  (Ctrl-C to stop)" % port)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
