import pandas as pd
import numpy as np
from .tactical import TacticalEngine, RefereeEngine
from .market import MarketEngine
from .alternative import AlternativeDataEngine
from typing import Optional, Dict, Any

class FeatureEngine:
    def __init__(self):
        self.tactical_engine = TacticalEngine()
        self.market_engine = MarketEngine()
        self.alternative_engine = AlternativeDataEngine()
        self.referee_engine = RefereeEngine()

    def prepare_dixon_coles_data(self, fixtures_df):
        return fixtures_df[['home_team', 'away_team', 'home_goals', 'away_goals']]

    def prepare_gbm_features(self, fixtures_df: pd.DataFrame, odds_df: pd.DataFrame, events_df: Optional[pd.DataFrame] = None, context: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
        """
        Combines team stats, market features, proprietary tactical features, and alternative data.
        Expects fixtures_df to have an index or column 'fixture_id'.
        """
        df = fixtures_df.copy()
        if 'fixture_id' not in df.columns and df.index.name != 'fixture_id':
             # Ensure we have a way to join
             df['fixture_id'] = df.index
        
        fixture_id_col = 'fixture_id' if 'fixture_id' in df.columns else df.index.name

        # 1. Base Team Features (Rolling Stats)
        # (Assuming existing logic or placeholder)

        # 2. Proprietary Tactical Features
        if events_df is not None and not events_df.empty:
            # Map fixture to home team for field tilt
            home_team_map = df.set_index(fixture_id_col)['home_team'].to_dict()

            xt_df = self.tactical_engine.calculate_xt(events_df)
            # xt_df columns are team_ids, we need to map them back to home/away_xt
            # This is complex in batch, but for simplicity we assume we can join on fixture_id
            df = df.merge(xt_df, left_on=fixture_id_col, right_index=True, how='left', suffixes=('', '_xt'))

            field_tilt = self.tactical_engine.calculate_field_tilt(events_df, home_team_map)
            df = df.merge(field_tilt.rename('field_tilt_home'), left_on=fixture_id_col, right_index=True, how='left')

            pressure_df = self.tactical_engine.calculate_pressure_metrics(events_df)
            df = df.merge(pressure_df, left_on=fixture_id_col, right_index=True, how='left')

            # Referee signals
            if 'referee_id' in df.columns and 'league_id' in df.columns:
                ref_features = df.apply(lambda x: self.referee_engine.get_referee_profile(x['referee_id'], x['league_id']), axis=1)
                ref_df = pd.DataFrame(ref_features.tolist(), index=df.index)
                df = pd.concat([df, ref_df], axis=1)

        # 3. Market Features from odds_df
        if not odds_df.empty:
            # Enhanced market features
            movement = self.market_engine.calculate_movement_features(odds_df)
            for k, v in movement.items():
                df[f'market_{k}'] = v

        # 4. Alternative Data Features
        if context:
            alt_features = self.alternative_engine.get_all_features(context)
            if not alt_features.empty:
                df = df.merge(alt_features, left_on=fixture_id_col, right_index=True, how='left')
            
        return df
