import numpy as np
from typing import Dict, List
import pandas as pd
from .dixon_coles import DixonColesModel

class LiveMatchStateEngine:
    def __init__(self, pre_match_model: DixonColesModel):
        self.pre_match_model = pre_match_model
        # Bayesian priors for goal intensity
        self.alpha_correction = 1.0
        self.beta_correction = 1.0

    def update_state(self, current_score: List[int], elapsed_minutes: float, events: List[Dict]):
        """
        Updates match probabilities using Bayesian updating and Dixon-Coles hazard rates.
        """
        remaining_time = max(0, 95 - elapsed_minutes)

        # Calculate momentum factor from events
        momentum = self._calculate_momentum(events)

        # Adjust lambda based on time remaining and momentum
        # Dixon-Coles hazard rates (simplified for in-play)
        # Intensity = Base_Intensity * Momentum * Time_Decay

        # Base probabilities from pre-match model
        # For simplicity in Phase 5, we use the pre-match Dixon-Coles
        # but adjust for time remaining and current score.

        # TODO: Implement full Bayesian hazard rate updating
        pass

    def _calculate_momentum(self, events: List[Dict]) -> float:
        """
        Heuristic momentum based on recent shots, corners, and pressure.
        """
        if not events:
            return 1.0

        score = 0
        for event in events:
            if event['type'] == 'SHOT':
                score += 0.1
            elif event['type'] == 'CORNER':
                score += 0.05
            elif event['type'] == 'PRESSURE':
                score += 0.02

        return 1.0 + min(0.5, score)

    def predict_live_probs(self, home_team: str, away_team: str,
                           current_score: List[int], elapsed_minutes: float):
        # Remaining expected goals based on Dixon-Coles parameters
        # lambda_h = alpha_h * beta_a * rho
        # lambda_a = alpha_a * beta_h

        # Get pre-match parameters
        # For now, let's assume we have them or use a fallback
        lambda_h = 1.35 # Mock
        lambda_a = 1.10 # Mock

        remaining_ratio = max(0, (95 - elapsed_minutes) / 90.0)

        # Adjusted lambdas for remaining time
        adj_lambda_h = lambda_h * remaining_ratio
        adj_lambda_a = lambda_a * remaining_ratio

        # Poisson probabilities for remaining goals
        from scipy.stats import poisson

        max_goals = 10
        h_probs = [poisson.pmf(i, adj_lambda_h) for i in range(max_goals)]
        a_probs = [poisson.pmf(i, adj_lambda_a) for i in range(max_goals)]

        # Joint probability matrix for remaining goals
        prob_matrix = np.outer(h_probs, a_probs)

        # Final match outcome probabilities given current score
        home_win = 0.0
        draw = 0.0
        away_win = 0.0

        for i in range(max_goals):
            for j in range(max_goals):
                final_h = current_score[0] + i
                final_a = current_score[1] + j

                if final_h > final_a:
                    home_win += prob_matrix[i, j]
                elif final_h == final_a:
                    draw += prob_matrix[i, j]
                else:
                    away_win += prob_matrix[i, j]

        return {
            "home": home_win,
            "draw": draw,
            "away": away_win
        }
