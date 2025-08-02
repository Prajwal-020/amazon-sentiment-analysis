# 🚀 Running the Full-Stack Sentiment Analysis Application

This guide explains how to run both the backend and frontend services together using the automated scripts.

## 📋 Quick Start (Recommended)

### 1. **One-Command Startup**
```bash
# Make the script executable and run
chmod +x run-full-stack.sh
./run-full-stack.sh
```

This single command will:
- ✅ Check all prerequisites (Python, Node.js, npm)
- ✅ Set up backend virtual environment (if needed)
- ✅ Install all dependencies automatically
- ✅ Start backend API server on port 8001
- ✅ Start frontend dashboard on port 3000
- ✅ Monitor both services and show status

### 2. **Access Your Application**
Once the script completes, you'll see:

```
🎉 Application is ready!
✅ Backend API: http://localhost:8001
   📚 API Docs: http://localhost:8001/docs
   🏥 Health Check: http://localhost:8001/health
✅ Frontend App: http://localhost:3000
```

**Open your browser and go to:**
- `http://localhost:3000` - Main dashboard
- `http://localhost:3000/dashboard` - Alternative dashboard route

### 3. **Stop the Application**
```bash
# In another terminal or press Ctrl+C in the running terminal
./stop-services.sh
```

## 🔧 Script Features

### `run-full-stack.sh` Features
- **🔍 Prerequisite Checking**: Verifies Python, Node.js, and npm
- **🔄 Automatic Setup**: Runs setup scripts if needed
- **🚀 Service Management**: Starts both services in background
- **📊 Health Monitoring**: Waits for services to be ready
- **📝 Logging**: Captures logs to files
- **🛑 Graceful Shutdown**: Handles Ctrl+C properly
- **🔧 Port Management**: Kills existing processes if ports are busy

### `stop-services.sh` Features
- **🛑 Clean Shutdown**: Gracefully stops both services
- **🔍 PID Tracking**: Uses process IDs for reliable stopping
- **🧹 Cleanup Options**: Optional log file cleanup
- **📊 Status Reporting**: Shows what was stopped

## 📖 Detailed Usage

### Running with Different Options

#### Standard Run
```bash
./run-full-stack.sh
```

#### Stop Services
```bash
# Stop services but keep logs
./stop-services.sh

# Stop services and clean logs
./stop-services.sh --clean-logs
```

#### Check Status Only
```bash
# Check if ports are in use
lsof -i :8001  # Backend
lsof -i :3000  # Frontend
```

### Manual Service Management

If you prefer to run services manually:

#### Backend Only
```bash
source venv/bin/activate
python app.py
```

#### Frontend Only
```bash
cd frontend
npm run dev
```

## 📊 Monitoring and Logs

### Log Files
The scripts create log files for monitoring:

```bash
# View backend logs
tail -f backend.log

# View frontend logs  
tail -f frontend.log

# View both logs simultaneously
tail -f backend.log frontend.log
```

### Service Status
```bash
# Check if services are running
curl http://localhost:8001/health  # Backend health
curl http://localhost:3000         # Frontend status
```

### Process Information
```bash
# View running processes
ps aux | grep python  # Backend process
ps aux | grep node    # Frontend process

# Check PID files
cat backend.pid   # Backend process ID
cat frontend.pid  # Frontend process ID
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. **Port Already in Use**
```bash
# The script automatically handles this, but manually:
lsof -ti :8001 | xargs kill -9  # Kill backend
lsof -ti :3000 | xargs kill -9  # Kill frontend
```

#### 2. **Permission Denied**
```bash
# Make scripts executable
chmod +x run-full-stack.sh
chmod +x stop-services.sh
chmod +x setup.sh
chmod +x setup-frontend.sh
```

#### 3. **Dependencies Missing**
```bash
# The script handles this, but manually:
# Backend
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

#### 4. **Services Won't Start**
```bash
# Check logs for errors
cat backend.log
cat frontend.log

# Verify prerequisites
python3 --version
node --version
npm --version
```

#### 5. **Virtual Environment Issues**
```bash
# Remove and recreate
rm -rf venv
./setup.sh
```

#### 6. **404 Error on Dashboard Route**
If you see a 404 error when accessing `/dashboard`:
```bash
# Both routes should work:
http://localhost:3000          # Main page
http://localhost:3000/dashboard # Dashboard page

# If still getting 404, restart the frontend:
./stop-services.sh
./run-full-stack.sh
```

### Debug Mode

For detailed debugging, run components separately:

```bash
# Backend with verbose output
source venv/bin/activate
python app.py

# Frontend with verbose output
cd frontend
npm run dev
```

## 🎯 What Each Service Does

### Backend (Port 8001)
- **🔍 Web Scraping**: Amazon bestseller smartphones
- **🧠 AI Analysis**: DistilBERT sentiment analysis
- **📊 Data Processing**: Composite scoring algorithm
- **🔄 API Endpoints**: RESTful API with caching
- **📚 Documentation**: Auto-generated at `/docs`

### Frontend (Port 3000)
- **🎨 Dashboard**: Professional UI with shadcn/ui
- **📈 Visualizations**: Interactive charts with Recharts
- **📱 Responsive**: Mobile-first design
- **🔄 Real-time**: Live data updates from backend
- **🌙 Themes**: Dark/light mode support

## 🚀 Production Deployment

For production deployment, see:
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Comprehensive deployment guide
- **[docker-compose.yml](docker-compose.yml)** - Container orchestration
- **[Dockerfile](Dockerfile)** - Backend containerization

### Quick Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop Docker services
docker-compose down
```

## 📈 Performance Tips

### Development
- **Hot Reload**: Both services support hot reload
- **Caching**: Backend caches results for 1 hour
- **Parallel Development**: Run services in separate terminals

### Production
- **Process Managers**: Use PM2 or systemd
- **Reverse Proxy**: Nginx for load balancing
- **Monitoring**: Health checks and logging
- **Scaling**: Multiple backend instances

## 🔐 Security Notes

### Development
- **CORS**: Enabled for localhost development
- **Debug Mode**: Detailed error messages
- **Hot Reload**: File watching enabled

### Production
- **CORS**: Restrict to specific domains
- **Environment Variables**: Use .env files
- **HTTPS**: Enable SSL/TLS
- **Rate Limiting**: Implement API limits

## 📞 Support

If you encounter issues:

1. **Check Prerequisites**: Python 3.9+, Node.js 18+
2. **Review Logs**: `backend.log` and `frontend.log`
3. **Verify Ports**: Ensure 8001 and 3000 are available
4. **Clean Start**: Stop services and restart
5. **Manual Setup**: Run individual setup scripts

For more help, see:
- **[README.md](README.md)** - Project overview
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Architecture details
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment

---

**🎉 Enjoy your sentiment analysis dashboard!**
