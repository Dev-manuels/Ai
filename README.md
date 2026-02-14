# Football Intelligence Platform

An institutional-grade football prediction and automated risk management system prioritizing long-term expected value (EV), statistical edge, and strict risk control.

[![CI](https://github.com/football/platform/actions/workflows/ci.yml/badge.svg)](https://github.com/football/platform/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Overview
The Football Intelligence Platform is a modular monorepo designed for high-fidelity sports market modeling. It combines classical statistical models (Dixon-Coles) with modern Gradient Boosting ensembles to generate highly calibrated probabilities for global football markets.

### Key Pillars
- **Calibration**: Every probability is calibrated using Isotonic Regression to ensure long-term reliability.
- **Risk Management**: Automated fractional Kelly stake sizing and real-time correlation detection.
- **Traceability**: Full feature snapshotting for every prediction to ensure auditability.
- **Scalability**: Kubernetes-first architecture with event-driven service communication.

## 📚 Documentation
Our documentation is organized into modular sections for different stakeholders:

### Getting Started
1. [**Vision & Goals**](./docs/01-vision.md) - Project philosophy and KPIs.
2. [**Architecture**](./docs/02-architecture.md) - System design and data flow.
3. [**Development Setup**](./docs/03-development-setup.md) - Local setup with Docker Compose.
4. [**Production Deployment**](./docs/04-production-deployment.md) - Kubernetes and Helm guide.

### Core Systems
5. [**Data & Feature Pipelines**](./docs/05-data-pipelines.md) - Ingestion and snapshotting.
6. [**ML Modeling**](./docs/06-ml-modeling.md) - Dixon-Coles and GBM ensembles.
7. [**Risk & Portfolios**](./docs/07-risk-management.md) - Kelly Criterion and risk controls.
8. [**Real-time Intelligence**](./docs/08-realtime-intelligence.md) - Live odds and event-driven updates.

### Operations & Maintenance
9. [**Monitoring & Observability**](./docs/09-observability.md) - Prometheus and drift detection.
10. [**Security & Compliance**](./docs/10-security-compliance.md) - RBAC and data governance.
11. [**API & Integration**](./docs/11-api-integration.md) - REST/WS endpoints and Stripe.
12. [**System Evolution**](./docs/12-evolution-cicd.md) - CI/CD and how to update models.

## 🛠 Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS, Recharts.
- **API Gateway**: Node.js, Express, TypeScript, Socket.io.
- **ML Service**: Python, FastAPI, Scikit-Learn, XGBoost.
- **Database**: PostgreSQL, Prisma ORM.
- **Infrastructure**: Docker, Kubernetes, Helm, Redis, Prometheus.

## 🚦 Quick Start
```bash
# Install dependencies
npm install

# Spin up infrastructure
docker-compose up -d postgres redis

# Initialize database
npx prisma db push --workspace=@football/database

# Start development servers
npm run dev
```

## ⚖️ License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
