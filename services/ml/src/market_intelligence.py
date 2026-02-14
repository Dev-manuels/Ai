import numpy as np
from typing import Dict, List, Optional
import time

class MarketIntelligenceEngine:
    def __init__(self):
        # Consensus: {fixture_id: {selection: sharp_price}}
        self.sharp_consensus = {}

    def update_consensus(self, fixture_id: str, bookmaker: str, selection: str, price: float):
        if bookmaker in ['Pinnacle', 'Betfair']:
            if fixture_id not in self.sharp_consensus:
                self.sharp_consensus[fixture_id] = {}
            self.sharp_consensus[fixture_id][selection] = price

    def detect_shading(self, fixture_id: str, bookmaker: str, selection: str, soft_price: float):
        """
        Detects if a soft bookmaker is shading prices (e.g. for popular teams).
        """
        consensus = self.sharp_consensus.get(fixture_id, {}).get(selection)
        if not consensus:
            return None

        # Shading is often systematic. E.g. Soft book always 3-5% lower than Sharp
        # for a popular selection to manage their risk.
        divergence = (soft_price - consensus) / consensus

        # If soft book is significantly LOWER than sharp, it's defensive shading
        # If soft book is HIGHER than sharp, it might be a stale line (mispricing)
        return {
            'divergence': divergence,
            'is_shaded': divergence < -0.05, # Defensively shaded
            'is_stale': divergence > 0.03    # Potentially stale/mispriced
        }

    def calculate_stale_line_probability(self, divergence: float, volatility: float):
        """
        Probabilistic framework for stale lines.
        """
        if divergence <= 0:
            return 0.0

        # Higher volatility reduces confidence that a divergence is 'stale' vs 'noise'
        score = divergence / (volatility + 0.01)
        return float(np.clip(score, 0, 1))
