from abc import ABC, abstractmethod
import pandas as pd
from typing import Dict, List, Any, Optional

class BaseAlternativeAdapter(ABC):
    """
    Abstract base class for alternative data providers.
    """
    @abstractmethod
    def fetch_data(self, context: Dict[str, Any]) -> pd.DataFrame:
        pass

    @abstractmethod
    def transform_to_features(self, raw_data: pd.DataFrame) -> pd.DataFrame:
        pass

class InjuryAdapter(BaseAlternativeAdapter):
    def fetch_data(self, context: Dict[str, Any]) -> pd.DataFrame:
        # Placeholder for API call
        return pd.DataFrame()

    def transform_to_features(self, raw_data: pd.DataFrame) -> pd.DataFrame:
        # Logic to convert injury list to team-level unavailability score
        return pd.DataFrame()

class WeatherAdapter(BaseAlternativeAdapter):
    def fetch_data(self, context: Dict[str, Any]) -> pd.DataFrame:
        # Placeholder for weather API call
        return pd.DataFrame()

    def transform_to_features(self, raw_data: pd.DataFrame) -> pd.DataFrame:
        # Logic to convert weather (wind, rain, temp) to impact scores
        return pd.DataFrame()

class TravelFatigueAdapter(BaseAlternativeAdapter):
    def fetch_data(self, context: Dict[str, Any]) -> pd.DataFrame:
        # Placeholder for distance calculation between team base and stadium
        return pd.DataFrame()

    def transform_to_features(self, raw_data: pd.DataFrame) -> pd.DataFrame:
        # Logic to calculate fatigue from travel distance and rest days
        return pd.DataFrame()

class AlternativeDataEngine:
    """
    Orchestrates ingestion and transformation of alternative data sources.
    """
    def __init__(self):
        self.adapters: Dict[str, BaseAlternativeAdapter] = {
            "injury": InjuryAdapter(),
            "weather": WeatherAdapter(),
            "travel": TravelFatigueAdapter()
        }

    def get_all_features(self, context: Dict[str, Any]) -> pd.DataFrame:
        """
        Returns a DataFrame indexed by fixture_id (if provided in context or data).
        """
        all_features = pd.DataFrame()
        for name, adapter in self.adapters.items():
            try:
                raw = adapter.fetch_data(context)
                features = adapter.transform_to_features(raw)
                if not features.empty:
                    # Ensure features has fixture_id as index for joining
                    if 'fixture_id' in features.columns:
                        features = features.set_index('fixture_id')

                    if all_features.empty:
                        all_features = features
                    else:
                        all_features = all_features.join(features, how='outer', rsuffix=f'_{name}')
            except Exception as e:
                print(f"Error in {name} adapter: {e}")
        return all_features
