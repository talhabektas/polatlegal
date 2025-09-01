#!/bin/bash

# Polat Legal - Production Deployment Script
# Server: root@134.122.64.162
# Domain: polatlegal.com

set -e

echo "🚀 Polat Legal Production Deployment Started..."

# Configuration
SERVER_IP="134.122.64.162"
SERVER_USER="root"
DOMAIN="polatlegal.com"
PROJECT_DIR="/opt/polatlegal"
BACKUP_DIR="/opt/backups/polatlegal_$(date +%Y%m%d_%H%M%S)"

echo "📋 Configuration:"
echo "   Server: $SERVER_USER@$SERVER_IP"
echo "   Domain: $DOMAIN"
echo "   Project Directory: $PROJECT_DIR"
echo "   Backup Directory: $BACKUP_DIR"

# Functions
check_dependencies() {
    echo "🔍 Checking dependencies..."
    
    if ! command -v rsync &> /dev/null; then
        echo "❌ rsync is required but not installed."
        exit 1
    fi
    
    if ! command -v ssh &> /dev/null; then
        echo "❌ ssh is required but not installed."
        exit 1
    fi
    
    echo "✅ Dependencies check passed"
}

backup_current_deployment() {
    echo "💾 Creating backup of current deployment..."
    
    ssh $SERVER_USER@$SERVER_IP "
        if [ -d $PROJECT_DIR ]; then
            mkdir -p /opt/backups
            cp -r $PROJECT_DIR $BACKUP_DIR
            echo '✅ Backup created at $BACKUP_DIR'
        else
            echo 'ℹ️  No existing deployment to backup'
        fi
    "
}

prepare_server() {
    echo "🔧 Preparing server environment..."
    
    ssh $SERVER_USER@$SERVER_IP "
        # Update system
        apt-get update
        
        # Install Docker if not present
        if ! command -v docker &> /dev/null; then
            echo '📦 Installing Docker...'
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            rm get-docker.sh
        fi
        
        # Install Docker Compose if not present
        if ! command -v docker-compose &> /dev/null; then
            echo '📦 Installing Docker Compose...'
            curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        # Create project directory
        mkdir -p $PROJECT_DIR
        mkdir -p /opt/backups
        
        # Create SSL directory
        mkdir -p $PROJECT_DIR/ssl
        
        echo '✅ Server environment prepared'
    "
}

stop_existing_services() {
    echo "⏹️  Stopping existing services..."
    
    ssh $SERVER_USER@$SERVER_IP "
        cd $PROJECT_DIR
        if [ -f docker-compose.yml ]; then
            docker-compose down || true
            docker system prune -f || true
        fi
        echo '✅ Existing services stopped'
    "
}

deploy_application() {
    echo "🚚 Deploying application files..."
    
    # Rsync project files to server
    rsync -avz --progress \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='node_modules' \
        --exclude='backend/polatlegal-backend' \
        --exclude='backend/polatlegal-backend.exe' \
        ./ $SERVER_USER@$SERVER_IP:$PROJECT_DIR/
    
    echo "✅ Application files deployed"
}

setup_ssl_certificate() {
    echo "🔒 Setting up SSL certificate..."
    
    ssh $SERVER_USER@$SERVER_IP "
        cd $PROJECT_DIR
        
        # Install Certbot if not present
        if ! command -v certbot &> /dev/null; then
            apt-get install -y certbot python3-certbot-nginx
        fi
        
        # Generate SSL certificate
        if [ ! -f ssl/cert.pem ]; then
            echo '📜 Generating SSL certificate...'
            certbot certonly --standalone --non-interactive --agree-tos --email admin@$DOMAIN -d $DOMAIN -d www.$DOMAIN || {
                echo '⚠️  SSL certificate generation failed, continuing with HTTP only'
            }
            
            # Copy certificates if generated successfully
            if [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
                cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
                cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem
                chmod 600 ssl/key.pem
                echo '✅ SSL certificates configured'
            fi
        else
            echo 'ℹ️  SSL certificate already exists'
        fi
    "
}

start_services() {
    echo "🎬 Starting services..."
    
    ssh $SERVER_USER@$SERVER_IP "
        cd $PROJECT_DIR
        
        # Build and start containers
        docker-compose up -d --build
        
        # Wait for services to be ready
        echo '⏳ Waiting for services to start...'
        sleep 30
        
        # Check service status
        docker-compose ps
        
        echo '✅ Services started successfully'
    "
}

setup_domain_dns_info() {
    echo "🌐 Domain DNS Configuration Info:"
    echo "   Add these DNS records to your domain registrar (GoDaddy):"
    echo "   Type: A Record"
    echo "   Name: @ (or leave blank for root domain)"
    echo "   Value: $SERVER_IP"
    echo "   TTL: 3600 (1 hour)"
    echo ""
    echo "   Type: A Record"
    echo "   Name: www"
    echo "   Value: $SERVER_IP"
    echo "   TTL: 3600 (1 hour)"
    echo ""
    echo "   After DNS propagation (may take up to 24 hours), your site will be available at:"
    echo "   http://$DOMAIN"
    echo "   http://www.$DOMAIN"
}

verify_deployment() {
    echo "✅ Verifying deployment..."
    
    ssh $SERVER_USER@$SERVER_IP "
        cd $PROJECT_DIR
        
        echo '📊 Service Status:'
        docker-compose ps
        
        echo -e '\n📝 Container Logs (last 20 lines):'
        docker-compose logs --tail=20
        
        echo -e '\n🔗 Testing local connections:'
        curl -s -o /dev/null -w '%{http_code}' http://localhost/ || echo 'Frontend test failed'
        curl -s -o /dev/null -w '%{http_code}' http://localhost/api/services || echo 'Backend API test failed'
    "
}

cleanup() {
    echo "🧹 Cleaning up..."
    ssh $SERVER_USER@$SERVER_IP "docker system prune -f" || true
}

# Main execution
main() {
    echo "Starting deployment process..."
    
    check_dependencies
    backup_current_deployment
    prepare_server
    stop_existing_services
    deploy_application
    setup_ssl_certificate
    start_services
    verify_deployment
    cleanup
    setup_domain_dns_info
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "🌐 Your website should be available at:"
    echo "   http://$DOMAIN (and https if SSL was configured)"
    echo "   http://$SERVER_IP (direct IP access)"
    echo ""
    echo "🔧 Admin panel: http://$DOMAIN/admin"
    echo "📊 API endpoint: http://$DOMAIN/api"
    echo ""
    echo "💡 To check logs: ssh $SERVER_USER@$SERVER_IP 'cd $PROJECT_DIR && docker-compose logs -f'"
    echo "💡 To restart: ssh $SERVER_USER@$SERVER_IP 'cd $PROJECT_DIR && docker-compose restart'"
}

# Check if running with --help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Polat Legal Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh"
    echo ""
    echo "This script will:"
    echo "  1. Backup existing deployment"
    echo "  2. Prepare server environment (install Docker, etc.)"
    echo "  3. Deploy application files"
    echo "  4. Setup SSL certificate (Let's Encrypt)"
    echo "  5. Start services with Docker Compose"
    echo "  6. Verify deployment"
    echo ""
    echo "Requirements:"
    echo "  - SSH access to the server"
    echo "  - rsync installed locally"
    echo "  - Domain DNS configured to point to server IP"
    exit 0
fi

# Run main function
main
