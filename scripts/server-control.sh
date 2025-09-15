#!/bin/bash

# Claudie AI Workspace Server Control Script
# Usage: ./server-control.sh [start|stop|restart|status|logs]

case "$1" in
    start)
        echo "🚀 Starting Claudie AI Workspace services..."
        sudo supervisorctl start all
        echo "✅ All services started!"
        sudo supervisorctl status
        ;;
    
    stop)
        echo "🛑 Stopping Claudie AI Workspace services..."
        sudo supervisorctl stop all
        echo "✅ All services stopped!"
        ;;
    
    restart)
        echo "🔄 Restarting Claudie AI Workspace services..."
        sudo supervisorctl restart all
        echo "✅ All services restarted!"
        sudo supervisorctl status
        ;;
    
    status)
        echo "📊 Claudie AI Workspace Status:"
        echo "================================"
        sudo supervisorctl status
        echo ""
        echo "🌐 Public Access:"
        echo "Main Website: http://34.121.6.206"
        echo "API Docs: http://34.121.6.206/docs"
        echo "Preview URL: Check your Emergent preview panel"
        echo ""
        echo "🔍 Port Status:"
        netstat -tlnp | grep -E "(80|3000|8001|27017)" | head -10
        ;;
        
    logs)
        echo "📋 Recent logs for all services:"
        echo "================================"
        echo "--- NGINX LOGS ---"
        sudo supervisorctl tail nginx stdout | tail -5
        echo ""
        echo "--- BACKEND LOGS ---"
        sudo supervisorctl tail backend stdout | tail -5
        echo ""
        echo "--- FRONTEND LOGS ---"
        sudo supervisorctl tail frontend stdout | tail -5
        ;;
        
    test)
        echo "🧪 Testing Claudie AI Workspace..."
        echo "================================"
        
        echo "Testing main website..."
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200"; then
            echo "✅ Main website: OK"
        else
            echo "❌ Main website: FAILED"
        fi
        
        echo "Testing API documentation..."
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:80/docs | grep -q "200"; then
            echo "✅ API docs: OK"
        else
            echo "❌ API docs: FAILED"
        fi
        
        echo "Testing health endpoint..."
        if curl -s http://localhost:80/health | grep -q "healthy"; then
            echo "✅ Health check: OK"
        else
            echo "❌ Health check: FAILED"
        fi
        
        echo "Testing MongoDB..."
        if mongosh --eval "db.runCommand('ping')" --quiet | grep -q "ok.*1"; then
            echo "✅ MongoDB: OK"
        else
            echo "❌ MongoDB: FAILED"
        fi
        ;;
        
    *)
        echo "Claudie AI Workspace Server Control"
        echo "==================================="
        echo "Usage: $0 {start|stop|restart|status|logs|test}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status and access URLs"
        echo "  logs     - Show recent logs from all services"
        echo "  test     - Run connectivity tests"
        echo ""
        echo "🌐 Public Access: http://34.121.6.206"
        exit 1
        ;;
esac