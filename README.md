# Football Intelligence Platform

An institutional-grade football prediction system prioritizing long-term expected value (EV), statistical edge, and strict risk control.

## Project Structure

- `apps/web`: Next.js frontend application.
- `apps/api`: Node.js API Gateway.
- `services/ml`: Python-based Machine Learning service.
- `packages/database`: Shared Prisma database schema and client.
- `k8s/`: Kubernetes configurations and Helm charts.

## Deployment

This project is containerized and supports multiple deployment platforms:

- **DigitalOcean App Platform** (Managed)
- **Kubernetes** (AWS EKS, GKE, DOKS)
- **AWS** (App Runner, ECS)
- **Docker Compose** (VPS/Local)

For detailed deployment instructions, please see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Development

To start the project locally using Docker Compose:

```bash
docker-compose up
```
