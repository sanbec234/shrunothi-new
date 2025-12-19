#!/usr/bin/env python3
"""
mock_frontend_adapter.py

Standalone mock backend for frontend testing.

Run:
  python mock_frontend_adapter.py

This will run on :5001 by default (so it doesn't conflict with your real backend on :5000).
Point VITE_API_URL to http://localhost:5001 while testing the UI.
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import datetime
import os

app = Flask(__name__)
CORS(app)

# -------------------------
# In-memory test data
# -------------------------
GENRES = [
    {"id": "tech", "name": "Technology"},
    {"id": "business", "name": "Business"},
    {"id": "health", "name": "Health"},
    {"id": "history", "name": "History"},
    {"id": "comedy", "name": "Comedy"}
]

GENRE_QUESTIONS = {
    "tech": [
        "What's the latest in AI this week?",
        "How do I secure my home Wi-Fi?",
        "What is edge computing?",
        "Explain the difference between LLM and transformers.",
        "What are practical uses of blockchain today?"
    ],
    "business": [
        "How to price my first product?",
        "What are the basics of cash flow forecasting?",
        "How do I write a simple business plan?",
        "What metrics should an early startup track?",
        "How to approach B2B sales initially?"
    ],
    "health": [
        "What are evidence-based ways to improve sleep?",
        "How much protein should I eat daily?",
        "What's the difference between a virus and bacteria?",
        "How to start a simple home workout routine?",
        "How does intermittent fasting work?"
    ],
    "history": [
        "What started the Industrial Revolution?",
        "Why did the Roman Empire fall?",
        "What was the Silk Road?",
        "How did the printing press change society?",
        "Who were the key figures in the American Revolution?"
    ],
    "comedy": [
        "Who are the top stand-up comedians today?",
        "How to write a short comedy sketch?",
        "What makes an observational joke work?",
        "How do comedians handle hecklers?",
        "What are classic comedy timing tips?"
    ]
}

# Spotify embed-friendly URLs (show or episode embed links). Replace later with your own.
GENRE_PODCASTS = {
    "tech": [
        {"embed_url": "https://open.spotify.com/embed/show/1jBNbPVlGUen3sWdd25ho6", "title": "Techmeme Ride Home"},
        {"embed_url": "https://open.spotify.com/embed/show/08zQP2peZmM9GrcKShLZvC", "title": "The Vergecast"},
        {"embed_url": "https://open.spotify.com/embed/show/78tmD82Pq4EwnJ7OiHNBwM", "title": "TechDaily.ai"},
        {"embed_url": "https://open.spotify.com/embed/show/5Mjx3ahpNvwnluR0s9oA9A", "title": "Made2nspire"},
        {"embed_url": "https://open.spotify.com/embed/show/6msrAmsSEA7BslElVJ02zX", "title": "Level Up Leadership"}
    ],
    "business": [
        {"embed_url": "https://open.spotify.com/embed/show/2XUv1q2j1g8RFK27o3Qf5S", "title": "HBR IdeaCast"},
        {"embed_url": "https://open.spotify.com/embed/show/3y5z1xvYzLx1e2jzV5u7Ae", "title": "Planet Money"},
        {"embed_url": "https://open.spotify.com/embed/show/5Dbw4k4d8K6h5zO0d2k6gV", "title": "How I Built This"},
        {"embed_url": "https://open.spotify.com/embed/show/0Ily8EYlNF2uL4OiaAjzir", "title": "The Film & Business Mix"},
        {"embed_url": "https://open.spotify.com/embed/show/5Mjx3ahpNvwnluR0s9oA9A", "title": "Made2nspire"}
    ],
    "health": [
        {"embed_url": "https://open.spotify.com/embed/show/7r9d1b8KjQF1pV2F3Xw1Yq", "title": "Ten Percent Happier"},
        {"embed_url": "https://open.spotify.com/embed/show/6gwgrqZuYIw5gVaSjisQ1R", "title": "Talking Indonesia"},
        {"embed_url": "https://open.spotify.com/embed/show/2Wn4Qx7f0b4lWfX4G8qE2R", "title": "The Nutrition Diva"},
        {"embed_url": "https://open.spotify.com/embed/show/1EdV8d0B8bGxln1YXe2Ncm", "title": "Aww Shift"},
        {"embed_url": "https://open.spotify.com/embed/show/6msrAmsSEA7BslElVJ02zX", "title": "Level Up Leadership"}
    ],
    "history": [
        {"embed_url": "https://open.spotify.com/embed/show/0RjNz8XDkLdbKZuj9Pktyh", "title": "Cinematologists Podcast"},
        {"embed_url": "https://open.spotify.com/embed/show/3cLpB25PSKhBKvX15PApXw", "title": "The Vergecast"},
        {"embed_url": "https://open.spotify.com/embed/show/4rOoJ6Egrf8K2IrywzwOMk", "title": "Joe Rogan Experience"},
        {"embed_url": "https://open.spotify.com/embed/show/6gwgrqZuYIw5gVaSjisQ1R", "title": "Talking Indonesia"},
        {"embed_url": "https://open.spotify.com/embed/show/0Ily8EYlNF2uL4OiaAjzir", "title": "Film & Culture"}
    ],
    "comedy": [
        {"embed_url": "https://open.spotify.com/embed/show/4rOoJ6Egrf8K2IrywzwOMk", "title": "Joe Rogan Experience"},
        {"embed_url": "https://open.spotify.com/embed/show/42kxHmWquXQBJCxG0rXvu6", "title": "Reply All"},
        {"embed_url": "https://open.spotify.com/embed/show/3cLpB25PSKhBKvX15PApXw", "title": "The Vergecast"},
        {"embed_url": "https://open.spotify.com/embed/show/6Z5KbERnhb5PquJuaxOlq6", "title": "Various Comedy Shows"},
        {"embed_url": "https://open.spotify.com/embed/show/1EdV8d0B8bGxln1YXe2Ncm", "title": "Aww Shift"}
    ]
}

GLOBAL_SUGGESTIONS = [
    "How do I improve product photos for ecommerce?",
    "What are quick ways to build user trust online?",
    "How to write better product titles for Google Shopping?",
    "What's the simplest SEO checklist for a new site?",
    "How to set up shipping and rates for an Indian ecommerce store?"
]

# -------------------------
# Helpers & routes
# -------------------------
def pick_random(arr, n=4):
    arr = list(arr)
    random.shuffle(arr)
    return arr[:n]

@app.route("/genres", methods=["GET"])
def get_genres():
    return jsonify(GENRES), 200

@app.route("/genres/<genre_id>/questions", methods=["GET"])
def genre_questions(genre_id):
    qs = GENRE_QUESTIONS.get(genre_id, [])
    return jsonify({"questions": qs}), 200

@app.route("/genres/<genre_id>/podcasts", methods=["GET"])
def genre_podcasts(genre_id):
    pods = GENRE_PODCASTS.get(genre_id, [])
    return jsonify({"podcasts": pods}), 200

@app.route("/suggestions", methods=["GET"])
def suggestions():
    return jsonify({"questions": pick_random(GLOBAL_SUGGESTIONS, 4)}), 200

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json() or {}
    question = data.get("question", "").strip()
    genre_id = data.get("genreId")
    if not question:
        return jsonify({"error": "question required"}), 400

    genre_name = next((g["name"] for g in GENRES if g["id"] == genre_id), None)
    answer = f"Mock answer: You asked \"{question}\""
    if genre_name:
        answer += f" (genre: {genre_name})"
    answer += " — this is a mocked response for frontend testing."

    return jsonify({"answer": answer, "asked_at": datetime.datetime.utcnow().isoformat() + "Z"}), 200

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "time": datetime.datetime.utcnow().isoformat() + "Z"}), 200

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CORPUS_DIR = os.path.join(BASE_DIR, "corpus")

@app.route("/genres/<genre_id>/material", methods=["GET"])
def genre_material(genre_id):
    material_dir = os.path.join(CORPUS_DIR, "material")

    if not os.path.isdir(material_dir):
        return jsonify([]), 200

    docs = []

    for fname in os.listdir(material_dir):
        if not fname.endswith(".txt"):
            continue

        file_path = os.path.join(material_dir, fname)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            # Expecting:
            # line 1 → filename (title)
            # line 2 → genre
            # line 3 → author
            if len(lines) < 3:
                continue

            filename = lines[0].strip()
            file_genre = lines[1].strip().lower()
            author = lines[2].strip() or "Unknown"

            if file_genre != genre_id.lower():
                continue

            docs.append({
                "id": fname,
                "filename": filename,
                "author": author
            })

        except Exception as e:
            print(f"Failed reading {fname}: {e}")

    return jsonify(docs), 200

@app.route("/material/<file_id>", methods=["GET"])
def get_material_file(file_id):
    material_path = os.path.join(CORPUS_DIR, "material", file_id)
    self_help_path = os.path.join(CORPUS_DIR, "self-help", file_id)

    if os.path.isfile(material_path):
        file_path = material_path
    elif os.path.isfile(self_help_path):
        file_path = self_help_path
    else:
        return jsonify({"error": "File not found"}), 404

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # Skip metadata:
        # line 1 → title
        # line 2 → genre
        # line 3 → author
        # line 4 → blank
        content = "".join(lines[4:]).strip() if len(lines) > 4 else ""

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "id": file_id,
        "content": content
    }), 200

@app.route("/corpus/self-help", methods=["GET"])
def self_help_corpus():
    self_help_dir = os.path.join(CORPUS_DIR, "self-help")
    
    if not os.path.isdir(self_help_dir):
        return jsonify([]), 200

    docs = []

    for fname in os.listdir(self_help_dir):
        if not fname.endswith(".txt"):
            continue

        file_path = os.path.join(self_help_dir, fname)

        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        title = lines[0].strip() if len(lines) > 0 else fname
        author = lines[2].strip() if len(lines) > 2 else "Unknown"
        preview = " ".join(lines[3:]).strip()

        docs.append({
            "id": fname,
            "filename": title,
            "author": author,
            "preview": preview
        })

    return jsonify(docs), 200
    
if __name__ == "__main__":
    print("Mock frontend adapter running on http://0.0.0.0:5001")
    app.run(host="0.0.0.0", port=5001, debug=True)
