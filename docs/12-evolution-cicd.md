# System Evolution and CI/CD

## "Enable One Build Further Updates"
To ensure the system remains institutional-grade, it must evolve without regressions. This guide explains how to update and expand the platform.

## 1. CI/CD Pipeline
We use GitHub Actions for automated testing and deployment.
- **Continuous Integration (CI)**:
    - Runs on every PR.
    - Executes `npm test` (Frontend/API) and `pytest` (ML Service).
    - Checks for linting and type safety.
- **Continuous Deployment (CD)**:
    - Runs on merges to `main`.
    - Builds Docker images and pushes to registry.
    - Deploys to the staging environment for smoke testing.

## 2. Adding a New Model
1. **Create Model Class**: Add a new file in `services/ml/src/models/` inheriting from `BaseModel`.
2. **Implement `predict_probs`**: Ensure it returns a consistent probability matrix.
3. **Update Stacking Ensemble**: If this model is part of the ensemble, update the meta-learner training logic.
4. **Register Model**: Add the new model to the FastAPI router in `main.py`.

## 3. Backtesting Integrity
Before any model update is deployed to production:
- **Walk-forward Validation**: Run the new model over the last 5 seasons.
- **ROI Comparison**: The new model must outperform the current version by at least 1% (net) or show significantly lower drawdown.
- **Slippage Simulation**: Backtests must include realistic commission and market impact assumptions.

## 4. Retraining Pipeline
- **Schedule**: Models are retrained weekly with the latest match data.
- **Validation**: Automated checks ensure that the retrained model doesn't "forget" historical patterns (Catastrophic Forgetting).
- **Rollback**: If performance drops post-deployment, the `modelVersion` can be immediately reverted in the K8s configuration.

## 5. Future Roadmap
- **Liquidity Analysis**: Integrating order book depth from Betfair Exchange.
- **LLM Reasoning Layer**: Using GPT-4o to analyze qualitative news and injury reports as a weighted feature.
- **Multi-Asset Support**: Expanding the architecture to handle Tennis, Basketball, and US Football.
