from .portfolio_optimization import PortfolioOptimizer
import pandas as pd
import numpy as np

class AllocationEngine:
    def __init__(self, optimizer: PortfolioOptimizer):
        self.optimizer = optimizer

    def rebalance_portfolio(self, strategy_performance: pd.DataFrame,
                          current_regime: str,
                          risk_tolerance: str = 'BALANCED'):
        """
        Dynamically adjusts capital allocation based on performance, regime, and risk profile.
        """
        # 1. Calculate Target Weights using selected optimization method
        if risk_tolerance == 'CONSERVATIVE':
            # Focus on Risk Parity (Equal risk contribution)
            target_weights = self.optimizer.risk_parity_optimization(strategy_performance)
        elif risk_tolerance == 'AGGRESSIVE':
            # Focus on Mean-Variance with higher target return
            target_weights = self.optimizer.mean_variance_optimization(strategy_performance, target_return=0.1)
        else:
            # Balanced: Mean-Variance with moderate target
            target_weights = self.optimizer.mean_variance_optimization(strategy_performance, target_return=0.05)

        # 2. Adjust for Regime
        if current_regime == 'VOLATILE':
            # Reduce all weights by 20% and move to cash (Master Bankroll)
            target_weights = target_weights * 0.8

        return target_weights

    def calculate_position_size(self, edge: float, odds: float,
                              portfolio_mdd: float, current_dd: float,
                              fraction: float = 0.25):
        """
        Uses Drawdown-constrained Kelly for final sizing.
        """
        dc_kelly = self.optimizer.drawdown_constrained_kelly(edge, odds, portfolio_mdd, current_dd)
        return dc_kelly * fraction # Apply Kelly fraction (e.g. 0.25)
