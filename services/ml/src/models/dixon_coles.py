import numpy as np
import pandas as pd
from scipy.optimize import minimize
from scipy.stats import poisson

class DixonColesModel:
    def __init__(self):
        self.teams = []
        self.params = None
        self.team_index = {}

    def _rho_correction(self, x, y, lambda_x, lambda_y, rho):
        if x == 0 and y == 0:
            return 1 - lambda_x * lambda_y * rho
        elif x == 0 and y == 1:
            return 1 + lambda_x * rho
        elif x == 1 and y == 0:
            return 1 + lambda_y * rho
        elif x == 1 and y == 1:
            return 1 - rho
        return 1

    def _log_likelihood(self, params, home_teams, away_teams, home_goals, away_goals):
        nt = len(self.teams)
        attack = params[:nt]
        defense = params[nt:2*nt]
        home_adv = params[2*nt]
        rho = params[2*nt+1]
        
        log_l = 0
        for i in range(len(home_goals)):
            h_idx = home_teams[i]
            a_idx = away_teams[i]
            
            lambda_h = np.exp(attack[h_idx] + defense[a_idx] + home_adv)
            lambda_a = np.exp(attack[a_idx] + defense[h_idx])
            
            tau = self._rho_correction(home_goals[i], away_goals[i], lambda_h, lambda_a, rho)
            
            # Avoid log(0)
            tau = max(1e-10, tau)
            
            log_l += np.log(tau) + poisson.logpmf(home_goals[i], lambda_h) + poisson.logpmf(away_goals[i], lambda_a)
            
        return -log_l

    def fit(self, df):
        self.teams = sorted(list(set(df['home_team'].unique()) | set(df['away_team'].unique())))
        self.team_index = {team: i for i, team in enumerate(self.teams)}
        
        nt = len(self.teams)
        home_teams = df['home_team'].map(self.team_index).values
        away_teams = df['away_team'].map(self.team_index).values
        home_goals = df['home_goals'].values
        away_goals = df['away_goals'].values
        
        init_params = np.zeros(2 * nt + 2)
        init_params[2*nt] = 0.1 
        
        cons = [{'type': 'eq', 'fun': lambda x: np.mean(x[:nt])}]
        
        res = minimize(self._log_likelihood, init_params, args=(home_teams, away_teams, home_goals, away_goals),
                       constraints=cons, method='SLSQP')
        
        self.params = res.x
        return res

    def predict_probs(self, home_team, away_team, max_goals=10):
        h_idx = self.team_index[home_team]
        a_idx = self.team_index[away_team]
        nt = len(self.teams)
        
        attack = self.params[:nt]
        defense = self.params[nt:2*nt]
        home_adv = self.params[2*nt]
        rho = self.params[2*nt+1]
        
        lambda_h = np.exp(attack[h_idx] + defense[a_idx] + home_adv)
        lambda_a = np.exp(attack[a_idx] + defense[h_idx])
        
        probs = np.zeros((max_goals + 1, max_goals + 1))
        for x in range(max_goals + 1):
            for y in range(max_goals + 1):
                tau = self._rho_correction(x, y, lambda_h, lambda_a, rho)
                probs[x, y] = max(0, tau) * poisson.pmf(x, lambda_h) * poisson.pmf(y, lambda_a)
                
        return probs / np.sum(probs)
