from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from typing import List
import shutil
import os
import zipfile
from services.scan import DocScanner
from utils.file_utils import is_valid_image_format, clear_directory
from config import VALID_FORMATS, INPUT_DIR, OUTPUT_DIR

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("")
async def upload_images(files: List[UploadFile]):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    # Clear previous files
    clear_directory(INPUT_DIR)
    clear_directory(OUTPUT_DIR)

    # Save uploaded files
    for file in files:
        if not is_valid_image_format(file.filename, VALID_FORMATS):
            raise HTTPException(
                status_code=400, detail=f"Invalid file format: {file.filename}")

        file_path = os.path.join(INPUT_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # Process images
    for filename in os.listdir(INPUT_DIR):
        input_path = os.path.join(INPUT_DIR, filename)
        scanner = DocScanner(False)
        scanner.scan(input_path,OUTPUT_DIR)

    # Create ZIP file for output images
    zip_buffer = os.path.join("", "processed_images.zip")
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for filename in os.listdir(OUTPUT_DIR):
            if filename != "processed_images.zip":
                zip_file.write(os.path.join(OUTPUT_DIR, filename), filename)

    return StreamingResponse(open(zip_buffer, "rb"), media_type="application/zip",
                             headers={"Content-Disposition": "attachment; filename=processed_images.zip"})