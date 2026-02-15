import pandas as pd
import os
from datetime import datetime
from .database import engine
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

class DataLakeExporter:
    def __init__(self, base_path: str = "./data_lake"):
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)

    def export_table(self, table_name: str, date_column: str = "createdAt", start_date: str = None):
        """
        Exports a database table to Parquet, partitioned by year/month.
        """
        query_str = f'SELECT * FROM "{table_name}"'
        if start_date:
            query_str += f" WHERE \"{date_column}\" >= :start_date"

        try:
            df = pd.read_sql(text(query_str), engine.connect(), params={"start_date": start_date} if start_date else None)
            if df.empty:
                logger.info(f"No new data to export for {table_name}")
                return

            df[date_column] = pd.to_datetime(df[date_column])
            df['year'] = df[date_column].dt.year
            df['month'] = df[date_column].dt.month

            partition_path = os.path.join(self.base_path, table_name)
            df.to_parquet(partition_path, partition_cols=['year', 'month'], index=False)

            logger.info(f"Successfully exported {len(df)} rows from {table_name} to {partition_path}")
        except Exception as e:
            logger.error(f"Failed to export {table_name}: {e}")

    def sync_all(self):
        tables = ["Prediction", "Bet", "Fixture", "MatchEvent", "InPlayOdds", "DriftMetric"]
        for table in tables:
            # For demo, we export all. In production, this would be incremental.
            self.export_table(table)

if __name__ == "__main__":
    exporter = DataLakeExporter()
    exporter.sync_all()
