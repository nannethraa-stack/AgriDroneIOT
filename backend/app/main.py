from fastapi import FastAPI
from .api import router as api_router

app = FastAPI(title="AgriDroneIOT Backend")

app.include_router(api_router)

@app.get("/")
def root():
    return {"status": "ok", "message": "AgriDroneIOT backend running"}

@app.get("/health")
def health():
    return {"health": "good"}
