import numpy as np
from sklearn.metrics import log_loss, brier_score_loss
from typing import Dict, List, Optional
import json
from ..infrastructure.database import SessionLocal
from sqlalchemy import text

class PerformanceMonitor:
    def __init__(self, model_name: str):
        self.model_name = model_name

    def calculate_metrics(self, y_true: np.ndarray, y_prob: np.ndarray) -> Dict[str, float]:
        """
        Calculates Log Loss and Brier Score for multi-class (Home, Draw, Away).
        """
        loss = log_loss(y_true, y_prob)

        # Brier score is typically for binary, for multi-class we can use the sum of squared differences
        # or calculate it per class.
        # Here we'll do a simple multi-class Brier equivalent
        # y_true should be one-hot encoded for this
        brier = np.mean(np.sum((y_prob - y_true)**2, axis=1))

        return {
            "log_loss": float(loss),
            "brier_score": float(brier)
        }

    def calculate_clv(self, our_probs: np.ndarray, closing_odds: np.ndarray) -> float:
        """
        Calculates Closing Line Value (CLV).
        CLV = (Our Prob * Closing Odds) - 1
        """
        # our_probs: [p_home, p_draw, p_away]
        # closing_odds: [o_home, o_draw, o_away]
        ev_at_closing = np.sum(our_probs * closing_odds) - 1
        return float(ev_at_closing)

    def log_performance_metrics(self, metrics: Dict[str, float], tags: Dict = None):
        db = SessionLocal()
        try:
            for name, value in metrics.items():
                query = text("""
                    INSERT INTO "DriftMetric" (id, "modelName", "metricName", value, timestamp, tags)
                    VALUES (gen_random_uuid(), :model_name, :metric_name, :value, NOW(), :tags)
                """)
                db.execute(query, {
                    "model_name": self.model_name,
                    "metric_name": name,
                    "value": value,
                    "tags": json.dumps(tags or {})
                })
            db.commit()
        except Exception as e:
            print(f"Error logging performance metrics: {e}")
            db.rollback()
        finally:
            db.close()
