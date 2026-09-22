from fastapi import APIRouter
from models.schemas import AnomalyRequest, AnomalyResponse
from services.anomaly_detector import detect_spending_anomalies

router = APIRouter(tags=["Anomaly Detection"])

@router.post("/detect-anomalies", response_model=AnomalyResponse)
def detect_anomalies_endpoint(payload: AnomalyRequest):
    return detect_spending_anomalies(payload.transactions, payload.contamination or 0.08)
