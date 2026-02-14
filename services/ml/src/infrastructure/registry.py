import joblib
import os
from datetime import datetime
from typing import Any, Dict

class ModelRegistry:
    def __init__(self, storage_path: str = "./models"):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)

    def save_model(self, model: Any, name: str, metadata: Dict = None):
        version = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_id = f"{name}_{version}"
        path = os.path.join(self.storage_path, f"{model_id}.joblib")
        
        joblib.dump(model, path)
        
        # Save metadata
        if metadata:
            with open(os.path.join(self.storage_path, f"{model_id}_meta.json"), "w") as f:
                import json
                json.dump(metadata, f)
        
        return model_id

    def load_model(self, model_id: str) -> Any:
        path = os.path.join(self.storage_path, f"{model_id}.joblib")
        return joblib.load(path)

class FeatureStore:
    def __init__(self, storage_path: str = "./features"):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)

    def save_features(self, df: Any, name: str):
        path = os.path.join(self.storage_path, f"{name}.parquet")
        df.to_parquet(path)

    def load_features(self, name: str) -> Any:
        path = os.path.join(self.storage_path, f"{name}.parquet")
        import pandas as pd
        return pd.read_parquet(path)
