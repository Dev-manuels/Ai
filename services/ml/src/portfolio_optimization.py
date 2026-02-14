import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage, fcluster
from scipy.spatial.distance import pdist

class PortfolioOptimizer:
    def __init__(self):
        pass

    def calculate_correlation_matrix(self, returns_df: pd.DataFrame):
        """
        Calculates correlation between different strategies or bets.
        returns_df: DataFrame where columns are strategies and rows are time periods (or events)
        """
        return returns_df.corr()

    def hierarchical_clustering(self, correlation_matrix: pd.DataFrame, n_clusters: int = 3):
        """
        Performs hierarchical clustering to identify correlated groups of strategies.
        """
        distance_matrix = pdist(correlation_matrix.values)
        Z = linkage(distance_matrix, method='ward')
        clusters = fcluster(Z, n_clusters, criterion='maxclust')

        return dict(zip(correlation_matrix.columns, clusters))

    def factor_exposure(self, returns_series: pd.Series, factors_df: pd.DataFrame):
        """
        Estimates exposure of a strategy to common market factors (e.g., 'Favorite Bias', 'High Volatility').
        """
        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        model.fit(factors_df, returns_series)

        return dict(zip(factors_df.columns, model.coef_))

    def dimensionality_reduction(self, data: pd.DataFrame, n_components: int = 2):
        """
        Reduces dimensionality of strategy performance data to identify latent factors.
        """
        from sklearn.decomposition import PCA
        pca = PCA(n_components=n_components)
        pca.fit(data)

        return pca.components_, pca.explained_variance_ratio_

    def mean_variance_optimization(self, returns_df: pd.DataFrame, target_return: float = 0.05):
        """
        Optimizes strategy weights for minimum variance given a target return.
        """
        from scipy.optimize import minimize

        n = returns_df.shape[1]
        mean_returns = returns_df.mean()
        cov_matrix = returns_df.cov()

        def objective(weights):
            return np.dot(weights.T, np.dot(cov_matrix, weights))

        constraints = [
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1}, # Weights sum to 1
            {'type': 'eq', 'fun': lambda x: np.dot(x, mean_returns) - target_return} # Meet target return
        ]
        bounds = tuple((0, 1) for _ in range(n))

        res = minimize(objective, n * [1./n], method='SLSQP', bounds=bounds, constraints=constraints)
        return res.x

    def risk_parity_optimization(self, returns_df: pd.DataFrame):
        """
        Optimizes weights such that each strategy contributes equally to portfolio risk.
        """
        from scipy.optimize import minimize

        n = returns_df.shape[1]
        cov_matrix = returns_df.cov()

        def objective(weights):
            portfolio_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
            # Marginal Risk Contribution
            mrc = np.dot(cov_matrix, weights) / portfolio_vol
            # Risk Contribution
            rc = weights * mrc

            # Penalize differences in risk contribution
            return np.sum(np.square(rc - portfolio_vol/n))

        constraints = [
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1}
        ]
        bounds = tuple((0, 1) for _ in range(n))

        res = minimize(objective, n * [1./n], method='SLSQP', bounds=bounds, constraints=constraints)
        return res.x

    def drawdown_constrained_kelly(self, edge: float, odds: float,
                                   max_drawdown: float, current_drawdown: float):
        """
        Calculates Kelly stake adjusted for maximum drawdown constraints.
        f* = (p*b - q) / b
        Adjusted by (MaxDD - CurrentDD) / MaxDD
        """
        kelly_f = edge / (odds - 1)

        # Risk reduction factor based on proximity to max drawdown
        risk_factor = max(0, (max_drawdown - current_drawdown) / max_drawdown)

        return kelly_f * risk_factor
