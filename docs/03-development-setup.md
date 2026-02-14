# Local Development Setup

## Prerequisites
- Node.js (v20+)
- Docker and Docker Compose
- Python 3.11+ (for ML service development)

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd football-intelligence-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment files (or create them):
   ```bash
   # Root level
   cat <<EOF > .env
   DATABASE_URL="postgresql://user:password@localhost:5432/football_db?schema=public"
   REDIS_URL="redis://localhost:6379"
   STRIPE_SECRET_KEY="sk_test_..."
   OPENAI_API_KEY="sk-..."
   ADMIN_ACCESS_TOKEN="dev-token-123"
   EOF
   ```

4. **Spin up Infrastructure**:
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Initialize Database**:
   ```bash
   npx prisma generate --workspace=@football/database
   npx prisma db push --workspace=@football/database
   ```

6. **Run the Stack**:
   ```bash
   npm run dev
   ```

## Service Access
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **ML Service**: http://localhost:8000
- **Prometheus**: http://localhost:9090

## Troubleshooting
- **Database Connection**: Ensure the `DATABASE_URL` in `.env` matches the port and credentials in `docker-compose.yml`.
- **Turbo Cache**: If you encounter build issues, try `npx turbo clean`.
- **Prisma Type Mismatch**: Re-run `npm install` and `npx prisma generate` to sync types across the monorepo.
