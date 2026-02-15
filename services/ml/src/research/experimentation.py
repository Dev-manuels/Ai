from typing import List, Dict, Any
from ..infrastructure.registry import ModelRegistry
from ..infrastructure.database import SessionLocal
from sqlalchemy import text
import json
import logging

logger = logging.getLogger(__name__)

class ExperimentManager:
    def __init__(self):
        self.registry = ModelRegistry()
        self.shadow_models = {}
        self._load_active_experiments()

    def _load_active_experiments(self):
        db = SessionLocal()
        try:
            query = text("""
                SELECT e.*, ma.path, ma.name as model_name
                FROM "Experiment" e
                JOIN "ModelArtifact" ma ON e."modelArtifactId" = ma.id
                WHERE e.status = 'ACTIVE' AND e.type = 'SHADOW'
            """)
            result = db.execute(query)
            for row in result:
                try:
                    model = self.registry.load_model(row.modelArtifactId)
                    self.shadow_models[row.id] = {
                        "model": model,
                        "name": row.model_name,
                        "experiment_id": row.id
                    }
                    logger.info(f"Loaded shadow model for experiment: {row.name}")
                except Exception as e:
                    logger.error(f"Failed to load shadow model {row.model_name}: {e}")
        finally:
            db.close()

    def run_shadow_inference(self, fixture_id: str, context_data: Dict[str, Any]):
        results = {}
        for exp_id, shadow in self.shadow_models.items():
            try:
                # Assuming shadow['model'] has a predict method
                # This is a simplification
                model = shadow['model']
                # Mock inference for now
                if hasattr(model, 'predict_live_probs'):
                     probs = model.predict_live_probs(
                         context_data.get('home_team'),
                         context_data.get('away_team'),
                         context_data.get('score'),
                         context_data.get('elapsed')
                     )
                else:
                    probs = {"home": 0.33, "draw": 0.33, "away": 0.34} # Fallback

                results[exp_id] = probs
                self._log_shadow_prediction(fixture_id, exp_id, shadow['name'], probs)
            except Exception as e:
                logger.error(f"Shadow inference failed for experiment {exp_id}: {e}")
        return results

    def _log_shadow_prediction(self, fixture_id: str, experiment_id: str, model_version: str, probs: Dict):
        db = SessionLocal()
        try:
            # We log shadow predictions to the Prediction table but with a clear modelVersion tag
            query = text("""
                INSERT INTO "Prediction" (id, "fixtureId", "modelVersion", "homeProb", "drawProb", "awayProb", ev, confidence, "recommendedBet", "createdAt")
                VALUES (gen_random_uuid(), :fixture_id, :model_version, :home, :draw, :away, 0, 0, 'NONE', NOW())
            """)
            db.execute(query, {
                "fixture_id": fixture_id,
                "model_version": f"shadow_{model_version}_{experiment_id}",
                "home": probs['home'],
                "draw": probs['draw'],
                "away": probs['away']
            })
            db.commit()
        except Exception as e:
            logger.error(f"Error logging shadow prediction: {e}")
            db.rollback()
        finally:
            db.close()
