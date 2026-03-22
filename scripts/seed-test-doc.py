"""
seed-test-doc.py

Duplicates the Firestore document users/me → users/test.
Safe to re-run — it overwrites users/test completely each time.

Usage:
    pip install firebase-admin --break-system-packages
    python scripts/seed-test-doc.py

Auth (pick one):
  Option A — set env var before running:
    export GOOGLE_APPLICATION_CREDENTIALS=path/to/gentle-planner-firebase-adminsdk-fbsvc-30a35a8f3e.json
    python scripts/seed-test-doc.py

  Option B — edit the SERVICE_ACCOUNT_PATH constant below.
"""

import json
import firebase_admin
from firebase_admin import credentials, firestore

# ── Config ────────────────────────────────────────────────────────────────────

SERVICE_ACCOUNT_PATH = 'docs\gentle-planner-firebase-adminsdk-fbsvc-30a35a8f3e.json'

SOURCE_DOC = ('users', 'me')
DEST_DOC   = ('users', 'test')

# ── Firebase init ─────────────────────────────────────────────────────────────

if SERVICE_ACCOUNT_PATH:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)
else:
    firebase_admin.initialize_app()  # uses GOOGLE_APPLICATION_CREDENTIALS

db = firestore.client()

# ── Helpers ───────────────────────────────────────────────────────────────────

def serialize_for_log(obj):
    """JSON-serialise for logging only — converts timestamps to strings."""
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    raise TypeError(f'Not serializable: {type(obj)}')

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    src_ref  = db.collection(SOURCE_DOC[0]).document(SOURCE_DOC[1])
    dest_ref = db.collection(DEST_DOC[0]).document(DEST_DOC[1])

    print(f'Reading {"/".join(SOURCE_DOC)}...')
    snap = src_ref.get()

    if not snap.exists:
        print(f'ERROR: {"/".join(SOURCE_DOC)} does not exist. Nothing to copy.')
        return

    data = snap.to_dict()

    # Quick summary of what we're copying
    weeks  = data.get('weeks',  {})
    tasks  = data.get('tasks',  {})
    print(f'  Weeks:  {sorted(weeks.keys())}')
    print(f'  Tasks:  {len(tasks)} entries')

    print(f'\nWriting to {"/".join(DEST_DOC)}...')
    dest_ref.set(data)

    print(f'\n✅ Done. users/test is now a fresh copy of users/me.')
    print(f'   Add VITE_USER_DOC_ID=test to your .env.local to use it locally.')

if __name__ == '__main__':
    main()