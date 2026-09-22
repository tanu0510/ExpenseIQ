import pandas as pd
import numpy as np
from typing import List, Dict, Any
from sklearn.ensemble import IsolationForest
from models.schemas import TransactionItem, AnomalyItem

MIN_ANOMALY_SAMPLES = 4

def detect_spending_anomalies(
    transactions: List[TransactionItem],
    contamination: float = 0.08
) -> Dict[str, Any]:
    """
    Applies Scikit-Learn IsolationForest to detect statistical outliers
    in user spending patterns without labeling transactions as fraud.
    """
    expense_txns = [t for t in transactions if (t.type or "expense").lower() == "expense"]

    if len(expense_txns) < MIN_ANOMALY_SAMPLES:
        return {
            "total_analyzed": len(expense_txns),
            "anomalies_detected": 0,
            "anomalies": [],
            "algorithm": "Scikit-Learn Isolation Forest",
            "message": f"Requires at least {MIN_ANOMALY_SAMPLES} transactions to establish a statistical spending baseline (found {len(expense_txns)})."
        }

    # Extract transaction features
    records = []
    for idx, t in enumerate(expense_txns):
        try:
            dt = pd.to_datetime(t.date)
            records.append({
                "index": idx,
                "id": t.id or f"txn-{idx}",
                "amount": float(t.amount),
                "category": t.category,
                "date": str(t.date),
                "description": t.description or "",
                "day_of_week": dt.dayofweek,
                "day": dt.day
            })
        except Exception:
            continue

    df = pd.DataFrame(records)

    # Compute category-level historical statistics
    cat_means = df.groupby("category")["amount"].mean().to_dict()
    cat_stds = df.groupby("category")["amount"].std().fillna(1.0).to_dict()
    cat_counts = df["category"].value_counts(normalize=True).to_dict()

    df["cat_mean"] = df["category"].map(cat_means)
    df["cat_ratio"] = df["amount"] / df["cat_mean"].replace(0, 1)
    df["cat_freq"] = df["category"].map(cat_counts)
    df["log_amount"] = np.log1p(df["amount"])

    # Feature matrix: [log_amount, cat_ratio, cat_freq, day_of_week]
    X = df[["log_amount", "cat_ratio", "cat_freq", "day_of_week"]].values

    # Fit Isolation Forest
    effective_contamination = min(0.20, max(0.01, float(contamination)))
    # If samples are very few, adjust contamination
    if len(df) <= 10:
        effective_contamination = 0.10

    iso = IsolationForest(
        n_estimators=100,
        contamination=effective_contamination,
        random_state=42
    )
    iso.fit(X)

    # Predictions: -1 for anomaly, 1 for inlier
    preds = iso.predict(X)
    # Decision function: lower values mean more anomalous
    scores = iso.decision_function(X)

    # Convert decision score to standardized 0-100 anomaly intensity
    # lower decision score -> higher anomaly intensity
    min_s, max_s = float(scores.min()), float(scores.max())
    denom = max_s - min_s if max_s != min_s else 1.0

    anomalies = []
    for idx, row in df.iterrows():
        is_anom = bool(preds[idx] == -1)
        raw_score = float(scores[idx])
        # Normalized anomaly severity between 0 and 100
        severity_score = round(float((max_s - raw_score) / denom * 100), 1)

        if is_anom:
            # Generate human-readable academic context
            ratio = row["cat_ratio"]
            cat_avg = cat_means.get(row["category"], row["amount"])

            if ratio >= 2.0:
                reason = f"Unusual spending pattern detected: Amount is {ratio:.1f}x higher than your average for {row['category']} (avg ~ ₹{cat_avg:,.0f})."
            elif ratio <= 0.2 and row["amount"] > 100:
                reason = f"Unusually low expense in {row['category']} relative to standard frequency."
            elif row["cat_freq"] < 0.05:
                reason = f"Uncommon spending category: {row['category']} constitutes less than 5% of your recorded habits."
            else:
                reason = "Statistical deviation from typical transaction distribution and day-of-week timing."

            anomalies.append(
                AnomalyItem(
                    transaction_id=str(row["id"]),
                    amount=float(row["amount"]),
                    category=str(row["category"]),
                    date=str(row["date"]),
                    description=str(row["description"]),
                    anomaly_score=severity_score,
                    is_anomaly=True,
                    reason=reason
                )
            )

    # Sort by anomaly severity descending
    anomalies.sort(key=lambda x: x.anomaly_score, reverse=True)

    return {
        "total_analyzed": len(df),
        "anomalies_detected": len(anomalies),
        "anomalies": anomalies,
        "algorithm": "Scikit-Learn Isolation Forest (unsupervised tree ensemble)",
        "message": f"Analyzed {len(df)} transactions. Detected {len(anomalies)} spending anomalies based on multi-dimensional feature clustering."
    }
