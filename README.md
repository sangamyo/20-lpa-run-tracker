# 20 LPA Run

A personal interview-prep tracker for a structured, week-by-week plan toward a 20 LPA software role. It covers DSA practice, core CS, AI/ML topics, job applications and mock interviews. Everything runs locally, and all data stays in one JSON file on your machine.

## Features

- **Today**: a daily task list built from the current week of the plan, with pace-aware scoring
- **Plan**: weekly themes and goals, from Python and arrays up to advanced DSA and system design
- **Learn**: lesson notes for DSA, core CS (OS, DBMS, networks) and AI topics
- **Problems**: log solved problems by pattern and difficulty
- **Applications**: a pipeline of target companies and roles with status tracking
- **Mocks**: a mock-interview log with feedback
- **Playbook**: interview strategies and checklists

## Tech

- Vanilla HTML, CSS and JavaScript. No framework and no build step.
- `server.py`: a small HTTP server that uses only the Python standard library. It serves the page and stores data in `data/db.json`. Every write is atomic, and the previous version is kept as a backup.
- Tests: `node --test` for the frontend logic and `unittest` for the server.

## Run

Requires Python 3.8+.

```bash
./start.sh            # starts the server and opens http://127.0.0.1:8765
# or
python3 server.py
```

Environment variables: `PORT` (default `8765`) and `TRACKER_DB` (path to the data file).

## Tests

```bash
node --test tests/
python3 -m unittest discover -s tests
```

## Notes

- The server accepts only `127.0.0.1` and `localhost` requests, by design. This is a single-user local tool with no authentication.
- `data/` (your progress) is gitignored.
- `seed/` holds the source data (target companies, lesson batches) that the `data-*.js` files were generated from.
