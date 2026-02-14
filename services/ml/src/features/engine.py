import pandas as pd
import numpy as np

class FeatureEngine:
    def __init__(self):
        pass

    def prepare_dixon_coles_data(self, fixtures_df):
        return fixtures_df[['home_team', 'away_team', 'home_goals', 'away_goals']]
