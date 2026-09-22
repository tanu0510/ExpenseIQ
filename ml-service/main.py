import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import health, ocr, predict, anomaly

app = FastAPI(
    title="ExpenseIQ ML & OCR Service",
    description="Machine Learning service providing spending predictions, anomaly detection, and receipt OCR for ExpenseIQ.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(ocr.router)
app.include_router(predict.router)
app.include_router(anomaly.router)

@app.get("/")
def root():
    return {
        "service": "ExpenseIQ Machine Learning & OCR Engine",
        "docs_url": "/docs",
        "health_url": "/health"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
