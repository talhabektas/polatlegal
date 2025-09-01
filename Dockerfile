# Multi-stage build: Build için Go image, production için Alpine
FROM golang:1.23-alpine AS backend-builder

WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o polatlegal-backend main.go

# Nginx için frontend hazırlama stage'i
FROM nginx:alpine AS frontend-base

# Frontend dosyalarını kopyala
COPY frontend/ /var/www/html/
COPY admin/ /var/www/admin/

# Nginx konfigürasyonunu kopyala
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/sites/polatlegal.conf /etc/nginx/conf.d/default.conf

# Production backend image
FROM alpine:latest AS backend

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

# Backend binary'sini kopyala
COPY --from=backend-builder /app/polatlegal-backend .

# Frontend dosyalarını backend container'ında da hazır tut (file uploads için)
COPY frontend/ /var/www/html/
COPY admin/ /var/www/admin/

# Environment variables
ENV DB_HOST=mysql
ENV DB_NAME=polats
ENV DB_USER=root
ENV DB_PASSWORD=61611616
ENV DOCKER_ENV=true

# Security: non-root user
RUN adduser -D -s /bin/sh appuser && \
    chown -R appuser:appuser /app /var/www
USER appuser

EXPOSE 8061

CMD ["./polatlegal-backend"]

# Frontend Nginx image
FROM frontend-base AS frontend

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]