# 📋 Quick Reference Card

## 🚀 Essential Commands

### Start Application
```bash
./run-full-stack.sh
```

### Stop Application
```bash
./stop-services.sh
```

### Access Points
- **Dashboard**: http://localhost:3000 (or /dashboard)
- **API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

## 🔧 Troubleshooting

### Check Status
```bash
# Check if services are running
curl http://localhost:8001/health  # Backend
curl http://localhost:3000         # Frontend
```

### View Logs
```bash
tail -f backend.log    # Backend logs
tail -f frontend.log   # Frontend logs
```

### Force Stop
```bash
# Kill processes on ports
lsof -ti :8001 | xargs kill -9  # Backend
lsof -ti :3000 | xargs kill -9  # Frontend
```

### Clean Restart
```bash
./stop-services.sh --clean-logs
./run-full-stack.sh
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `run-full-stack.sh` | Start both services |
| `stop-services.sh` | Stop both services |
| `app.py` | Backend API server |
| `frontend/` | Next.js dashboard |
| `backend.log` | Backend logs |
| `frontend.log` | Frontend logs |

## 🎯 What Each Service Does

### Backend (Port 8001)
- Scrapes Amazon smartphone data
- Performs AI sentiment analysis
- Provides REST API endpoints
- Caches results for performance

### Frontend (Port 3000)
- Professional dashboard interface
- Interactive charts and visualizations
- Real-time data updates
- Mobile-responsive design

## 🔄 Development Workflow

1. **Start**: `./run-full-stack.sh`
2. **Develop**: Edit files (auto-reload enabled)
3. **Test**: Check http://localhost:3000
4. **Debug**: Check logs if needed
5. **Stop**: `./stop-services.sh`

## 📚 Documentation

- **[README.md](README.md)** - Project overview
- **[RUNNING_THE_APP.md](RUNNING_THE_APP.md)** - Detailed running guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Architecture details

---
**💡 Tip**: Keep this reference handy for quick access to common commands!
