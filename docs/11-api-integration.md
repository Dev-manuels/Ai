# API and Integration Guide

## Overview
The platform provides a robust REST and WebSocket API for institutional integration.

## 1. REST API
All endpoints are prefixed with `/api`.

### Authentication
Include the API Key in the header:
`Authorization: Bearer <your_api_key>`

### Key Endpoints
- `GET /api/predictions`: Returns the latest 20 predictions with fixtures and probabilities.
- `GET /api/portfolios`: Manage your portfolios and track performance.
- `POST /api/webhooks/stripe`: Handle subscription and billing events.

## 2. Real-time Streaming (WebSockets)
Connect to `ws://api.football-intelligence.com`.

### Events
- `subscribe:odds`: Subscribe to odds updates for a specific fixture.
- `odds:update`: Received when a market line moves.
- `prediction:new`: Received when the ML service generates a new prediction.

## 3. Stripe Integration
We use Stripe for subscription management (Free, Pro, Institutional).
- **Webhooks**: Must be configured to point to `/api/webhooks/stripe`.
- **Products**: Tiers are defined in the Stripe Dashboard and mapped to roles in the `User` table.

## 4. External Data Providers
To add a new provider:
1. Implement the `ProviderAdapter` interface in `apps/api`.
2. Map the external IDs to our internal `Team` and `League` models.
3. Configure the sync interval in the environment variables.
