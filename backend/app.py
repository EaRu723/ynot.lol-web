from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

sites = {
    "yevbar": {"name": "Yev's Site", "url": "https://yev.bar"},
    "asurve": {"name": "Arnav's Site", "url": "https://surve.dev"},
    "andrea": {
        "name": "Andrea's Site",
        "url": "https://v2-embednotion.com/13c7550ba3aa8009b2d3d2ed16633852",
    },
    "repete": {"name": "Repete's Site", "url": "https://repete.art"},
    "ibiyemi": {"name": "Ibiyemi's Site", "url": "http://ibiyemiabiodun.com"},
    "jason": {"name": "Jason's Site", "url": "https://jasonaa.me"},
    "sama": {"name": "Sam's Site", "url": "https://blog.samaltman.com"},
}


@app.route("/ping")
def ping():
    return jsonify({"message": "pong"})


@app.route("/api/sites", methods=["GET"])
def get_sites():
    return jsonify(sites)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    build_dir = 'ynot-frontend/.next'
    if path and os.path.exists(os.path.join(build_dir, path)):
        return send_from_directory(build_dir, path)
    try:
        return send_from_directory(build_dir, 'server/pages/index.html')
    except:
        return f"Error: Build directory content: {os.listdir(build_dir) if os.path.exists(build_dir) else 'build dir not found'}"


if __name__ == "__main__":
    app.run(debug=True)
