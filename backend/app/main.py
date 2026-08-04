from fastapi import FastAPI

app = FastAPI(title="AgriDroneIOT Backend")

@app.get("/")
def root():
    return {"status": "ok", "message": "AgriDroneIOT backend running"}

@app.get("/health")
def health():
    return {"health": "good"}
