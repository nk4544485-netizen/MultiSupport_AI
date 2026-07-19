from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.admin import router as admin_router
from app.api.dashboard import router as dashboard_router
from app.api.document import router as document_router
from app.api.websocket import router as websocket_router

app = FastAPI(
    title="MultiSupport AI Backend",
    version="1.0.0",
    description="AI Powered Multi-Agent Customer Support System"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # Your old Vercel deployment
        "https://multi-support-ai-delta.vercel.app",

        # Your current Vercel deployment
        "https://multi-support-b6n9csppj-nk4544485-4323s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================
# Rate Limiting & Security Middlewares
# ===========================
import time
from fastapi import Request
from fastapi.responses import JSONResponse

class MemoryRateLimiter:
    def __init__(self, requests_limit: int = 100, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.history = {}

    def is_rate_limited(self, ip: str) -> bool:
        now = time.time()
        if ip not in self.history:
            self.history[ip] = []
        self.history[ip] = [t for t in self.history[ip] if now - t < self.window_seconds]
        
        if len(self.history[ip]) >= self.requests_limit:
            return True
        self.history[ip].append(now)
        return False

limiter = MemoryRateLimiter(requests_limit=100, window_seconds=60) # 100 req/min

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    if request.method != "OPTIONS" and not request.url.path.startswith("/ws") and not request.url.path == "/":
        if limiter.is_rate_limited(client_ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down."}
            )
    return await call_next(request)

@app.middleware("http")
async def secure_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ===========================
# Register API Routers
# ===========================

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(admin_router)
app.include_router(dashboard_router)
app.include_router(document_router)
app.include_router(websocket_router)


# ===========================
# Root API
# ===========================

@app.get("/")
def root():
    return {
        "success": True,
        "project": "MultiSupport AI",
        "message": "Welcome to MultiSupport AI Backend",
        "version": "1.0.0"
    }