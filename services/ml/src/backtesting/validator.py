import pandas as pd
from typing import Callable, List

class WalkForwardValidator:
    def __init__(self, train_window_years: int = 3, test_window_months: int = 6):
        self.train_window_years = train_window_years
        self.test_window_months = test_window_months

    def validate(self, df: pd.DataFrame, train_fn: Callable, predict_fn: Callable):
        """
        Implements walk-forward validation.
        """
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        start_date = df['date'].min()
        end_date = df['date'].max()
        
        current_test_start = start_date + pd.DateOffset(years=self.train_window_years)
        
        all_results = []
        
        while current_test_start < end_date:
            current_test_end = current_test_start + pd.DateOffset(months=self.test_window_months)
            
            # Train on everything before current_test_start
            train_data = df[df['date'] < current_test_start]
            test_data = df[(df['date'] >= current_test_start) & (df['date'] < current_test_end)]
            
            if not test_data.empty:
                print(f"Validating period: {current_test_start.date()} to {current_test_end.date()}")
                model = train_fn(train_data)
                
                for _, row in test_data.iterrows():
                    pred = predict_fn(model, row)
                    all_results.append({**pred, 'actual': row['result'], 'date': row['date']})
            
            current_test_start = current_test_end
            
        return pd.DataFrame(all_results)
