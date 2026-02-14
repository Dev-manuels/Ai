import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

import pandas as pd
import numpy as np
from models.dixon_coles import DixonColesModel

def test_dixon_coles_fit():
    data = {
        'home_team': ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
        'away_team': ['B', 'C', 'A', 'C', 'A', 'B', 'B', 'C', 'A'],
        'home_goals': [1, 2, 0, 1, 1, 0, 2, 1, 0],
        'away_goals': [1, 0, 1, 0, 2, 1, 1, 0, 2]
    }
    df = pd.DataFrame(data)
    model = DixonColesModel()
    res = model.fit(df)
    
    print(f"Fit success: {res.success}")
    assert res.success
    
    probs = model.predict_probs('A', 'B')
    print(f"Probabilities sum: {np.sum(probs)}")
    assert np.isclose(np.sum(probs), 1.0)
    
    # Simple check for win/draw/away probs
    home_win = np.sum(np.tril(probs, -1).T)
    draw = np.sum(np.diag(probs))
    away_win = np.sum(np.triu(probs, 1).T)
    
    print(f"Home: {home_win:.2f}, Draw: {draw:.2f}, Away: {away_win:.2f}")
    assert np.isclose(home_win + draw + away_win, 1.0)
    print("Test passed!")

if __name__ == "__main__":
    test_dixon_coles_fit()
