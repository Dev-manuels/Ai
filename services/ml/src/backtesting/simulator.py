import pandas as pd
import numpy as np
from typing import List, Dict, Callable

class BacktestingSimulator:
    def __init__(self, initial_bankroll: float = 10000, commission: float = 0.02):
        self.initial_bankroll = initial_bankroll
        self.bankroll = initial_bankroll
        self.commission = commission
        self.results = []

    def run(self, df: pd.DataFrame, predict_fn: Callable) -> pd.DataFrame:
        """
        Runs the simulation. 
        df must have: [date, home_team, away_team, home_odds, draw_odds, away_odds, result]
        result: 0 (Home), 1 (Draw), 2 (Away)
        """
        df = df.sort_values('date')
        
        for index, row in df.iterrows():
            # 1. Get Prediction (Simulation of real-time)
            # Ensure predict_fn only uses data available before row['date']
            prediction = predict_fn(row)
            
            # 2. Execution Logic
            if prediction['recommended_bet'] is not None:
                bet_type = prediction['recommended_bet'] # 0, 1, or 2
                odds = [row['home_odds'], row['draw_odds'], row['away_odds']][bet_type]
                stake = self.bankroll * prediction['suggested_stake']
                
                # 3. Settle Bet
                is_win = (row['result'] == bet_type)
                profit = 0
                if is_win:
                    profit = stake * (odds - 1) * (1 - self.commission)
                else:
                    profit = -stake
                
                self.bankroll += profit
                
                self.results.append({
                    'date': row['date'],
                    'home_team': row['home_team'],
                    'away_team': row['away_team'],
                    'bet_type': bet_type,
                    'odds': odds,
                    'stake': stake,
                    'profit': profit,
                    'bankroll': self.bankroll,
                    'is_win': is_win
                })
        
        return pd.DataFrame(self.results)

    def calculate_metrics(self) -> Dict:
        if not self.results: return {}
        
        df_res = pd.DataFrame(self.results)
        total_bets = len(df_res)
        win_rate = df_res['is_win'].mean()
        total_profit = df_res['profit'].sum()
        roi = total_profit / df_res['stake'].sum()
        
        # Drawdown calculation
        df_res['cum_profit'] = df_res['profit'].cumsum()
        df_res['peak'] = df_res['cum_profit'].expanding().max()
        df_res['drawdown'] = df_res['peak'] - df_res['cum_profit']
        max_drawdown = df_res['drawdown'].max()
        
        return {
            'total_bets': total_bets,
            'win_rate': win_rate,
            'total_profit': total_profit,
            'roi': roi,
            'max_drawdown': max_drawdown,
            'final_bankroll': self.bankroll
        }

class LiveEventGenerator:
    """
    Generates deterministic synthetic match events for backtesting.
    """
    def __init__(self, seed: int = 42):
        self.rng = np.random.default_rng(seed)

    def generate_match_stream(self, fixture_id: str, home_exp_goals: float, away_exp_goals: float):
        events = []

        # 1. Generate Goals
        h_goals = self.rng.poisson(home_exp_goals)
        a_goals = self.rng.poisson(away_exp_goals)

        for _ in range(h_goals):
            events.append({
                'fixtureId': fixture_id,
                'type': 'GOAL',
                'timestamp': self.rng.integers(1, 95),
                'data': {'team': 'home'}
            })

        for _ in range(a_goals):
            events.append({
                'fixtureId': fixture_id,
                'type': 'GOAL',
                'timestamp': self.rng.integers(1, 95),
                'data': {'team': 'away'}
            })

        # 2. Generate SHOTS and CORNERS (correlated with goals)
        for team, exp in [('home', home_exp_goals), ('away', away_exp_goals)]:
            shots = self.rng.poisson(exp * 5) # Heuristic: 5 shots per goal
            for _ in range(shots):
                events.append({
                    'fixtureId': fixture_id,
                    'type': 'SHOT',
                    'timestamp': self.rng.integers(1, 95),
                    'data': {'team': team}
                })

        # Sort by timestamp
        events.sort(key=lambda x: x['timestamp'])

        # Update scores in goal events
        h_score, a_score = 0, 0
        for e in events:
            if e['type'] == 'GOAL':
                if e['data']['team'] == 'home': h_score += 1
                else: a_score += 1
                e['data']['score'] = [h_score, a_score]

        return events
