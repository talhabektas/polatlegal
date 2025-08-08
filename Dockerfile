# Go uygulaması için Dockerfile
FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN go build -o polatlegal-backend main.go

# Production image
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /app/polatlegal-backend .

# Güvenlik: non-root user
RUN adduser -D appuser
USER appuser

EXPOSE 8061
CMD ["./polatlegal-backend"] 