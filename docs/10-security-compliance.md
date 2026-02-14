# Security and Compliance

## 1. Authentication and Authorization
- **NextAuth.js**: Primary authentication layer for the web dashboard.
- **RBAC (Role-Based Access Control)**:
    - `USER`: Access to personal portfolios and basic predictions.
    - `ADMIN`: Access to system-wide metrics, model configuration, and user management.
    - `INSTITUTIONAL`: Read-only access to high-fidelity data streams and API access keys.

## 2. API Security
- **API Keys**: External integrations must use signed API keys.
- **Rate Limiting**: Enforced at the Gateway level to prevent DDoS and scraping attacks.
- **CORS**: Strictly restricted to authorized domains.

## 3. Secrets Management
- **Local**: Managed via `.env` (ignored by git).
- **Production**: Managed via Kubernetes Secrets or AWS Secrets Manager.
- **Tokens**: `ADMIN_ACCESS_TOKEN` is required for sensitive administrative endpoints and must be rotated regularly.

## 4. Data Governance
- **Audit Trails**: All actions (betting, portfolio changes, model updates) are logged with a timestamp and user ID.
- **Data Privacy**: No PII (Personally Identifiable Information) is stored beyond what is strictly necessary for authentication.
- **Traceability**: The feature snapshotting system ensures that every prediction is audit-ready for regulatory or internal review.

## 5. Compliance
The platform is designed with modularity to accommodate different regional regulations.
- **Jurisdiction Checks**: Can be implemented at the portfolio level to restrict betting based on geographic location.
- **Logging**: 5-year retention for all financial transactions and prediction snapshots.
