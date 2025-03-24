from fastapi import APIRouter, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import shutil
import os
import json
from services.scan import DocScanner
from utils.file_utils import is_valid_image_format, clear_directory
from config import VALID_FORMATS, INPUT_DIR, OUTPUT_DIR
# Import the pipeline function from your MCQ module
from services.question_extraction import pipeline

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
                status_code=400, detail=f"Invalid file format: {file.filename}"
            )
        file_path = os.path.join(INPUT_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # Process images (e.g., cleanup, enhancement) with DocScanner
    for filename in os.listdir(INPUT_DIR):
        input_path = os.path.join(INPUT_DIR, filename)
        scanner = DocScanner(False)
        scanner.scan(input_path, OUTPUT_DIR)

    # Extract MCQs from each original image and aggregate the results
    all_questions = {}
    for filename in os.listdir(INPUT_DIR):
        image_path = os.path.join(INPUT_DIR, filename)
        try:
            mcq_result = pipeline(image_path)
            all_questions[filename] = mcq_result["questions"]
        except Exception as e:
            all_questions[filename] = f"Error processing image: {e}"

    # Return the JSON response directly
    return JSONResponse(content=all_questions)
