from fastapi import FastAPI, Response
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
from .models.dixon_coles import DixonColesModel
from .features.engine import FeatureEngine
from .ai.reasoning import ReasoningEngine
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, Counter, Histogram

app = FastAPI(title="Football Intelligence ML Service")

# Metrics
prediction_counter = Counter('ml_predictions_total', 'Total predictions made')
inference_latency = Histogram('ml_inference_latency_seconds', 'Inference latency')

model = DixonColesModel()
engine = FeatureEngine()
reasoning_engine = ReasoningEngine()

class PredictionRequest(BaseModel):
    home_team: str
    away_team: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "ml"}

@app.post("/predict")
def predict(request: PredictionRequest):
    prediction_counter.inc()
    probs_matrix = model.predict_probs(request.home_team, request.away_team)

    # 1X2 Probs
    home_win_prob = np.sum(np.tril(probs_matrix, -1))
    draw_prob = np.sum(np.diag(probs_matrix))
    away_win_prob = np.sum(np.triu(probs_matrix, 1))

    # O/U 2.5 Probs
    over_2_5_prob = 0
    for i in range(probs_matrix.shape[0]):
        for j in range(probs_matrix.shape[1]):
            if i + j > 2.5:
                over_2_5_prob += probs_matrix[i, j]
    under_2_5_prob = 1 - over_2_5_prob

    # BTTS Probs
    btts_yes_prob = np.sum(probs_matrix[1:, 1:])
    btts_no_prob = 1 - btts_yes_prob

    # Team O/U 1.5 Probs
    home_over_1_5_prob = np.sum(probs_matrix[2:, :])
    home_under_1_5_prob = 1 - home_over_1_5_prob

    away_over_1_5_prob = np.sum(probs_matrix[:, 2:])
    away_under_1_5_prob = 1 - away_over_1_5_prob

    markets = {
        "1X2": {
            "HOME": float(home_win_prob),
            "DRAW": float(draw_prob),
            "AWAY": float(away_win_prob)
        },
        "OVER_UNDER_2_5": {
            "OVER": float(over_2_5_prob),
            "UNDER": float(under_2_5_prob)
        },
        "BTTS": {
            "YES": float(btts_yes_prob),
            "NO": float(btts_no_prob)
        },
        "HOME_OVER_UNDER_1_5": {
            "OVER": float(home_over_1_5_prob),
            "UNDER": float(home_under_1_5_prob)
        },
        "AWAY_OVER_UNDER_1_5": {
            "OVER": float(away_over_1_5_prob),
            "UNDER": float(away_under_1_5_prob)
        }
    }
    
    # Feature snapshot for traceability
    features = {
        "home_team": request.home_team,
        "away_team": request.away_team,
        "model_type": "Dixon-Coles",
        "timestamp": pd.Timestamp.now().isoformat()
    }
    
    return {
        "markets": markets,
        "snapshot": features
    }

@app.post("/train")
def train(fixtures: List[dict]):
    df = pd.DataFrame(fixtures)
    model.fit(df)
    return {"status": "trained", "teams_count": len(model.teams)}

@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
