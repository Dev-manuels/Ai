import json
import time
import numpy as np

class LiveEVEngine:
    def __init__(self, confidence_threshold=0.75):
        self.confidence_threshold = confidence_threshold

    def calculate_ev(self, model_probs: dict, market_odds: list):
        """
        model_probs: {'home': float, 'draw': float, 'away': float}
        market_odds: list of {'selection': str, 'odds': float}
        """
        ev_results = []
        for selection in market_odds:
            sel_name = selection['selection']
            if sel_name not in model_probs:
                continue

            prob = model_probs[sel_name]
            odds = selection['odds']

            # EV = (Prob * Odds) - 1
            ev = (prob * odds) - 1

            if ev > 0:
                ev_results.append({
                    'selection': sel_name,
                    'ev': ev,
                    'prob': prob,
                    'odds': odds
                })

        return ev_results

class ExecutionSimulator:
    def __init__(self, base_delay=5.0):
        self.base_delay = base_delay

    def simulate_execution(self, fixture_id: str, selection: str, odds: float):
        """
        Simulates order timing, slippage, and rejection.
        """
        # 1. Simulate Delay (Non-blocking for simulation)
        actual_delay = self.base_delay + np.random.uniform(0, 3)

        # 2. Simulate Slippage
        # Odds usually drop after a goal or major event
        slippage = np.random.uniform(0, 0.05)
        executed_odds = odds * (1 - slippage)

        # 3. Simulate Rejection (e.g., market suspended)
        rejection_prob = 0.1
        is_rejected = np.random.random() < rejection_prob

        return {
            'fixtureId': fixture_id,
            'selection': selection,
            'originalOdds': odds,
            'executedOdds': executed_odds if not is_rejected else 0,
            'status': 'REJECTED' if is_rejected else 'EXECUTED',
            'delay': actual_delay
        }
