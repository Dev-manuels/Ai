import pandas as pd
import numpy as np

class StrategyManager:
    def __init__(self):
        self.strategy_performance = {}

    def calculate_attribution(self, portfolio_returns: pd.Series, strategy_returns: pd.DataFrame):
        """
        Performs return attribution to identify which strategies are driving portfolio performance.
        """
        # Simple linear attribution
        weights = strategy_returns.multiply(1.0 / len(strategy_returns.columns)) # Assuming equal weight for attribution
        contribution = weights.sum()

        return contribution.to_dict()

    def calculate_risk_adjusted_metrics(self, returns: pd.Series):
        """
        Calculates CAGR, Sharpe, Sortino, and MDD.
        """
        if len(returns) < 2:
            return {}

        total_return = (1 + returns).prod() - 1
        cagr = (1 + total_return) ** (252 / len(returns)) - 1 # Annualized

        vol = returns.std() * np.sqrt(252)
        sharpe = cagr / vol if vol != 0 else 0

        downside_returns = returns[returns < 0]
        downside_vol = downside_returns.std() * np.sqrt(252)
        sortino = cagr / downside_vol if downside_vol != 0 else 0

        cum_returns = (1 + returns).cumprod()
        peak = cum_returns.expanding().max()
        drawdown = (cum_returns - peak) / peak
        max_drawdown = drawdown.min()

        return {
            'cagr': float(cagr),
            'sharpe': float(sharpe),
            'sortino': float(sortino),
            'max_drawdown': float(max_drawdown)
        }

    def adaptive_weighting(self, metrics_history: pd.DataFrame):
        """
        Suggests weights based on a 'Survival of the Fittest' approach.
        Reduces weight on strategies with declining Sharpe or increasing MDD.
        """
        # Example: weight proportional to Sharpe / |MaxDD|
        scores = metrics_history.apply(lambda x: x['sharpe'] / abs(x['max_drawdown'] + 0.01), axis=1)
        target_weights = scores / scores.sum()

        return target_weights.to_dict()
