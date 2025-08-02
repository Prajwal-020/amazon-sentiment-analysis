#!/bin/bash

# Stop Full-Stack Sentiment Analysis Application
# This script stops both backend and frontend services

# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local service_name=$2
    
    if port_in_use $port; then
        local pid=$(lsof -ti :$port)
        if [ ! -z "$pid" ]; then
            print_status "Stopping $service_name (PID: $pid) on port $port"
            kill -TERM $pid 2>/dev/null || true
            sleep 3
            
            # Force kill if still running
            if port_in_use $port; then
                print_warning "Force killing $service_name"
                kill -9 $pid 2>/dev/null || true
                sleep 1
            fi
            
            if ! port_in_use $port; then
                print_success "$service_name stopped successfully"
            else
                print_error "Failed to stop $service_name"
            fi
        fi
    else
        print_status "$service_name is not running on port $port"
    fi
}

# Function to stop services using PID files
stop_by_pid() {
    # Stop backend
    if [ -f "backend.pid" ]; then
        local backend_pid=$(cat backend.pid)
        if kill -0 $backend_pid 2>/dev/null; then
            print_status "Stopping backend service (PID: $backend_pid)"
            kill -TERM $backend_pid 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            if kill -0 $backend_pid 2>/dev/null; then
                print_warning "Force killing backend service"
                kill -9 $backend_pid 2>/dev/null || true
            fi
            
            print_success "Backend service stopped"
        fi
        rm -f backend.pid
    fi
    
    # Stop frontend
    if [ -f "frontend.pid" ]; then
        local frontend_pid=$(cat frontend.pid)
        if kill -0 $frontend_pid 2>/dev/null; then
            print_status "Stopping frontend service (PID: $frontend_pid)"
            kill -TERM $frontend_pid 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            if kill -0 $frontend_pid 2>/dev/null; then
                print_warning "Force killing frontend service"
                kill -9 $frontend_pid 2>/dev/null || true
            fi
            
            print_success "Frontend service stopped"
        fi
        rm -f frontend.pid
    fi
}

# Function to clean up log files
cleanup_logs() {
    if [ "$1" = "--clean-logs" ]; then
        print_status "Cleaning up log files..."
        rm -f logs/backend.log logs/frontend.log
        print_success "Log files cleaned"
    else
        print_status "Log files preserved (use --clean-logs to remove them)"
    fi
}

# Main execution
main() {
    print_header "🛑 Stopping Full-Stack Sentiment Analysis Application"
    print_header "===================================================="
    echo ""
    
    # Stop services using PID files first
    stop_by_pid
    
    # Also stop by port (backup method)
    kill_port 8001 "Backend API"
    kill_port 3000 "Frontend App"
    
    echo ""
    
    # Clean up logs if requested
    cleanup_logs "$1"
    
    echo ""
    print_header "✅ All services stopped"
    print_status "To start again: ./scripts/run-full-stack.sh"
}

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [--clean-logs]"
    echo ""
    echo "Options:"
    echo "  --clean-logs    Remove log files after stopping services"
    echo "  --help, -h      Show this help message"
    echo ""
    echo "This script stops both backend and frontend services of the"
    echo "Sentiment Analysis application."
    exit 0
fi

# Run main function
main "$@"
