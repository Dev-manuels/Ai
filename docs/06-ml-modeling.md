# ML Modeling and Prediction

## Modeling Philosophy
Our approach combines classical statistical foundations with modern machine learning ensembles to capture both linear dependencies and complex non-linear interactions.

## 1. Baseline: Dixon-Coles Model
The core of our goal-based probability is a modified **Dixon-Coles Poisson model**.
- **Mechanism**: Estimates offensive and defensive strengths for each team while accounting for home-field advantage and a low-score correlation factor ($\tau$).
- **Time-Decay**: We apply an exponential time-decay function to historical results, prioritizing recent form without losing the long-term statistical baseline.

## 2. Ensemble: Gradient Boosting (XGBoost)
While Dixon-Coles is excellent for goal distributions, it misses market dynamics and complex features.
- **Inputs**: Dixon-Coles probabilities, market movement velocity, and player-level availability data.
- **Role**: Refines the baseline probability by identifying patterns where the Poisson model historically underperforms.

## 3. Meta-Model: Stacking Ensemble
A final **Logistic Regression** layer (Meta-learner) combines the outputs of the Poisson model and the GBM.
- **Validation**: 5-fold walk-forward cross-validation.
- **Calibration**: We use **Isotonic Regression** to ensure that a predicted 60% probability actually corresponds to a 60% win rate in the long run.

## Expected Value (EV) Calculation
$$EV = (P_{win} \times Odds) - 1$$
We only consider bets where:
1. $EV > 0.03$ (3% minimum edge).
2. Model confidence $> 0.75$.
3. Odds are liquid and available at sharp books.

## Model Reproducibility
- **Versioning**: Every prediction is tagged with a `modelVersion` (e.g., `v1.4.2-ensemble`).
- **Artifacts**: Model weights and encoders are stored in object storage with unique hashes.
