from fastapi import APIRouter, File, UploadFile, HTTPException
from models.schemas import OCRResponse
from services.ocr_extractor import extract_receipt_data

router = APIRouter(prefix="/ocr", tags=["Receipt OCR"])

@router.post("/extract", response_model=OCRResponse)
async def extract_receipt(file: UploadFile = File(...)):
    # Validate content type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type {file.content_type}. Only JPEG, PNG, and WEBP supported.")

    try:
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:  # 10 MB limit
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10 MB.")

        result = extract_receipt_data(contents)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
