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
        Expects odds_history with columns: [timestamp, bookmaker, home, draw, away, liquidity]
        """
        if odds_history.empty:
            return {}

        odds_history = odds_history.sort_values('timestamp')
        
        # Opening vs Current
        opening = odds_history.iloc[0]
        current = odds_history.iloc[-1]
        
        # 1. Magnitude (log change)
        mag_home = np.log(current['home'] / opening['home'])
        mag_away = np.log(current['away'] / opening['away'])
        
        # 2. Velocity (Magnitude / Time in hours)
        time_diff = (current['timestamp'] - opening['timestamp']).total_seconds() / 3600
        vel_home = mag_home / max(time_diff, 0.01)
        
        # 3. Persistence: Ratio of magnitude to total variance of movement
        # Measures if the price is trending or just oscillating
        price_std = odds_history['home'].std()
        persistence_home = abs(mag_home) / (price_std + 1e-6)

        # 4. Liquidity Concentration
        # Measures if liquidity is thickening or thinning near the current price
        liquidity_conc = 0.0
        if 'liquidity' in odds_history.columns:
            total_liq = odds_history['liquidity'].sum()
            recent_liq = odds_history.tail(5)['liquidity'].sum()
            liquidity_conc = recent_liq / (total_liq + 1e-6)

        # 5. Sharp-Soft Leadership Lag
        # Detect if sharp books move before soft books
        leadership_lag = self.calculate_leadership_lag(odds_history)

        return {
            'mag_home': mag_home,
            'mag_away': mag_away,
            'vel_home': vel_home,
            'persistence_home': persistence_home,
            'liquidity_conc': liquidity_conc,
            'leadership_lag': leadership_lag,
            'time_diff_hours': time_diff
        }

    def calculate_leadership_lag(self, odds_history: pd.DataFrame) -> float:
        """
        Calculates the average time delay (in minutes) between sharp price moves and soft book reactions.
        """
        if 'bookmaker' not in odds_history.columns or len(odds_history) < 2:
            return 0.0

        sharp_moves = odds_history[odds_history['bookmaker'] == self.sharp_bookmaker]
        soft_moves = odds_history[odds_history['bookmaker'] != self.sharp_bookmaker]

        if sharp_moves.empty or soft_moves.empty:
            return 0.0

        # Very simplified lag calculation
        # In production, this would use cross-correlation of price series
        first_sharp_move = sharp_moves['timestamp'].min()
        first_soft_reaction = soft_moves[soft_moves['timestamp'] > first_sharp_move]['timestamp'].min()

        if pd.isna(first_soft_reaction):
            return 0.0

        lag_minutes = (first_soft_reaction - first_sharp_move).total_seconds() / 60
        return lag_minutes

    def detect_sharp_divergence(self, soft_odds: List[float], sharp_odds: List[float]) -> float:
        """
        Calculates the divergence between soft books and the sharp benchmark.
        Positive value indicates soft odds are "lagging" or offering value relative to sharp.
        """
        soft_probs = self.remove_margin(soft_odds)
        sharp_probs = self.remove_margin(sharp_odds)
        
        # Using Euclidean distance or simple difference for divergence
        return np.sum(np.abs(np.array(soft_probs) - np.array(sharp_probs)))
