# Live Intelligence and Real-time Systems

## Overview
The platform must react to market movements within milliseconds. Our real-time stack ensures that predictions and odds are always in sync.

## 1. Event-Driven Architecture
We use **Redis Streams** as the backbone for inter-service communication.
- **`market:odds`**: Stream for incoming odds updates.
- **`predictions:live`**: Stream for newly generated predictions.
- **`events:settlement`**: Stream for match results and bet settlements.

## 2. Real-time Delivery
- **Socket.io**: The API Gateway maintains a persistent connection with the Frontend.
- **Rooms**: Clients join specific "rooms" (e.g., `league:epl`, `fixture:123`) to receive targeted updates without excessive noise.
- **Latency**: Targeted sub-200ms latency from odds ingestion to dashboard update.

## 3. In-Memory State
Critical data is cached in Redis to avoid DB bottlenecks:
- **Active Fixtures**: Stored as Redis Hashes for instant lookup.
- **Odds Buffers**: Windowed storage of recent odds movements to calculate "velocity" features.
- **Rate Limiting**: Per-user and per-IP limits managed via Redis.

## 4. Live Ingestion Strategies
The platform supports multiple ingestion strategies depending on the provider:
- **Streaming**: Preferred for low-latency providers (e.g., Betfair, Sportmonks WebSocket).
- **Adaptive Polling**: Used for providers without native streaming (e.g., API-Football). The system adjusts polling frequency based on match status and market volatility.

## 5. Live Betting Constraints
During live match play:
- **Data Latency**: We ignore odds that are older than 5 seconds.
- **Match State**: The system automatically halts betting during high-leverage events (e.g., penalties, VAR reviews) as signaled by the data provider.
