from fastapi import FastAPI
from routers import upload

app = FastAPI(title="FastAPI Image Processor")

# Include the upload router
app.include_router(upload.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
