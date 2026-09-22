import re
from datetime import datetime
from typing import Dict, Any, List, Optional
import numpy as np
from PIL import Image
import io

# Lazy-loaded EasyOCR reader
_reader = None

def get_ocr_reader():
    global _reader
    if _reader is None:
        import easyocr
        # Initialize EasyOCR for English (CPU mode for universal compatibility)
        _reader = easyocr.Reader(['en'], gpu=False)
    return _reader

CATEGORY_KEYWORDS = {
  'Food': ['restaurant', 'cafe', 'bistro', 'kitchen', 'diner', 'burger', 'pizza', 'biryani', 'swiggy', 'zomato', 'food', 'bakery', 'coffee', 'tea'],
  'Groceries': ['supermarket', 'mart', 'grocer', 'provision', 'spices', 'milk', 'vegetable', 'fruit', 'reliance', 'dmart', 'bigbasket', 'blinkit', 'zepto'],
  'Transportation': ['fuel', 'petrol', 'diesel', 'gas', 'uber', 'ola', 'metro', 'auto', 'railway', 'toll', 'parking', 'cab'],
  'Shopping': ['clothing', 'apparel', 'fashion', 'store', 'retail', 'mall', 'footwear', 'amazon', 'flipkart', 'myntra', 'zara', 'h&m'],
  'Healthcare': ['pharmacy', 'chemist', 'hospital', 'clinic', 'medic', 'diagnostics', 'doctor', 'lab', 'health', 'apollo', 'pharmeasy'],
  'Entertainment': ['cinema', 'theatre', 'movie', 'multiplex', 'pvr', 'inox', 'games', 'bowling', 'park', 'concert'],
  'Bills': ['electricity', 'water', 'power', 'telecom', 'broadband', 'wifi', 'utility', 'gas bill', 'bill payment']
}

def guess_category(text: str) -> str:
    lower_text = text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', lower_text):
                return category
    return 'Other'

def extract_receipt_data(image_bytes: bytes) -> Dict[str, Any]:
    """
    Runs EasyOCR and applies domain-specific heuristic parsing to identify
    merchant, date, amounts, items, and probable category.
    """
    reader = get_ocr_reader()

    # Load image via PIL
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_np = np.array(image)

    # Perform OCR
    results = reader.readtext(image_np)

    if not results:
        return {
            "merchant": "Unknown Merchant",
            "amount": None,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "category": "Other",
            "items": [],
            "raw_text": "",
            "confidence": 0.0
        }

    extracted_lines = []
    confidences = []

    for bbox, text, confidence in results:
        clean_text = text.strip()
        if clean_text:
            extracted_lines.append(clean_text)
            confidences.append(confidence)

    raw_text = "\n".join(extracted_lines)
    avg_confidence = float(np.mean(confidences)) if confidences else 0.0

    # 1. Extract Merchant: Usually in top 3-4 lines, skipping headers
    merchant = None
    ignore_merchant_words = ['tax invoice', 'invoice', 'receipt', 'bill', 'cash memo', 'welcome', 'thank you', 'gstin', 'gst', 'tel', 'phone', 'date']
    for line in extracted_lines[:5]:
        lower_line = line.lower()
        if len(line) >= 3 and not any(w in lower_line for w in ignore_merchant_words) and not re.match(r'^[\d\W]+$', line):
            merchant = line
            break
    if not merchant and extracted_lines:
        merchant = extracted_lines[0]

    # 2. Extract Amount: Look for Total, Grand Total, Net, Amount Due, or highest currency match
    amount = None
    total_patterns = [
        r'(?:total|grand\s*total|net\s*amount|amount\s*due|balance\s*due|sub\s*total)[\s:=-]*[₹$€£Rs\.]*\s*([0-9]+(?:[,\.][0-9]{2})?)',
        r'[₹$€£Rs\.]\s*([0-9]+(?:[,\.][0-9]{2})?)',
        r'\b([0-9]+\.[0-9]{2})\b'
    ]

    for pattern in total_patterns:
        matches = re.findall(pattern, raw_text, re.IGNORECASE)
        if matches:
            candidates = []
            for m in matches:
                clean_num = m.replace(',', '')
                try:
                    val = float(clean_num)
                    if 0.5 <= val <= 500000:  # reasonable transaction bounds
                        candidates.append(val)
                except ValueError:
                    continue
            if candidates:
                amount = max(candidates)
                break

    # 3. Extract Date
    date_str = None
    date_patterns = [
        r'\b(20[2-3][0-9][-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12][0-9]|3[01]))\b',  # YYYY-MM-DD
        r'\b((?:0[1-9]|[12][0-9]|3[01])[-/](?:0[1-9]|1[0-2])[-/]20[2-3][0-9])\b',  # DD-MM-YYYY
        r'\b((?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12][0-9]|3[01])[-/]20[2-3][0-9])\b',  # MM-DD-YYYY
        r'\b((?:0[1-9]|[12][0-9]|3[01])\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+20[2-3][0-9])\b'
    ]

    for pattern in date_patterns:
        m = re.search(pattern, raw_text, re.IGNORECASE)
        if m:
            raw_date = m.group(1)
            # Try to format to YYYY-MM-DD
            for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y", "%d %b %Y", "%d %B %Y"):
                try:
                    dt = datetime.strptime(raw_date, fmt)
                    date_str = dt.strftime("%Y-%m-%d")
                    break
                except ValueError:
                    continue
            if date_str:
                break

    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")

    # 4. Extract Category
    category = guess_category(raw_text)

    # 5. Extract Candidate Line Items
    items = []
    for line in extracted_lines[1:]:
        # Filter lines that look like item descriptions (contains words, perhaps price)
        if len(line) > 3 and not re.match(r'^(total|subtotal|tax|gst|vat|cash|card|change|discount)', line, re.IGNORECASE):
            items.append(line)
        if len(items) >= 8:
            break

    return {
        "merchant": merchant or "Merchant",
        "amount": amount,
        "date": date_str,
        "category": category,
        "items": items,
        "raw_text": raw_text,
        "confidence": round(avg_confidence, 2)
    }
