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
        "https://www.coooke.fr",
        "https://cook-book-ruby.vercel.app",
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
    api_key = request.headers.get('api-key')
    if request.url.path == '/' or request.url.path.startswith('/docs'):
        return await call_next(request)
    
    if api_key != config.get('API_KEY'):
        return Response(content=json.dumps(
            {
            "code": "unauthorized",
            "message": "You are not authorized to access this service",
            "details": "Invalid API key"
        }
        ), status_code=401)
    return await call_next(request)


@app.get("/")
def root():
    return {
        "status": "success",
        "message": "Recipe Generator API is running.", 
        "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "server_timezone": datetime.now().astimezone().tzname(),
    }