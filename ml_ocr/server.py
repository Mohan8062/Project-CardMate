from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import uuid

# Import your OCR function
from ml_ocr.ocr import extract_structured_from_image

app = FastAPI()

# Enable CORS for all origins (adjust for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "OCR API Running"}

@app.post("/ocr")
async def ocr_api(file: UploadFile = File(...)):
    # Generate a unique temp filename to avoid conflicts
    temp_path = f"temp_upload_{uuid.uuid4().hex}.jpg"
    try:
        # Save uploaded file
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        # Extract structured data
        result = extract_structured_from_image(temp_path)

        return {"data": result}

    except Exception as e:
        return {"error": f"OCR processing failed: {str(e)}"}

    finally:
        # Remove temp file if it exists
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    uvicorn.run("ml_ocr.server:app", host="0.0.0.0", port=5000, reload=True)
