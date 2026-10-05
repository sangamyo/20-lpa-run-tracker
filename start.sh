#!/bin/sh
# Start the 20 LPA Run tracker locally and open it in the browser.
cd "$(dirname "$0")"
URL="http://127.0.0.1:8765"
if curl -sf "$URL/api/ping" >/dev/null 2>&1; then
  echo "Already running at $URL"
else
  nohup python3 server.py > data/server.log 2>&1 &
  sleep 1
  echo "Started at $URL (log: data/server.log)"
fi
open "$URL"
