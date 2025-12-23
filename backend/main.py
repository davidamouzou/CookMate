import json
from datetime import datetime
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from config import config
from routers import generate, recipes, upload


app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://cook-book-ruby.vercel.app",
        "https://www.coooke.fr",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(generate.router)
app.include_router(recipes.router)
app.include_router(upload.router)


@app.middleware("http")
async def verify_api_key(request: Request, call_next):
    # Laisser passer OPTIONS (CORS preflight)
    if request.method == "OPTIONS":
        return await call_next(request)

    if request.url.path == '/' or request.url.path.startswith('/docs'):
        return await call_next(request)

    api_key = request.headers.get('api-key')
    if api_key != config.get('API_KEY'):
        return Response(
            content=json.dumps({
                "code": "unauthorized",
                "message": "You are not authorized to access this service",
                "details": "Invalid API key"
            }),
            status_code=401,
            media_type="application/json"
        )

    return await call_next(request)


@app.get("/")
def root():
    return {
        "status": "success",
        "message": "Recipe Generator API is running.", 
        "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "server_timezone": datetime.now().astimezone().tzname(),
    }