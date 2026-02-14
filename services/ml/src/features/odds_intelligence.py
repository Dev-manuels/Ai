import pandas as pd
from typing import Dict, List, Optional
from .market import MarketEngine

class OddsIntelligenceEngine:
    def __init__(self):
        self.market_engine = MarketEngine()

    def analyze_market_state(self, current_odds: List[Dict], historical_odds: List[Dict]) -> Dict:
        """
        Analyzes the current market state compared to historical movements.
        """
        df_hist = pd.DataFrame(historical_odds)
        if not df_hist.empty:
            df_hist['timestamp'] = pd.to_datetime(df_hist['timestamp'])
            
        movement = self.market_engine.calculate_movement_features(df_hist)
        
        # Identify sharp price (Pinnacle)
        sharp_odds = next((o for o in current_odds if o['bookmaker'] == 'Pinnacle'), None)
        
        analysis = {
            'movement': movement,
            'sharp_benchmarked': sharp_odds is not None,
            'is_volatile': abs(movement.get('vel_home', 0)) > 0.05
        }
        
        return analysis

    def calculate_clv(self, closing_odds: float, bet_odds: float) -> float:
        """
        Calculates Closing Line Value.
        CLV = (Bet Odds / Closing Odds) - 1
        """
        if closing_odds == 0: return 0
        return (bet_odds / closing_odds) - 1
