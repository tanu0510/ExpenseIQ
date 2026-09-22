from pydantic import BaseModel, Field
from typing import List, Optional

class TransactionItem(BaseModel):
    id: Optional[str] = None
    amount: float
    category: str
    date: str
    type: Optional[str] = "expense"
    description: Optional[str] = ""

class PredictRequest(BaseModel):
    transactions: List[TransactionItem]
    target_month: Optional[int] = None
    target_year: Optional[int] = None

class CategoryPrediction(BaseModel):
    category: str
    predicted_amount: float
    percentage: float

class PredictResponse(BaseModel):
    has_sufficient_data: bool
    message: str
    predicted_total: float
    category_predictions: List[CategoryPrediction]
    historical_monthly_average: float
    trend_direction: str
    model_used: str
    data_points_analyzed: int

class AnomalyItem(BaseModel):
    transaction_id: Optional[str] = None
    amount: float
    category: str
    date: str
    description: Optional[str] = ""
    anomaly_score: float
    is_anomaly: bool
    reason: str

class AnomalyRequest(BaseModel):
    transactions: List[TransactionItem]
    contamination: Optional[float] = 0.08

class AnomalyResponse(BaseModel):
    total_analyzed: int
    anomalies_detected: int
    anomalies: List[AnomalyItem]
    algorithm: str
    message: str

class OCRResponse(BaseModel):
    merchant: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    category: Optional[str] = "Other"
    items: List[str] = []
    raw_text: str = ""
    confidence: float = 0.0
