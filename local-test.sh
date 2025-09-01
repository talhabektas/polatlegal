#!/bin/bash

# Polat Legal - Local Test Script
# Bu script projeyi lokalde test etmek için kullanılır

set -e

echo "🔧 Polat Legal - Local Test Environment"
echo "======================================="

# Functions
cleanup() {
    echo "🧹 Cleaning up existing containers..."
    docker-compose down -v 2>/dev/null || true
    docker system prune -f 2>/dev/null || true
}

build_and_start() {
    echo "🏗️  Building and starting containers..."
    
    # Build containers
    docker-compose build --no-cache
    
    # Start services
    docker-compose up -d
    
    echo "⏳ Waiting for services to initialize..."
    sleep 30
}

check_services() {
    echo "🔍 Checking service status..."
    
    echo "📊 Container Status:"
    docker-compose ps
    
    echo -e "\n📝 Recent Logs:"
    docker-compose logs --tail=10
    
    echo -e "\n🌐 Testing Services:"
    
    # Test frontend
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
        echo "✅ Frontend: http://localhost - OK"
    else
        echo "❌ Frontend: http://localhost - FAILED"
    fi
    
    # Test API
    if curl -s -o /dev/null -w "%{http_code}" http://localhost/api/services | grep -q "200"; then
        echo "✅ API: http://localhost/api/services - OK"
    else
        echo "❌ API: http://localhost/api/services - FAILED"
    fi
    
    # Test Admin Panel
    if curl -s -o /dev/null -w "%{http_code}" http://localhost/admin/ | grep -q "200"; then
        echo "✅ Admin Panel: http://localhost/admin/ - OK"
    else
        echo "❌ Admin Panel: http://localhost/admin/ - FAILED"
    fi
    
    # Test Database Connection
    if docker-compose exec -T mysql mysqladmin ping -h localhost -u root -p61611616 2>/dev/null | grep -q "alive"; then
        echo "✅ Database: MySQL - OK"
    else
        echo "❌ Database: MySQL - FAILED"
    fi
}

show_info() {
    echo -e "\n🎉 Local test environment is ready!"
    echo "======================================"
    echo "🌐 Frontend: http://localhost"
    echo "🔧 Admin Panel: http://localhost/admin"
    echo "📊 API: http://localhost/api"
    echo "🗄️  Database: localhost:3306"
    echo ""
    echo "Default admin login:"
    echo "Username: admin"
    echo "Password: AdminPolat2024!Legal@Strong#Password$9876"
    echo ""
    echo "📝 Useful commands:"
    echo "View logs: docker-compose logs -f"
    echo "Stop services: docker-compose down"
    echo "Restart: docker-compose restart"
    echo "Clean everything: docker-compose down -v && docker system prune -f"
}

# Main execution
case "${1:-start}" in
    "start")
        cleanup
        build_and_start
        check_services
        show_info
        ;;
    "stop")
        echo "⏹️ Stopping services..."
        docker-compose down
        echo "✅ Services stopped"
        ;;
    "clean")
        echo "🧹 Cleaning everything..."
        docker-compose down -v
        docker system prune -f
        echo "✅ Everything cleaned"
        ;;
    "logs")
        echo "📝 Showing logs..."
        docker-compose logs -f
        ;;
    "status")
        check_services
        ;;
    "restart")
        echo "🔄 Restarting services..."
        docker-compose restart
        echo "✅ Services restarted"
        ;;
    *)
        echo "Usage: $0 {start|stop|clean|logs|status|restart}"
        echo ""
        echo "Commands:"
        echo "  start   - Build and start all services (default)"
        echo "  stop    - Stop all services"
        echo "  clean   - Remove all containers and volumes"
        echo "  logs    - Show real-time logs"
        echo "  status  - Check service status"
        echo "  restart - Restart all services"
        exit 1
        ;;
esac
