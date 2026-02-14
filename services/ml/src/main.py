from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
from .models.dixon_coles import DixonColesModel
from .features.engine import FeatureEngine
from .ai.reasoning import ReasoningEngine

app = FastAPI(title="Football Intelligence ML Service")

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
    probs_matrix = model.predict_probs(request.home_team, request.away_team)
    home_win_prob = np.sum(np.tril(probs_matrix, -1).T)
    draw_prob = np.sum(np.diag(probs_matrix))
    away_win_prob = np.sum(np.triu(probs_matrix, 1).T)

    # Feature snapshot for traceability
    features = {
        "home_team": request.home_team,
        "away_team": request.away_team,
        "model_type": "Dixon-Coles",
        "timestamp": pd.Timestamp.now().isoformat()
        # In Phase 2/3, we add more complex features here
    }

    return {
        "home_win": float(home_win_prob),
        "draw": float(draw_prob),
        "away_win": float(away_win_prob),
        "snapshot": features
    }

@app.post("/train")
def train(fixtures: List[dict]):
    df = pd.DataFrame(fixtures)
    model.fit(df)
    return {"status": "trained", "teams_count": len(model.teams)}
