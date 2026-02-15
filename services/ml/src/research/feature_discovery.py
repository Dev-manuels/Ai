import pandas as pd
import numpy as np
from typing import List, Dict, Any
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_selection import mutual_info_regression
import logging

logger = logging.getLogger(__name__)

class FeatureDiscovery:
    def __init__(self, target_column: str = "outcome_val"):
        self.target_column = target_column

    def search_signals(self, df: pd.DataFrame, candidate_features: List[str]):
        """
        Analyzes a set of candidate features for predictive power and stability.
        """
        if self.target_column not in df.columns:
            logger.error(f"Target column {self.target_column} not found in dataframe")
            return {}

        results = {}
        X = df[candidate_features].fillna(0)
        y = df[self.target_column]

        # 1. Feature Importance via Random Forest
        rf = RandomForestRegressor(n_estimators=100)
        rf.fit(X, y)
        importances = dict(zip(candidate_features, rf.feature_importances_))

        # 2. Mutual Information
        mi = mutual_info_regression(X, y)
        mi_scores = dict(zip(candidate_features, mi))

        # 3. Stability Analysis (Time-based split)
        # Split data into two halves and compare importance
        mid = len(df) // 2
        rf_early = RandomForestRegressor(n_estimators=50)
        rf_early.fit(X.iloc[:mid], y.iloc[:mid])

        rf_late = RandomForestRegressor(n_estimators=50)
        rf_late.fit(X.iloc[mid:], y.iloc[mid:])

        stability = {}
        for i, feat in enumerate(candidate_features):
            diff = abs(rf_early.feature_importances_[i] - rf_late.feature_importances_[i])
            stability[feat] = 1.0 - min(1.0, diff / (rf_early.feature_importances_[i] + 1e-6))

        for feat in candidate_features:
            results[feat] = {
                "importance": float(importances[feat]),
                "mi_score": float(mi_scores[feat]),
                "stability": float(stability[feat]),
                "is_promising": importances[feat] > 0.05 and stability[feat] > 0.7
            }

        return results

    def detect_redundancy(self, df: pd.DataFrame, features: List[str], threshold: float = 0.9):
        """
        Identifies highly correlated features.
        """
        corr_matrix = df[features].corr().abs()
        upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))

        to_drop = [column for column in upper.columns if any(upper[column] > threshold)]
        redundant_pairs = []

        for col in to_drop:
            main_feat = upper.index[upper[col] > threshold].tolist()[0]
            redundant_pairs.append((main_feat, col, upper[col][main_feat]))

        return redundant_pairs

    def generate_synthetic_features(self, df: pd.DataFrame):
        """
        Example of automated feature engineering: combining existing ones.
        """
        # Placeholder for automated feature engineering logic
        # e.g., ratios, differences, rolling averages
        pass
