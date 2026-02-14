import xgboost as xgb
import pandas as pd
import numpy as np
from typing import List, Dict

class GBMModel:
    def __init__(self, params: Dict = None):
        self.params = params or {
            'objective': 'multi:softprob',
            'num_class': 3,
            'max_depth': 4,
            'eta': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'eval_metric': 'mlogloss'
        }
        self.model = None
        self.features = []

    def fit(self, X: pd.DataFrame, y: pd.Series):
        self.features = X.columns.tolist()
        dtrain = xgb.DMatrix(X, label=y)
        self.model = xgb.train(self.params, dtrain, num_boost_round=100)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        dtest = xgb.DMatrix(X[self.features])
        return self.model.predict(dtest)

    def get_feature_importance(self) -> Dict:
        if self.model:
            return self.model.get_score(importance_type='gain')
        return {}
