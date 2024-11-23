from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel


app = FastAPI()


class Site(BaseModel):
    name: str
    url: str
    tags: list
    metadata: str


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure templates directory
templates = Jinja2Templates(directory="templates")

sites = {
    "1": {
        "name": "yev_barkalov",
        "url": "https://yev.bar",
        "tags": ["personal", "blog", "tech", "life", "developer"],
        "metadata": "Yev's personal blog about technology and life.",
    },
    "2": {
        "name": "arnav_surve",
        "url": "https://surve.dev",
        "tags": ["portfolio", "developer"],
        "metadata": "Arnav's portfolio showcasing his projects and skills.",
    },
    "3": {
        "name": "andrea_russo",
        "url": "https://v2-embednotion.com/13c7550ba3aa8009b2d3d2ed16633852",
        "tags": ["notion", "productivity"],
        "metadata": "Andrea's site about productivity tips and Notion templates.",
    },
    "4": {
        "name": "peter_cybriwsky",
        "url": "https://repete.art",
        "tags": ["art", "gallery", "artist", "portfolio"],
        "metadata": "Repete's online art gallery showcasing his artwork.",
    },
    "5": {
        "name": "ibiyemi_abiodun",
        "url": "http://ibiyemiabiodun.com",
        "tags": ["music", "artist", "events"],
        "metadata": "Ibiyemi's official site featuring her music and upcoming events.",
    },
    "6": {
        "name": "jason_antwi-appah",
        "url": "https://jasonaa.me",
        "tags": ["tech", "blog", "developer", "software"],
        "metadata": "Jason's tech blog covering the latest in software development.",
    },
    "7": {
        "name": "sam_altman",
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
    "8": {
        "name": "paul_graham",
        "url": "https://paulgraham.com",
        "tags": ["startup", "investment", "entrepreneurship", "blog", "tech"],
        "metadata": "Paul Graham's blog about startups, investments, and entrepreneurship.",
    },
    "9": {
        "name": "andrej_karpathy",
        "url": "https://knotbin.xyz",
        "tags": ["ai", "research", "blog", "tech"],
        "metadata": "Andrej Karpathy's blog about AI research and technology.",
    },
    "10": {
        "name": "matt_yao",
        "url": "https://mattyao.co",
        "tags": ["career", "blog", "tech", "life"],
        "metadata": "Matt Yao's blog about career coaching.",
    },
    "11": {
        "name": "ross_lazerowitz",
        "url": "https://rosslazer.com",
        "tags": ["personal", "blog", "tech", "life", "developer", "software", "ai"],
        "metadata": "Ross's personal blog about technology and life.",
    },
}


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/ping")
async def ping():
    return {"message": "pong"}


@app.get("/api/sites", response_model=list[Site])
async def get_sites():
    return [Site(**site) for site in sites.values()]
