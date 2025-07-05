# 🚀 Deployment Guide

## Overview

This guide covers multiple deployment options for the Sentiment Analysis application, from local development to production cloud deployment.

## 📋 Prerequisites

- Docker & Docker Compose
- Git
- Cloud platform account (optional)

## 🏠 Local Development Deployment

### Quick Start (Recommended)

1. **Clone the repository**:
```bash
git clone <repository-url>
cd sentiment_analysis
```

2. **Backend Setup**:
```bash
chmod +x setup.sh
./setup.sh
```

3. **Frontend Setup**:
```bash
chmod +x setup-frontend.sh
./setup-frontend.sh
```

4. **Start Services**:
```bash
# Terminal 1 - Backend
source venv/bin/activate
python app.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. **Access Application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

## 🐳 Docker Deployment

### Single Container Deployment

#### Backend Container
```bash
# Build backend image
docker build -t sentiment-api .

# Run backend container
docker run -p 8001:8001 sentiment-api
```

#### Frontend Container
```bash
# Build frontend image
cd frontend
docker build -t sentiment-frontend .

# Run frontend container
docker run -p 3000:3000 sentiment-frontend
```

### Multi-Container with Docker Compose

1. **Start all services**:
```bash
docker-compose up --build
```

2. **Run in background**:
```bash
docker-compose up -d --build
```

3. **Stop services**:
```bash
docker-compose down
```

4. **View logs**:
```bash
docker-compose logs -f
```

### Docker Compose Configuration

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8001:8001"
    environment:
      - PYTHONUNBUFFERED=1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8001
```

## ☁️ Cloud Deployment

### Backend Deployment Options

#### 1. Railway (Recommended)

1. **Connect Repository**:
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository
   - Select the root directory

2. **Configure Environment**:
   ```env
   PORT=8001
   PYTHONPATH=/app
   ```

3. **Deploy**:
   - Railway auto-deploys on git push
   - Custom domain available

#### 2. Render

1. **Create Web Service**:
   - Connect GitHub repository
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

2. **Environment Variables**:
   ```env
   PYTHON_VERSION=3.11
   ```

#### 3. AWS Fargate

1. **Create ECR Repository**:
```bash
aws ecr create-repository --repository-name sentiment-api
```

2. **Build and Push Image**:
```bash
docker build -t sentiment-api .
docker tag sentiment-api:latest <account>.dkr.ecr.<region>.amazonaws.com/sentiment-api:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/sentiment-api:latest
```

3. **Create ECS Service**:
   - Use AWS Console or CLI
   - Configure load balancer
   - Set up auto-scaling

### Frontend Deployment Options

#### 1. Vercel (Recommended)

1. **Connect Repository**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `frontend`

2. **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

3. **Deploy**:
   - Auto-deploys on git push
   - Custom domain included

#### 2. Netlify

1. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `frontend/.next`
   - Base directory: `frontend`

2. **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

#### 3. AWS Amplify

1. **Connect Repository**:
   - Use AWS Amplify Console
   - Connect GitHub repository

2. **Build Configuration** (amplify.yml):
```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - cd frontend
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: frontend/.next
        files:
          - '**/*'
      cache:
        paths:
          - frontend/node_modules/**/*
```

## 🔧 Production Configuration

### Environment Variables

#### Backend (.env)
```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8001
DEBUG=False

# Cache Settings
CACHE_TTL=3600
CACHE_SIZE=100

# Security
CORS_ORIGINS=["https://your-frontend-domain.com"]

# Scraping Settings
REQUEST_TIMEOUT=10
MAX_REVIEWS=50
USER_AGENT="YourApp/1.0"
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_APP_NAME="Sentiment Analysis Dashboard"
```

### Security Considerations

#### Backend Security
```python
# In app.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],  # Specific origins
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

#### Rate Limiting
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/top-mobiles")
@limiter.limit("10/minute")
async def get_top_mobiles(request: Request):
    # Your endpoint logic
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "model_loaded": sentiment_pipeline is not None,
        "cache_size": len(cache)
    }
```

### Monitoring Setup

#### 1. Application Monitoring
- **Sentry**: Error tracking
- **DataDog**: Performance monitoring
- **New Relic**: Full-stack observability

#### 2. Infrastructure Monitoring
- **AWS CloudWatch**: AWS resources
- **Railway Metrics**: Railway deployments
- **Vercel Analytics**: Frontend performance

### Logging Configuration
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Test Backend
        run: |
          python -m pip install -r requirements.txt
          python test_api.py

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway
        run: |
          # Railway deployment commands

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: |
          # Vercel deployment commands
```

## 🚨 Troubleshooting

### Common Issues

#### 1. CORS Errors
```javascript
// Frontend: Check API URL in environment variables
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

// Backend: Verify CORS configuration
app.add_middleware(CORSMiddleware, allow_origins=["*"])  # Development only
```

#### 2. Model Loading Issues
```python
# Check model cache directory
import os
print("Cache dir:", os.path.expanduser("~/.cache/huggingface"))

# Clear cache if needed
rm -rf ~/.cache/huggingface/transformers
```

#### 3. Memory Issues
```python
# Reduce model precision
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english",
    torch_dtype=torch.float16  # Use half precision
)
```

### Performance Optimization

#### Backend Optimization
- Use async/await for I/O operations
- Implement connection pooling
- Add response compression
- Use CDN for static assets

#### Frontend Optimization
- Enable Next.js Image Optimization
- Implement code splitting
- Use React.memo for expensive components
- Add service worker for caching

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Database for persistent storage
- Redis for distributed caching
- Message queues for background tasks

### Vertical Scaling
- Increase container resources
- Optimize memory usage
- Use faster storage (SSD)
- Upgrade to better CPU

This deployment guide provides comprehensive instructions for deploying the sentiment analysis application across various platforms and environments.
