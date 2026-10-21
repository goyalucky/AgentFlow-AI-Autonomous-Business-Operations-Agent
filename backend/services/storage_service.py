import os
import json
from typing import List, Dict, Any

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
TASKS_FILE = os.path.join(DATA_DIR, "tasks.json")

def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(TASKS_FILE):
        with open(TASKS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)

def load_tasks() -> List[Dict[str, Any]]:
    ensure_data_dir()
    try:
        with open(TASKS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_tasks(tasks: List[Dict[str, Any]]) -> None:
    ensure_data_dir()
    temp_file = f"{TASKS_FILE}.tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(tasks, f, indent=2, default=str)
    os.replace(temp_file, TASKS_FILE)