# Data and Feature Pipelines

## Overview
The platform processes millions of data points daily from multiple providers. Integrity and traceability are our highest priorities.

## Ingestion Engine
- **Providers**: Supports API-Football, Sportmonks, and manual odds ingestion via an adapter pattern.
- **Frequency**:
    - **Fixtures**: Sync every 6 hours.
    - **Odds**: Real-time streaming for liquid markets; 1-minute polling for others.
    - **Results**: Immediate sync post-match completion.

## Feature Engineering
The `FeatureEngine` in `services/ml` transforms raw data into high-dimensional vectors.

### Key Feature Categories
1. **Historical Performance**: Goals scored/conceded (EMA), xG, TSR (Total Shot Ratio).
2. **Market Intelligence**:
    - Opening vs. Current line movement.
    - Volume-weighted average price (VWAP).
    - Sharp-bookmaker divergence (Pinnacle vs. Soft books).
3. **Contextual**: Distance traveled, rest days, injuries (extracted via LLM).

## Feature Snapshotting (Traceability)
Every prediction made by the system is accompanied by a **Feature Snapshot**.
- **Storage**: JSONB in the `Prediction` table.
- **Purpose**: Allows full reproduction of the model's decision at any point in the future. If a prediction is flagged for review, we can re-run the exact same data through the model to verify consistency.

## Data Quality Checks
- **Schema Validation**: Using Pydantic in Python and Zod in TypeScript.
- **Outlier Detection**: Automated alerts for anomalous odds movement (>3 standard deviations).
- **Stale Data Protection**: The system automatically pauses predictions if the data feed latency exceeds 300 seconds.
