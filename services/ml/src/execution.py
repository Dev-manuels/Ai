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
        # order_book_cache: {fixture_id: {selection: {price: volume}}}
        self.order_book_cache = {}
        self.recovery_rate = 0.1 # 10% volume replenishment per second

    def update_order_book(self, fixture_id: str, market_data: list):
        if fixture_id not in self.order_book_cache:
            self.order_book_cache[fixture_id] = {}

        for sel in market_data:
            sel_name = sel['selection']
            if sel_name not in self.order_book_cache[fixture_id]:
                self.order_book_cache[fixture_id][sel_name] = {}

            if 'depth' in sel:
                for level in sel['depth']:
                    self.order_book_cache[fixture_id][sel_name][level['price']] = level['volume']

    def calculate_feasibility(self, fixture_id: str, selection: str, stake: float):
        """
        Estimates fill probability and expected slippage.
        """
        book = self.order_book_cache.get(fixture_id, {}).get(selection, {})
        if not book:
            return {'fill_prob': 0.1, 'expected_slippage': 0.05}

        available_volume = sum(book.values())
        if available_volume >= stake:
            return {'fill_prob': 0.95, 'expected_slippage': 0.01}
        else:
            return {'fill_prob': available_volume / stake, 'expected_slippage': 0.05}

    def simulate_execution(self, fixture_id: str, selection: str, odds: float, stake: float = 100):
        """
        Simulates order timing, slippage, and rejection.
        """
        # 1. Simulate Delay (Non-blocking for simulation)
        actual_delay = self.base_delay + np.random.uniform(0, 3)

        # 2. Market Impact and Liquidity Consumption
        book = self.order_book_cache.get(fixture_id, {}).get(selection, {})
        if book:
            # Consume liquidity from the book
            remaining_stake = stake
            total_weighted_odds = 0

            # Sort prices descending (best odds first)
            sorted_prices = sorted(book.keys(), reverse=True)
            for price in sorted_prices:
                vol = book[price]
                fill = min(remaining_stake, vol)
                total_weighted_odds += fill * price
                book[price] -= fill # Consume
                remaining_stake -= fill
                if remaining_stake <= 0: break

            if stake > remaining_stake:
                executed_odds = total_weighted_odds / (stake - remaining_stake)
            else:
                executed_odds = 0 # No fill
        else:
            # Fallback to simple slippage model
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
