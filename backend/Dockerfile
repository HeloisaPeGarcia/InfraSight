# Multi-stage build for Go Backend & Frontend integration

# Stage 1: Build Frontend Assets
FROM node:22-alpine AS frontend-builder
WORKDIR /app/web

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ ./
RUN npm run build

# Stage 2: Build Go Binary with Embedded Frontend Assets
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
# Copy built dist files from stage 1 into backend embed directory
COPY --from=frontend-builder /app/backend/dist ./dist

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o infrasight main.go

# Stage 3: Minimal Production Image
FROM alpine:latest
WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=backend-builder /app/backend/infrasight /app/infrasight

# Create directory for SQLite persistence
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/infrasight.db
ENV PORT=8080

EXPOSE 8080

CMD ["/app/infrasight"]
