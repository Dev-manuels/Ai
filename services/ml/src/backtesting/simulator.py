import pandas as pd
import numpy as np
from typing import List, Dict, Callable

class BacktestingSimulator:
    def __init__(self, initial_bankroll: float = 10000, commission: float = 0.02):
        self.initial_bankroll = initial_bankroll
        self.bankroll = initial_bankroll
        self.commission = commission
        self.results = []

    def run(self, df: pd.DataFrame, predict_fn: Callable, simulate_liquidity: bool = False) -> pd.DataFrame:
        """
        Runs the simulation. 
        df must have: [date, home_team, away_team, home_odds, draw_odds, away_odds, result]
        result: 0 (Home), 1 (Draw), 2 (Away)
        """
        df = df.sort_values('date')
        
        # simulated_liquidity: {fixture_id: {selection: {price: volume}}}
        self.sim_liquidity = {}

        for index, row in df.iterrows():
            # 1. Get Prediction (Simulation of real-time)
            # Ensure predict_fn only uses data available before row['date']
            prediction = predict_fn(row)
            
            # 2. Execution Logic
            if prediction['recommended_bet'] is not None:
                bet_type = prediction['recommended_bet'] # 0, 1, or 2
                selection_names = ['home', 'draw', 'away']
                sel_name = selection_names[bet_type]

                raw_odds = [row['home_odds'], row['draw_odds'], row['away_odds']][bet_type]
                stake = self.bankroll * prediction['suggested_stake']
                
                # 2b. Microstructure aware execution
                if simulate_liquidity:
                    odds = self._execute_with_liquidity(row['fixture_id'], sel_name, raw_odds, stake)
                    if odds == 0: continue # No fill
                else:
                    odds = raw_odds

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

    def _execute_with_liquidity(self, fixture_id, selection, base_odds, stake):
        """
        Simulates liquidity consumption and slippage in backtesting.
        """
        if fixture_id not in self.sim_liquidity:
            # Generate a synthetic order book for this fixture/selection
            levels = 5
            self.sim_liquidity[fixture_id] = {
                'home': {base_odds - i*0.02: 1000 * (0.6**i) for i in range(levels)},
                'draw': {base_odds - i*0.05: 500 * (0.6**i) for i in range(levels)},
                'away': {base_odds - i*0.05: 500 * (0.6**i) for i in range(levels)}
            }

        book = self.sim_liquidity[fixture_id].get(selection, {})
        remaining_stake = stake
        total_weighted_odds = 0

        sorted_prices = sorted(book.keys(), reverse=True)
        for price in sorted_prices:
            vol = book[price]
            fill = min(remaining_stake, vol)
            total_weighted_odds += fill * price
            book[price] -= fill # Consume
            remaining_stake -= fill
            if remaining_stake <= 0: break

        if stake > remaining_stake:
            return total_weighted_odds / (stake - remaining_stake)
        return 0

    def run_monte_carlo(self, n_sims: int = 1000, n_steps: int = 100,
                        avg_win_rate: float = 0.55, avg_odds: float = 1.9,
                        black_swan_prob: float = 0.01):
        """
        Runs Monte Carlo simulations including Black Swan scenarios.
        """
        all_paths = []
        for _ in range(n_sims):
            path = [self.initial_bankroll]
            current_bankroll = self.initial_bankroll

            for _ in range(n_steps):
                # Standard step
                if np.random.random() < avg_win_rate:
                    current_bankroll += current_bankroll * 0.02 * (avg_odds - 1)
                else:
                    current_bankroll -= current_bankroll * 0.02

                # Black Swan check (e.g. 5% bankroll wipe)
                if np.random.random() < black_swan_prob:
                    current_bankroll *= 0.95

                path.append(current_bankroll)
                if current_bankroll <= 0: break

            all_paths.append(path)

        return all_paths

    def stress_test(self, strategy_returns: pd.DataFrame, shock_scenario: str = 'LIQUIDITY_CRUNCH'):
        """
        Simulates strategy performance under specific stress scenarios.
        """
        if shock_scenario == 'LIQUIDITY_CRUNCH':
            # Increase slippage by 5x
            return strategy_returns * 0.7
        elif shock_scenario == 'REGIME_SHIFT':
            # Correlate all strategies to 1.0 (loss of diversification)
            mean_return = strategy_returns.mean(axis=1)
            return pd.DataFrame({col: mean_return for col in strategy_returns.columns})

        return strategy_returns

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
