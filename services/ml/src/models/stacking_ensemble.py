from sklearn.linear_model import LogisticRegression
from sklearn.isotonic import IsotonicRegression
import numpy as np
from typing import List, Dict

class StackingEnsemble:
    def __init__(self):
        self.meta_model = LogisticRegression(multi_class='multinomial', solver='lbfgs')
        self.is_fitted = False

    def fit(self, base_predictions: np.ndarray, y: np.Series):
        """
        base_predictions: array of shape (n_samples, n_base_models * 3)
        y: actual results [0, 1, 2]
        """
        self.meta_model.fit(base_predictions, y)
        self.is_fitted = True

    def predict_proba(self, base_predictions: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            # Fallback to simple average if not fitted
            n_models = base_predictions.shape[1] // 3
            avg_probs = np.zeros((base_predictions.shape[0], 3))
            for i in range(n_models):
                avg_probs += base_predictions[:, i*3:(i+1)*3]
            return avg_probs / n_models
            
        return self.meta_model.predict_proba(base_predictions)

class ProbabilityCalibrator:
    def __init__(self, method='isotonic'):
        self.method = method
        self.regressors = []

    def fit(self, probs: np.ndarray, y: np.Series):
        """
        probs: (n_samples, 3)
        y: (n_samples,) binary for each class (one-vs-rest calibration)
        """
        self.regressors = []
        for i in range(3):
            ir = IsotonicRegression(out_of_bounds='clip')
            y_binary = (y == i).astype(int)
            ir.fit(probs[:, i], y_binary)
            self.regressors.append(ir)

    def calibrate(self, probs: np.ndarray) -> np.ndarray:
        if not self.regressors: return probs
        
        calibrated = np.zeros_like(probs)
        for i in range(3):
            calibrated[:, i] = self.regressors[i].transform(probs[:, i])
            
        # Re-normalize
        row_sums = calibrated.sum(axis=1)
        return calibrated / row_sums[:, np.newaxis]
