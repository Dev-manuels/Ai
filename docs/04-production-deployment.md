# Production Deployment Guide

## Overview
The platform is designed for Kubernetes-first deployment using Helm. It is cloud-agnostic but optimized for AWS (EKS), GCP (GKE), or Azure (AKS).

## Deployment Steps

### 1. Build and Push Images
We use a Docker-in-Docker or multi-stage build approach for each service:
```bash
docker build -t football-api:latest -f apps/api/Dockerfile .
docker build -t football-ml:latest -f services/ml/Dockerfile .
docker build -t football-web:latest -f apps/web/Dockerfile .
```

### 2. Helm Configuration
The Helm charts are located in `k8s/helm/football-intelligence`.

1. **Configure `values.yaml`**:
   Ensure replica counts, resource limits, and ingress hosts are set for your environment.

2. **Deploy via Helm**:
   ```bash
   helm upgrade --install football-platform ./k8s/helm/football-intelligence \
     --namespace production \
     --set postgresql.auth.password=$DB_PASSWORD \
     --set redis.auth.password=$REDIS_PASSWORD
   ```

## Infrastructure Requirements

### Database
For production, we recommend managed PostgreSQL (e.g., AWS RDS) instead of in-cluster containers.
- **Minimum Version**: 15
- **Extensions**: `uuid-ossp`

### Redis
Managed Redis (e.g., AWS ElastiCache) is recommended for production.
- **Mode**: Cluster mode enabled.
- **Eviction Policy**: `noeviction` (since it stores critical real-time state).

### Object Storage
S3-compatible storage is required for:
- Model artifact versioning.
- Backtest report exports.
- Historical data snapshots.

## Scaling Strategy
- **Horizontal Pod Autoscaling (HPA)**: Enabled by default on the API and ML services based on CPU/Memory utilization.
- **ML Service**: Requires higher memory limits for training tasks and large-scale inference.
- **Gateway**: Scales based on concurrent WebSocket connections.

## Security
- **Secrets Management**: Use Kubernetes Secrets or External Secrets Operator (AWS Secrets Manager / HashiCorp Vault).
- **Network Policies**: Strictly control traffic between the API and ML services.
- **SSL/TLS**: Managed via Cert-Manager and Nginx Ingress Controller.
