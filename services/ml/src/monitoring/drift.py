import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, List, Any
import json
from ..infrastructure.database import SessionLocal
from sqlalchemy import text

class DriftMonitor:
    def __init__(self, model_name: str):
        self.model_name = model_name

    def calculate_ks_drift(self, reference_data: np.ndarray, current_data: np.ndarray) -> float:
        """
        Calculates the Kolmogorov-Smirnov statistic to detect if two distributions differ.
        Returns the p-value. Low p-value (< 0.05) indicates drift.
        """
        ks_stat, p_value = stats.ks_2samp(reference_data, current_data)
        return float(p_value)

    def calculate_psi(self, expected: np.ndarray, actual: np.ndarray, buckets: int = 10) -> float:
        """
        Calculates Population Stability Index (PSI).
        PSI < 0.1: No significant change
        PSI < 0.25: Moderate change
        PSI >= 0.25: Significant change
        """
        def scale_range(data, min_val, max_val):
            return (data - min_val) / (max_val - min_val + 1e-6)

        min_val = min(expected.min(), actual.min())
        max_val = max(expected.max(), actual.max())

        expected_scaled = scale_range(expected, min_val, max_val)
        actual_scaled = scale_range(actual, min_val, max_val)

        expected_percents = np.histogram(expected_scaled, bins=buckets, range=(0, 1))[0] / len(expected)
        actual_percents = np.histogram(actual_scaled, bins=buckets, range=(0, 1))[0] / len(actual)

        # Avoid division by zero
        expected_percents = np.clip(expected_percents, 1e-6, None)
        actual_percents = np.clip(actual_percents, 1e-6, None)

        psi_value = np.sum((actual_percents - expected_percents) * np.log(actual_percents / expected_percents))
        return float(psi_value)

    def log_drift_metric(self, metric_name: str, value: float, tags: Dict = None):
        db = SessionLocal()
        try:
            query = text("""
                INSERT INTO "DriftMetric" (id, "modelName", "metricName", value, timestamp, tags)
                VALUES (gen_random_uuid(), :model_name, :metric_name, :value, NOW(), :tags)
            """)
            db.execute(query, {
                "model_name": self.model_name,
                "metric_name": metric_name,
                "value": value,
                "tags": json.dumps(tags or {})
            })
            db.commit()
        except Exception as e:
            print(f"Error logging drift metric: {e}")
            db.rollback()
        finally:
            db.close()

    def check_feature_drift(self, reference_df: pd.DataFrame, current_df: pd.DataFrame, features: List[str]):
        results = {}
        for feature in features:
            if feature in reference_df.columns and feature in current_df.columns:
                p_value = self.calculate_ks_drift(reference_df[feature].values, current_df[feature].values)
                results[feature] = p_value
                self.log_drift_metric(f"feature_drift_ks_{feature}", p_value)
        return results
