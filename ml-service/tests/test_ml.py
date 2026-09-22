import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_predict_insufficient_data():
    payload = {
        "transactions": [
            {"amount": 500, "category": "Food", "date": "2026-03-01", "type": "expense"},
            {"amount": 300, "category": "Food", "date": "2026-03-02", "type": "expense"}
        ]
    }
    response = client.post("/predict-expenses", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["has_sufficient_data"] is False
    assert "Not enough historical data" in data["message"]

def test_predict_with_valid_historical_data():
    payload = {
        "transactions": [
            {"amount": 1200, "category": "Food", "date": "2026-01-05", "type": "expense"},
            {"amount": 800, "category": "Groceries", "date": "2026-01-15", "type": "expense"},
            {"amount": 500, "category": "Transportation", "date": "2026-01-20", "type": "expense"},
            {"amount": 1500, "category": "Food", "date": "2026-02-05", "type": "expense"},
            {"amount": 900, "category": "Groceries", "date": "2026-02-15", "type": "expense"},
            {"amount": 600, "category": "Transportation", "date": "2026-02-22", "type": "expense"},
            {"amount": 1300, "category": "Food", "date": "2026-03-04", "type": "expense"}
        ]
    }
    response = client.post("/predict-expenses", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["has_sufficient_data"] is True
    assert data["predicted_total"] > 0
    assert len(data["category_predictions"]) > 0
    assert "Ridge Regression" in data["model_used"]

def test_anomaly_detection():
    # Regular cluster around 200-500, plus one massive outlier of 45,000
    txns = [
        {"id": "t1", "amount": 350, "category": "Food", "date": "2026-02-01", "type": "expense"},
        {"id": "t2", "amount": 400, "category": "Food", "date": "2026-02-03", "type": "expense"},
        {"id": "t3", "amount": 300, "category": "Food", "date": "2026-02-05", "type": "expense"},
        {"id": "t4", "amount": 250, "category": "Food", "date": "2026-02-08", "type": "expense"},
        {"id": "t5", "amount": 450, "category": "Food", "date": "2026-02-10", "type": "expense"},
        {"id": "t6", "amount": 320, "category": "Food", "date": "2026-02-12", "type": "expense"},
        {"id": "t7", "amount": 280, "category": "Food", "date": "2026-02-15", "type": "expense"},
        {"id": "t8", "amount": 390, "category": "Food", "date": "2026-02-18", "type": "expense"},
        {"id": "t9", "amount": 310, "category": "Food", "date": "2026-02-20", "type": "expense"},
        {"id": "t10", "amount": 45000, "category": "Food", "date": "2026-02-22", "type": "expense", "description": "Suspicious large spike"}
    ]

    response = client.post("/detect-anomalies", json={"transactions": txns, "contamination": 0.10})
    assert response.status_code == 200
    data = response.json()
    assert data["total_analyzed"] == 10
    assert data["anomalies_detected"] >= 1
    assert "Isolation Forest" in data["algorithm"]

    # Check that the 45000 transaction was detected as the top anomaly
    top_anom = data["anomalies"][0]
    assert top_anom["amount"] == 45000
    assert "Unusual spending pattern detected" in top_anom["reason"]
