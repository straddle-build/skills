#!/usr/bin/env bash
set -euo pipefail
mkdir -p app
cat > requirements.txt <<'TXT'
flask==3.0.3
straddle==1.0.4
TXT
cat > app/main.py <<'PY'
from flask import Flask

app = Flask(__name__)
PY
cat > app/store.py <<'PY'
import sqlite3

db = sqlite3.connect("events.db", check_same_thread=False)
db.execute("create table if not exists events (id text primary key, event_type text, body text)")


def store_event(event_id: str, event_type: str, body: str) -> bool:
    """Insert one event; returns False when event_id is already stored."""
    cur = db.execute("insert or ignore into events values (?, ?, ?)", (event_id, event_type, body))
    db.commit()
    return cur.rowcount == 1
PY
