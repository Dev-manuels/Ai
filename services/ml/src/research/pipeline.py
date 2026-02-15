import pandas as pd
from typing import List, Callable, Any, Dict
from ..infrastructure.registry import ModelRegistry
from ..infrastructure.database import SessionLocal
from sqlalchemy import text
from datetime import datetime
from .feature_discovery import FeatureDiscovery
from ..infrastructure.data_lake import DataLakeExporter
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResearchPipeline:
    def __init__(self, name: str):
        self.name = name
        self.tasks: List[Callable] = []
        self.registry = ModelRegistry()

    def add_task(self, task: Callable):
        self.tasks.append(task)
        return task

    def run(self, **kwargs):
        logger.info(f"Starting pipeline: {self.name}")
        context = kwargs
        for task in self.tasks:
            logger.info(f"Executing task: {task.__name__}")
            try:
                result = task(context)
                if result:
                    context.update(result)
            except Exception as e:
                logger.error(f"Task {task.__name__} failed: {e}")
                raise e
        logger.info(f"Pipeline {self.name} completed successfully")
        return context

# Example tasks for a retraining pipeline

def ingest_data(context: Dict) -> Dict:
    db = SessionLocal()
    try:
        # Fetch historical fixtures and outcomes
        query = text("""
            SELECT f.*, h.name as home_team, a.name as away_team
            FROM "Fixture" f
            JOIN "Team" h ON f."homeTeamId" = h.id
            JOIN "Team" a ON f."awayTeamId" = a.id
            WHERE f.status = 'FINISHED'
        """)
        df = pd.read_sql(query, db.bind)
        return {"data": df}
    finally:
        db.close()

def train_model(context: Dict) -> Dict:
    df = context["data"]
    # For now, we use a placeholder for actual training logic
    # In reality, this would import DixonColesModel or GBMModel
    from ..models.dixon_coles import DixonColesModel
    model = DixonColesModel()
    model.fit(df)
    return {"model": model}

def validate_model(context: Dict) -> Dict:
    model = context["model"]
    data = context["data"]
    # Split data, run validation, calculate metrics
    # Placeholder metrics
    metrics = {"log_loss": 0.65, "accuracy": 0.55}

    # Validation gate: Compare against production
    # (Simplified for now)
    context["passed_validation"] = metrics["log_loss"] < 0.70
    return {"metrics": metrics}

def sync_data_lake(context: Dict) -> Dict:
    exporter = DataLakeExporter()
    exporter.sync_all()
    return {"data_lake_synced": True}

def register_model(context: Dict) -> Dict:
    if not context.get("passed_validation"):
        logger.warning("Model did not pass validation, skipping registration")
        return {}

    registry = ModelRegistry()
    artifact_id = registry.save_model(
        model=context["model"],
        name="dixon_coles_retrained",
        metadata={"training_date": datetime.now().isoformat()},
        metrics=context["metrics"],
        status="STAGING"
    )
    return {"artifact_id": artifact_id}

def discover_features(context: Dict) -> Dict:
    df = context.get("data")
    if df is None: return {}

    # Mock candidate features for demo
    candidate_features = [col for col in df.columns if df[col].dtype in ['float64', 'int64'] and col != 'outcome_val']
    if not candidate_features: return {}

    # Add outcome_val if not present for discovery
    if 'outcome_val' not in df.columns:
        # Simple outcome mapping for demo
        df['outcome_val'] = (df['homeScore'] > df['awayScore']).astype(int)

    discovery = FeatureDiscovery()
    results = discovery.search_signals(df, candidate_features[:10]) # Limit for speed

    return {"feature_discovery_results": results}

def create_retraining_pipeline():
    pipeline = ResearchPipeline("AutoRetraining")
    pipeline.add_task(sync_data_lake)
    pipeline.add_task(ingest_data)
    pipeline.add_task(discover_features)
    pipeline.add_task(train_model)
    pipeline.add_task(validate_model)
    pipeline.add_task(register_model)
    return pipeline
