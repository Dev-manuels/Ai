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

### 3. Netlify (Frontend Only)
The frontend application can be deployed independently to Netlify for better performance and ease of use.
- **Base Directory**: Root of the repository.
- **Build Command**: `npx turbo build --filter=@football/web`
- **Publish Directory**: `apps/web/.next`
- **Hardening**: Security headers (CSP, HSTS, X-Frame-Options) are configured in `netlify.toml`.
- **Environment**: Ensure `CI=true` and `NODE_ENV=production` are set in the Netlify dashboard or `netlify.toml`.
- **Configuration**: See [Netlify Deployment Report](./deployment-report-netlify.md) for detailed configuration.

## Cross-Environment Consistency
To ensure the build process behaves consistently across Netlify, Docker, and local development:
- **Unified Build Command**: Always use `turbo` to manage builds and leverage caching.
- **Dependency Strategy**: Build-essential CSS tools are treated as production dependencies to survive `npm install --production`.
- **Node Alignment**: All environments should target Node.js v20 (LTS).

## Future Cloud Migration
The platform is container-native, allowing easy migration from Netlify/DigitalOcean to:
- **AWS EKS**: Using the provided Helm charts.
- **Google Cloud Run**: For serverless container execution.
- **Azure Container Apps**: For managed microservices.

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
