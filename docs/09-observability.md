# Monitoring and Observability

## Infrastructure Monitoring
We use a standardized Prometheus and Grafana stack to monitor system health.

### 1. System Metrics
- **CPU/Memory**: Monitored via K8s metrics-server.
- **Database**: Connection pool health, query latency, and index performance.
- **Redis**: Memory fragmentation and command throughput.

### 2. Service-Specific Metrics
- **API Gateway**: Request volume, status codes (2xx/4xx/5xx), and WebSocket connection count.
- **ML Service**:
    - **Inference Latency**: Distribution of time taken to generate a prediction.
    - **Prediction Volume**: Total predictions made per model version.

## Model Performance Monitoring (MLOps)
Traditional system monitoring is insufficient for ML. We track "Model Health":

### 1. Calibration Drift
We monitor the **Brier Score** and **Log Loss** in real-time. If the model's calibration deviates by more than 5% from the validation baseline, an alert is triggered.

### 2. Feature Drift
We monitor the distribution of input features (e.g., average odds, goal frequency). Significant shifts in these distributions may indicate "regime change" in the market.

### 3. CLV Tracking
The system automatically compares our predicted probabilities against the closing lines of sharp bookmakers. Negative CLV over a 100-bet window triggers an automatic investigation.

## Alerts and Notifications
- **Severity 1 (Critical)**: Service down, database connection failure, or circuit breaker tripped.
- **Severity 2 (Warning)**: Model drift detected, high latency, or data provider timeout.
- **Channels**: Slack, PagerDuty, and Email.
