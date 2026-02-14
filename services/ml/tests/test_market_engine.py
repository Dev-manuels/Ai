import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from features.market import MarketEngine

def test_market_engine():
    engine = MarketEngine()

    # Test margin removal
    odds = [2.0, 3.4, 3.8] # sum(1/odds) = 0.5 + 0.294 + 0.263 = 1.057
    probs = engine.remove_margin(odds)
    assert np.isclose(sum(probs), 1.0)
    print("Margin removal test passed.")

    # Test movement features
    now = datetime.now()
    hist_data = [
        {'timestamp': now - timedelta(hours=2), 'bookmaker': 'Pinnacle', 'home': 2.0, 'draw': 3.0, 'away': 3.0},
        {'timestamp': now - timedelta(hours=1), 'bookmaker': 'Pinnacle', 'home': 1.9, 'draw': 3.1, 'away': 3.2},
        {'timestamp': now, 'bookmaker': 'Pinnacle', 'home': 1.8, 'draw': 3.2, 'away': 3.5}
    ]
    df_hist = pd.DataFrame(hist_data)
    movement = engine.calculate_movement_features(df_hist)

    assert movement['mag_home'] < 0 # Price dropped
    assert movement['time_diff_hours'] == 2.0
    print(f"Movement features: {movement}")
    print("Movement features test passed.")

if __name__ == "__main__":
    test_market_engine()
