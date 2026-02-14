import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

import pandas as pd
import numpy as np
from backtesting.simulator import BacktestingSimulator

def test_simulator():
    sim = BacktestingSimulator(initial_bankroll=1000)
    
    # Mock data: 5 matches
    df = pd.DataFrame([
        {'date': '2023-01-01', 'home_team': 'A', 'away_team': 'B', 'home_odds': 2.0, 'draw_odds': 3.0, 'away_odds': 3.0, 'result': 0},
        {'date': '2023-01-02', 'home_team': 'C', 'away_team': 'D', 'home_odds': 2.0, 'draw_odds': 3.0, 'away_odds': 3.0, 'result': 2},
        {'date': '2023-01-03', 'home_team': 'E', 'away_team': 'F', 'home_odds': 2.0, 'draw_odds': 3.0, 'away_odds': 3.0, 'result': 0},
        {'date': '2023-01-04', 'home_team': 'G', 'away_team': 'H', 'home_odds': 2.0, 'draw_odds': 3.0, 'away_odds': 3.0, 'result': 0},
        {'date': '2023-01-05', 'home_team': 'I', 'away_team': 'J', 'home_odds': 2.0, 'draw_odds': 3.0, 'away_odds': 3.0, 'result': 1}
    ])
    
    # Simple predict function: always bet on home with 10% stake
    def mock_predict(row):
        return {'recommended_bet': 0, 'suggested_stake': 0.1}
        
    results = sim.run(df, mock_predict)
    metrics = sim.calculate_metrics()
    
    assert metrics['total_bets'] == 5
    assert metrics['win_rate'] == 0.6 # 3 home wins out of 5
    print(f"Simulation metrics: {metrics}")
    print("Simulator test passed.")

if __name__ == "__main__":
    test_simulator()
