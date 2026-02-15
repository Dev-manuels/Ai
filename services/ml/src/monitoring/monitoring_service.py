from .drift import DriftMonitor
from .performance import PerformanceMonitor
import pandas as pd
import numpy as np
from ..infrastructure.database import SessionLocal
from sqlalchemy import text
import json

class MonitoringService:
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.drift_monitor = DriftMonitor(model_name)
        self.performance_monitor = PerformanceMonitor(model_name)

    def run_drift_check(self, current_features_df: pd.DataFrame):
        """
        Runs drift check against the latest production model's training data.
        """
        # In a real system, we'd load the reference data from a Feature Store
        # For now, we'll simulate it or skip if not available
        pass

    def evaluate_recent_performance(self, days: int = 7):
        """
        Fetches recently settled bets and calculates performance metrics.
        """
        db = SessionLocal()
        try:
            # Join Bet, Prediction, and Fixture to get outcomes and our predicted probs
            query = text("""
                SELECT
                    p."homeProb", p."drawProb", p."awayProb",
                    f."homeScore", f."awayScore",
                    b.odds, b."closingOdds", b."betType"
                FROM "Prediction" p
                JOIN "Fixture" f ON p."fixtureId" = f.id
                JOIN "Bet" b ON b."predictionId" = p.id
                WHERE p."modelVersion" LIKE :model_name
                  AND f.status = 'FINISHED'
                  AND f.date > NOW() - (CAST(:days AS TEXT) || ' days')::INTERVAL
            """)
            result = db.execute(query, {"model_name": f"%{self.model_name}%", "days": days})
            rows = result.fetchall()

            if not rows:
                return None

            y_true = []
            y_prob = []
            clvs = []

            for row in rows:
                # Actual outcome
                if row.homeScore > row.awayScore:
                    y_true.append([1, 0, 0])
                elif row.homeScore == row.awayScore:
                    y_true.append([0, 1, 0])
                else:
                    y_true.append([0, 0, 1])

                y_prob.append([row.homeProb, row.drawProb, row.awayProb])

                if row.closingOdds:
                    # This is simplified, usually closing odds are for specific markets
                    # Here we assume we have closing odds for all 3 outcomes in a JSON or similar
                    # For demo, we'll just use the closing odds of the bet we took
                    clv = (row.homeProb if row.betType == 'HOME' else
                           row.drawProb if row.betType == 'DRAW' else
                           row.awayProb) * row.closingOdds - 1
                    clvs.append(clv)

            metrics = self.performance_monitor.calculate_metrics(np.array(y_true), np.array(y_prob))
            if clvs:
                metrics['avg_clv'] = float(np.mean(clvs))

            self.performance_monitor.log_performance_metrics(metrics)
            return metrics

        finally:
            db.close()
