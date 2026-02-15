from .pipeline import create_retraining_pipeline
from ..monitoring.monitoring_service import MonitoringService
import logging

logger = logging.getLogger(__name__)

class ResearchManager:
    def __init__(self):
        self.retraining_pipeline = create_retraining_pipeline()

    def check_and_trigger_retraining(self, model_name: str):
        """
        Check if retraining is needed based on monitoring metrics.
        """
        monitor = MonitoringService(model_name)
        metrics = monitor.evaluate_recent_performance(days=14)

        if metrics and (metrics.get('log_loss', 0) > 0.75 or metrics.get('avg_clv', 0) < -0.02):
            logger.info(f"Retraining triggered for {model_name} due to poor performance: {metrics}")
            return self.retraining_pipeline.run()

        return None

    def schedule_periodic_retraining(self):
        # In a real system, this would be hooked into a scheduler (cron/celery/prefect)
        pass
