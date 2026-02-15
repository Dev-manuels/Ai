import joblib
import os
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

class ModelRegistry:
    def __init__(self, storage_path: str = "./models", db_url: Optional[str] = None):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)
        self.db_url = db_url or os.getenv("DATABASE_URL")
        self.engine: Optional[Engine] = None
        if self.db_url:
            self.engine = create_engine(self.db_url)

    def _get_db_conn(self):
        if not self.engine:
            return None
        return self.engine.connect()

    def save_model(self, model: Any, name: str, version: Optional[str] = None, metadata: Dict = None, metrics: Dict = None, status: str = "STAGING"):
        if not version:
            version = datetime.now().strftime("%Y%m%d_%H%M%S")

        model_id_str = f"{name}_{version}"
        local_path = os.path.join(self.storage_path, f"{model_id_str}.joblib")
        
        # Save to local filesystem (acting as S3 for now)
        joblib.dump(model, local_path)
        
        # Store in PostgreSQL metadata
        conn = self._get_db_conn()
        if conn:
            try:
                query = text("""
                    INSERT INTO "ModelArtifact" (id, name, version, path, metadata, metrics, status, "createdAt", "updatedAt")
                    VALUES (gen_random_uuid(), :name, :version, :path, :metadata, :metrics, :status, NOW(), NOW())
                    RETURNING id
                """)
                result = conn.execute(query, {
                    "name": name,
                    "version": version,
                    "path": local_path,
                    "metadata": json.dumps(metadata or {}),
                    "metrics": json.dumps(metrics or {}),
                    "status": status
                })
                conn.commit()
                artifact_id = result.fetchone()[0]
                return str(artifact_id)
            except Exception as e:
                print(f"Error saving to DB: {e}")
                conn.rollback()
            finally:
                conn.close()
        
        return model_id_str

    def load_model(self, artifact_id_or_name: str) -> Any:
        # Try to find by ID in DB first
        conn = self._get_db_conn()
        path = None
        if conn:
            try:
                query = text('SELECT path FROM "ModelArtifact" WHERE id = :id OR name = :id ORDER BY "createdAt" DESC LIMIT 1')
                result = conn.execute(query, {"id": artifact_id_or_name})
                row = result.fetchone()
                if row:
                    path = row[0]
            finally:
                conn.close()

        if not path:
            # Fallback to local search if DB fails or not found
            path = os.path.join(self.storage_path, f"{artifact_id_or_name}.joblib")
            if not os.path.exists(path):
                # Try adding extension
                path = os.path.join(self.storage_path, artifact_id_or_name)

        return joblib.load(path)

    def list_models(self, name: Optional[str] = None) -> List[Dict]:
        conn = self._get_db_conn()
        if conn:
            try:
                if name:
                    query = text('SELECT * FROM "ModelArtifact" WHERE name = :name ORDER BY "createdAt" DESC')
                    result = conn.execute(query, {"name": name})
                else:
                    query = text('SELECT * FROM "ModelArtifact" ORDER BY "createdAt" DESC')
                    result = conn.execute(query)
                return [dict(row._mapping) for row in result.fetchall()]
            finally:
                conn.close()
        return []

class FeatureStore:
    def __init__(self, storage_path: str = "./features"):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)

    def save_features(self, df: pd.DataFrame, name: str):
        path = os.path.join(self.storage_path, f"{name}.parquet")
        df.to_parquet(path)

    def load_features(self, name: str) -> pd.DataFrame:
        path = os.path.join(self.storage_path, f"{name}.parquet")
        return pd.read_parquet(path)

    def list_feature_sets(self) -> List[str]:
        return [f.replace(".parquet", "") for f in os.listdir(self.storage_path) if f.endswith(".parquet")]
