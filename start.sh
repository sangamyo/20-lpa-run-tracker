#!/bin/sh
# Start the 20 LPA Run tracker locally and open it in the browser.
cd "$(dirname "$0")" || exit 1
PORT="${PORT:-8765}"
URL="http://127.0.0.1:$PORT"

if curl -sf "$URL/api/ping" >/dev/null 2>&1; then
  echo "Already running at $URL"
  open "$URL"
  exit 0
fi
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is used by another program. Close it, or run: PORT=8766 ./start.sh"
  exit 1
fi
if ! python3 -c 'import sys; sys.exit(sys.version_info < (3, 8))' >/dev/null 2>&1; then
  echo "Python 3.8+ is required. Install it from https://www.python.org/downloads/ and try again."
  exit 1
fi

mkdir -p data
PORT="$PORT" nohup python3 -u server.py >> data/server.log 2>&1 &

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf "$URL/api/ping" >/dev/null 2>&1; then
    echo "Started at $URL"
    open "$URL"
    exit 0
  fi
  sleep 0.5
done
echo "The server failed to start. Last lines of data/server.log:"
tail -n 20 data/server.log
exit 1
