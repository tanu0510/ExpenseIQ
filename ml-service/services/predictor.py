import pandas as pd
import numpy as np
from typing import List, Dict, Any
from sklearn.linear_model import Ridge
from models.schemas import TransactionItem, PredictResponse, CategoryPrediction

MINIMUM_DATA_POINTS = 5

def predict_future_expenses(transactions: List[TransactionItem]) -> Dict[str, Any]:
    """
    Predicts next-month total and category expenses using historical transaction data.
    Uses scikit-learn Ridge regression on temporal/lagged features.
    Gracefully handles insufficient data without hallucinating figures.
    """
    # Filter only expenses
    expense_txns = [t for t in transactions if (t.type or "expense").lower() == "expense"]

    if len(expense_txns) < MINIMUM_DATA_POINTS:
        return {
            "has_sufficient_data": False,
            "message": f"Not enough historical data for reliable prediction. At least {MINIMUM_DATA_POINTS} expense records are required (found {len(expense_txns)}).",
            "predicted_total": 0.0,
            "category_predictions": [],
            "historical_monthly_average": 0.0,
            "trend_direction": "insufficient_data",
            "model_used": "Scikit-Learn Ridge Regression",
            "data_points_analyzed": len(expense_txns)
        }

    # Build DataFrame
    data = []
    for t in expense_txns:
        try:
            dt = pd.to_datetime(t.date)
            data.append({
                "date": dt,
                "amount": float(t.amount),
                "category": t.category,
                "year_month": dt.strftime("%Y-%m"),
                "day_of_week": dt.dayofweek,
                "day": dt.day
            })
        except Exception:
            continue

    if len(data) < MINIMUM_DATA_POINTS:
        return {
            "has_sufficient_data": False,
            "message": "Not enough valid dated transactions for prediction.",
            "predicted_total": 0.0,
            "category_predictions": [],
            "historical_monthly_average": 0.0,
            "trend_direction": "insufficient_data",
            "model_used": "Scikit-Learn Ridge Regression",
            "data_points_analyzed": len(data)
        }

    df = pd.DataFrame(data)

    # 1. Monthly Aggregations
    monthly_df = df.groupby("year_month")["amount"].sum().reset_index()
    monthly_df = monthly_df.sort_values("year_month").reset_index(drop=True)

    hist_avg = float(monthly_df["amount"].mean()) if len(monthly_df) > 0 else float(df["amount"].sum())

    # 2. Time-series feature engineering
    # If user has multiple months of data, train Ridge regression over month indices and rolling averages
    if len(monthly_df) >= 2:
        monthly_df["time_idx"] = np.arange(len(monthly_df))
        monthly_df["rolling_3m"] = monthly_df["amount"].rolling(window=2, min_periods=1).mean()

        X = monthly_df[["time_idx", "rolling_3m"]].values
        y = monthly_df["amount"].values

        model = Ridge(alpha=1.0)
        model.fit(X, y)

        next_time_idx = len(monthly_df)
        next_rolling = float(monthly_df["amount"].tail(2).mean())
        next_X = np.array([[next_time_idx, next_rolling]])

        pred_total = float(model.predict(next_X)[0])
        # Bound predicted total within realistic range of historical variance
        pred_total = max(hist_avg * 0.4, min(pred_total, hist_avg * 2.5))
    else:
        # If single month, project based on daily rate extrapolation + category distributions
        total_spent = float(df["amount"].sum())
        num_days = max(1, df["day"].nunique())
        daily_rate = total_spent / num_days
        pred_total = float(daily_rate * 30.0)

    # Round total
    pred_total = round(float(pred_total), 2)

    # Trend direction
    if pred_total > hist_avg * 1.05:
        trend = "increasing"
    elif pred_total < hist_avg * 0.95:
        trend = "decreasing"
    else:
        trend = "stable"

    # 3. Category-wise Projections using weighted category proportions
    cat_proportions = df.groupby("category")["amount"].sum() / df["amount"].sum()
    cat_preds = []

    for cat, prop in cat_proportions.items():
        cat_amount = round(float(pred_total * prop), 2)
        cat_preds.append(
            CategoryPrediction(
                category=str(cat),
                predicted_amount=cat_amount,
                percentage=round(float(prop * 100), 1)
            )
        )

    # Sort categories by predicted amount descending
    cat_preds.sort(key=lambda x: x.predicted_amount, reverse=True)

    return {
        "has_sufficient_data": True,
        "message": "Future expenses forecasted using Scikit-Learn Ridge Regression based on your historical spending trajectory.",
        "predicted_total": pred_total,
        "category_predictions": cat_preds,
        "historical_monthly_average": round(hist_avg, 2),
        "trend_direction": trend,
        "model_used": "Scikit-Learn Ridge Regression (with lagged & temporal features)",
        "data_points_analyzed": len(df)
    }
