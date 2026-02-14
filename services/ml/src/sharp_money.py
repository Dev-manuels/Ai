import numpy as np
import pandas as pd
from typing import Dict, List, Optional
import time

class SharpMoneyEngine:
    def __init__(self, window_size_sec: int = 300, resolution_sec: int = 1):
        self.window_size = window_size_sec
        self.resolution = resolution_sec
        # price_history: {fixture_id: {bookmaker: [(timestamp, price)]}}
        self.price_history = {}
        self.leadership_scores = {}

    def add_price(self, fixture_id: str, bookmaker: str, selection: str, price: float):
        if fixture_id not in self.price_history:
            self.price_history[fixture_id] = {}

        key = f"{bookmaker}_{selection}"
        if key not in self.price_history[fixture_id]:
            self.price_history[fixture_id][key] = []

        history = self.price_history[fixture_id][key]
        now = time.time()
        history.append((now, price))

        # Clean up old data
        cutoff = now - self.window_size - 60 # Extra buffer
        while history and history[0][0] < cutoff:
            history.pop(0)

    def detect_leadership(self, fixture_id: str, selection: str, sharp_book: str, soft_book: str):
        """
        Calculates lead-lag relationship using cross-correlation.
        """
        sharp_key = f"{sharp_book}_{selection}"
        soft_key = f"{soft_book}_{selection}"

        if (fixture_id not in self.price_history or
            sharp_key not in self.price_history[fixture_id] or
            soft_key not in self.price_history[fixture_id]):
            return None

        # Resample to fixed resolution
        now = time.time()
        ts = np.arange(now - self.window_size, now, self.resolution)

        def get_series(key):
            history = self.price_history[fixture_id][key]
            if not history: return np.zeros_like(ts)
            h_times, h_prices = zip(*history)
            # Use last-observation-carried-forward
            return np.interp(ts, h_times, h_prices, left=h_prices[0])

        sharp_series = get_series(sharp_key)
        soft_series = get_series(soft_key)

        if np.std(sharp_series) == 0 or np.std(soft_series) == 0:
            return 0.0 # No movement to correlate

        # Calculate cross-correlation for different lags
        lags = np.arange(-10, 11) # -10s to +10s
        correlations = []
        for lag in lags:
            if lag == 0:
                corr = np.corrcoef(sharp_series, soft_series)[0, 1]
            elif lag > 0:
                corr = np.corrcoef(sharp_series[lag:], soft_series[:-lag])[0, 1]
            else: # lag < 0
                corr = np.corrcoef(sharp_series[:lag], soft_series[-lag:])[0, 1]
            correlations.append(corr)

        best_lag_idx = np.argmax(correlations)
        best_lag = lags[best_lag_idx]
        max_corr = correlations[best_lag_idx]

        return {
            'lag_sec': float(best_lag),
            'correlation': float(max_corr),
            'leadership_score': float(max_corr * (1 if best_lag > 0 else -1)) # Positive if sharp leads
        }

    def calculate_confidence_score(self, fixture_id: str, current_odds: Dict[str, float], model_prob: float):
        """
        Combines liquidity, sharp alignment, and price stability.
        """
        # Placeholder for complex multi-factor scoring
        # In a real system, we'd pull from live_odds and internal metrics
        return 0.85 # Mock high confidence
