from fastapi import APIRouter
from models.schemas import PredictRequest, PredictResponse
from services.predictor import predict_future_expenses

router = APIRouter(tags=["Expense Prediction"])

@router.post("/predict-expenses", response_model=PredictResponse)
def predict_expenses_endpoint(payload: PredictRequest):
    return predict_future_expenses(payload.transactions)
