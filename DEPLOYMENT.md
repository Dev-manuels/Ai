# Deployment Guide

This project is built as a containerized monorepo and is designed to be platform-agnostic, supporting any environment that can run Docker containers or Kubernetes clusters.

## Supported Platforms

### 1. DigitalOcean App Platform (Managed Production)

DigitalOcean App Platform is highly recommended for managed production environments. It provides a seamless way to deploy monorepos with multiple components.

**Configuration:**

- **Web App**:
  - **Source**: Root of the repository.
  - **Dockerfile**: `apps/web/Dockerfile`.
  - **Environment Variables**: `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
- **API Service**:
  - **Source**: Root of the repository.
  - **Dockerfile**: `apps/api/Dockerfile`.
  - **Environment Variables**: `DATABASE_URL`, `REDIS_URL`.
- **ML Service**:
  - **Source**: Root of the repository.
  - **Dockerfile**: `services/ml/Dockerfile`.
  - **Environment Variables**: `DATABASE_URL`, `REDIS_URL`.
- **Databases**: Use **DigitalOcean Managed Databases** for PostgreSQL and Redis to ensure high availability and automated backups.

### 2. Kubernetes (Scaling & High Availability)

The project is "Kubernetes-first" and includes Helm charts for institutional-grade deployments. This is the **best case** for scaling and high availability.

**Platforms**: AWS EKS, Google Kubernetes Engine (GKE), DigitalOcean Kubernetes (DOKS), or Azure AKS.

**Deployment via Helm:**

```bash
helm upgrade --install football-intelligence ./k8s/helm/football-intelligence
```

_Note: Ensure your `values.yaml` is configured with production-grade database credentials or connected to managed database services via external services._

### 3. AWS (Enterprise Grade)

- **EKS**: Recommended for full control using the provided Helm charts.
- **AWS App Runner**: Ideal for a simplified container-to-web service deployment for each component.
- **ECS (Fargate)**: A serverless container option that removes the need to manage EC2 instances.

### 4. Docker Compose (VPS / Development)

For low-cost production on a single VPS (e.g., DigitalOcean Droplet) or for local development:

```bash
docker-compose up -d
```

## Required Environment Variables

| Variable              | Description                                | Component |
| --------------------- | ------------------------------------------ | --------- |
| `DATABASE_URL`        | PostgreSQL connection string               | API, ML   |
| `REDIS_URL`           | Redis connection string                    | API, ML   |
| `NEXT_PUBLIC_API_URL` | Public endpoint for the API Gateway        | Web       |
| `NEXTAUTH_URL`        | Canonical URL of the web application       | Web       |
| `NEXTAUTH_SECRET`     | Secure random string for session signing   | Web       |
| `ADMIN_ACCESS_TOKEN`  | Secure token for administrative API access | Web, API  |

## Best Practices for Production

- **Security**: Always use Managed Databases with SSL enabled.
- **Caching**: Use a Redis Cluster for distributed state management across multiple replicas.
- **Monitoring**: Utilize the included Prometheus configuration (`k8s/prometheus.yml`) to monitor system health and model performance.
- **CI/CD**: Automate builds and deployments via GitHub Actions or DigitalOcean's native CI/CD.
