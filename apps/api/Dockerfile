FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
RUN npm install
COPY . .
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma
RUN npm run build --filter=@football/api

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3001
CMD ["npm", "start", "--filter=@football/api"]
