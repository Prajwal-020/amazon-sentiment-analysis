#!/bin/bash

# Full-Stack Sentiment Analysis Application Runner
# This script starts both backend and frontend services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        print_warning "Killing existing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Function to setup backend
setup_backend() {
    print_header "🔧 Setting up Backend..."
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_status "Virtual environment not found. Running setup..."
        if [ -f "setup.sh" ]; then
            chmod +x setup.sh
            ./setup.sh
        else
            print_error "setup.sh not found. Please run backend setup manually."
            exit 1
        fi
    else
        print_success "Virtual environment found"
    fi
    
    # Check if requirements are installed
    if ! source venv/bin/activate && python -c "import fastapi, transformers" 2>/dev/null; then
        print_status "Installing/updating requirements..."
        source venv/bin/activate
        pip install -r requirements.txt
    fi
    
    print_success "Backend setup complete"
}

# Function to setup frontend
setup_frontend() {
    print_header "🎨 Setting up Frontend..."
    
    if [ ! -d "frontend" ]; then
        print_status "Frontend directory not found. Running setup..."
        if [ -f "setup-frontend.sh" ]; then
            chmod +x setup-frontend.sh
            ./setup-frontend.sh
        else
            print_error "setup-frontend.sh not found. Please run frontend setup manually."
            exit 1
        fi
    else
        print_success "Frontend directory found"
    fi
    
    # Check if node_modules exists
    if [ ! -d "frontend/node_modules" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
    fi
    
    print_success "Frontend setup complete"
}

# Function to start backend
start_backend() {
    print_header "🚀 Starting Backend Server..."
    
    # Kill any existing process on port 8001
    if port_in_use 8001; then
        kill_port 8001
    fi
    
    # Start backend in background
    print_status "Starting FastAPI server on http://localhost:8001"
    source venv/bin/activate
    nohup python app.py > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    # Wait for backend to be ready
    if wait_for_service "http://localhost:8001/health" "Backend API"; then
        print_success "Backend server started successfully (PID: $BACKEND_PID)"
        print_status "Backend logs: tail -f backend.log"
        print_status "API Documentation: http://localhost:8001/docs"
    else
        print_error "Backend failed to start. Check backend.log for details."
        exit 1
    fi
}

# Function to start frontend
start_frontend() {
    print_header "🌐 Starting Frontend Server..."
    
    # Kill any existing process on port 3000
    if port_in_use 3000; then
        kill_port 3000
    fi
    
    # Start frontend in background
    print_status "Starting Next.js server on http://localhost:3000"
    cd frontend
    nohup npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    cd ..
    
    # Wait for frontend to be ready
    if wait_for_service "http://localhost:3000" "Frontend App"; then
        print_success "Frontend server started successfully (PID: $FRONTEND_PID)"
        print_status "Frontend logs: tail -f frontend.log"
    else
        print_error "Frontend failed to start. Check frontend.log for details."
        exit 1
    fi
}

# Function to show status
show_status() {
    print_header "📊 Application Status"
    echo ""
    
    # Check backend
    if port_in_use 8001; then
        print_success "✅ Backend API: http://localhost:8001"
        print_status "   📚 API Docs: http://localhost:8001/docs"
        print_status "   🏥 Health Check: http://localhost:8001/health"
    else
        print_error "❌ Backend API: Not running"
    fi
    
    # Check frontend
    if port_in_use 3000; then
        print_success "✅ Frontend App: http://localhost:3000"
    else
        print_error "❌ Frontend App: Not running"
    fi
    
    echo ""
    print_status "📝 Log files:"
    print_status "   Backend: backend.log"
    print_status "   Frontend: frontend.log"
    
    echo ""
    print_status "🛑 To stop services: ./stop-services.sh"
}

# Function to cleanup on exit
cleanup() {
    print_warning "Received interrupt signal. Cleaning up..."
    
    if [ -f "backend.pid" ]; then
        BACKEND_PID=$(cat backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm -f backend.pid
    fi
    
    if [ -f "frontend.pid" ]; then
        FRONTEND_PID=$(cat frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm -f frontend.pid
    fi
    
    print_status "Cleanup complete"
    exit 0
}

# Main execution
main() {
    print_header "🚀 Full-Stack Sentiment Analysis Application"
    print_header "=============================================="
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists python3; then
        print_error "Python 3 is required but not installed"
        exit 1
    fi
    
    if ! command_exists node; then
        print_error "Node.js is required but not installed"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is required but not installed"
        exit 1
    fi
    
    print_success "All prerequisites found"
    echo ""
    
    # Setup trap for cleanup
    trap cleanup SIGINT SIGTERM
    
    # Setup and start services
    setup_backend
    echo ""
    setup_frontend
    echo ""
    start_backend
    echo ""
    start_frontend
    echo ""
    
    # Show final status
    show_status
    
    print_header "🎉 Application is ready!"
    print_status "Press Ctrl+C to stop all services"
    
    # Keep script running
    while true; do
        sleep 10
        
        # Check if services are still running
        if ! port_in_use 8001; then
            print_error "Backend service stopped unexpectedly"
            break
        fi
        
        if ! port_in_use 3000; then
            print_error "Frontend service stopped unexpectedly"
            break
        fi
    done
}

# Run main function
main "$@"
