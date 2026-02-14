import pandas as pd
import numpy as np
from typing import List, Dict

class MarketEngine:
    def __init__(self, sharp_bookmaker: str = "Pinnacle"):
        self.sharp_bookmaker = sharp_bookmaker

    def calculate_implied_prob(self, odds: float) -> float:
        if odds <= 1: return 0
        return 1 / odds

    def remove_margin(self, odds_list: List[float]) -> List[float]:
        """Proportional margin removal."""
        implied = [self.calculate_implied_prob(o) for o in odds_list]
        total = sum(implied)
        if total == 0: return [0] * len(odds_list)
        return [p / total for p in implied]

    def calculate_movement_features(self, odds_history: pd.DataFrame) -> Dict:
        """
        Expects odds_history with columns: [timestamp, bookmaker, home, draw, away]
        """
        if odds_history.empty:
            return {}

        odds_history = odds_history.sort_values('timestamp')

        # Opening vs Current
        opening = odds_history.iloc[0]
        current = odds_history.iloc[-1]

        # Magnitude (log change)
        mag_home = np.log(current['home'] / opening['home'])
        mag_away = np.log(current['away'] / opening['away'])

        # Velocity (Magnitude / Time in hours)
        time_diff = (current['timestamp'] - opening['timestamp']).total_seconds() / 3600
        vel_home = mag_home / max(time_diff, 0.01)

        return {
            'mag_home': mag_home,
            'mag_away': mag_away,
            'vel_home': vel_home,
            'time_diff_hours': time_diff
        }

    def detect_sharp_divergence(self, soft_odds: List[float], sharp_odds: List[float]) -> float:
        """
        Calculates the divergence between soft books and the sharp benchmark.
        Positive value indicates soft odds are "lagging" or offering value relative to sharp.
        """
        soft_probs = self.remove_margin(soft_odds)
        sharp_probs = self.remove_margin(sharp_odds)

        # Using Euclidean distance or simple difference for divergence
        return np.sum(np.abs(np.array(soft_probs) - np.array(sharp_probs)))
