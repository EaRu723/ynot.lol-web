from flask import Flask, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

sites = {
    "yev_barkalov": {
        "name": "Yev's Site",
        "url": "https://yev.bar",
        "tags": ["personal", "blog", "tech", "life", "developer"],
        "metadata": "Yev's personal blog about technology and life.",
    },
    "arnav_surve": {
        "name": "Arnav's Site",
        "url": "https://surve.dev",
        "tags": ["portfolio", "developer"],
        "metadata": "Arnav's portfolio showcasing his projects and skills.",
    },
    "andrea_russo": {
        "name": "Andrea's Site",
        "url": "https://v2-embednotion.com/13c7550ba3aa8009b2d3d2ed16633852",
        "tags": ["notion", "productivity"],
        "metadata": "Andrea's site about productivity tips and Notion templates.",
    },
    "peter_cybriwsky": {
        "name": "Repete's Site",
        "url": "https://repete.art",
        "tags": ["art", "gallery", "artist", "portfolio"],
        "metadata": "Repete's online art gallery showcasing his artwork.",
    },
    "ibiyemi_abiodun": {
        "name": "Ibiyemi's Site",
        "url": "http://ibiyemiabiodun.com",
        "tags": ["music", "artist", "events"],
        "metadata": "Ibiyemi's official site featuring her music and upcoming events.",
    },
    "jason_antwi-appah": {
        "name": "Jason's Site",
        "url": "https://jasonaa.me",
        "tags": ["tech", "blog", "developer", "software"],
        "metadata": "Jason's tech blog covering the latest in software development.",
    },
    "sam_altman": {
        "name": "Sam's Site",
        "url": "https://blog.samaltman.com",
        "tags": [
            "startup",
            "investment",
            "entrepreneurship",
            "blog",
            "tech",
            "business",
            "ai",
        ],
        "metadata": "Sam Altman's blog about startups, investments, and entrepreneurship.",
    },
    "paul_graham": {
        "name": "Paul's Site",
        "url": "https://paulgraham.com",
        "tags": ["startup", "investment", "entrepreneurship", "blog", "tech"],
        "metadata": "Paul Graham's blog about startups, investments, and entrepreneurship.",
    },
    "andrej_karpathy": {
        "name": "Andrej's Site",
        "url": "https://knotbin.xyz",
        "tags": ["ai", "research", "blog", "tech"],
        "metadata": "Andrej Karpathy's blog about AI research and technology.",
    },
    "matt_yao": {
        "name": "Matt's Site",
        "url": "https://mattyao.co",
        "tags": ["career", "blog", "tech", "life"],
        "metadata": "Matt Yao's blog about career coaching.",
    },
    "ross_lazerowitz": {
        "name": "Ross's Site",
        "url": "https://rosslazer.com",
        "tags": ["personal", "blog", "tech", "life", "developer", "software", "ai"],
        "metadata": "Ross's personal blog about technology and life.",
    },
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/ping")
def ping():
    return jsonify({"message": "pong"})


@app.route("/api/sites", methods=["GET"])
def get_sites():
    return jsonify(sites)


if __name__ == "__main__":
    app.run(debug=True)
