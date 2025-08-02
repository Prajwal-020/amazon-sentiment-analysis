# 📁 Project Structure

## Overview
```
sentiment_analysis/
├── 📄 README.md                    # Main project documentation
├── 📄 PROJECT_STRUCTURE.md         # This file
├── 📄 requirements.txt             # Python dependencies
├── 📄 app.py                      # Main FastAPI application
├── 📄 test_api.py                 # API testing script
├── 📄 setup.sh                    # Backend setup script
├── 📄 setup-frontend.sh           # Frontend setup script
├── 📄 Dockerfile                  # Docker configuration
├── 📄 docker-compose.yml          # Multi-container setup
├── 📁 venv/                       # Python virtual environment
└── 📁 frontend/                   # Next.js frontend application
    ├── 📄 package.json            # Node.js dependencies
    ├── 📄 next.config.js           # Next.js configuration
    ├── 📄 tailwind.config.js       # Tailwind CSS config
    ├── 📄 components.json          # shadcn/ui config
    ├── 📁 src/
    │   ├── 📁 app/
    │   │   ├── 📄 layout.tsx       # Root layout
    │   │   ├── 📄 page.tsx         # Home page
    │   │   └── 📄 globals.css      # Global styles
    │   └── 📁 components/
    │       ├── 📄 SentimentDashboard.tsx  # Main dashboard
    │       └── 📁 ui/              # shadcn/ui components
    └── 📁 public/                  # Static assets
```

## 🔧 Backend Files

### Core Application
- **`app.py`** - Main FastAPI application with all endpoints and logic
- **`requirements.txt`** - Python package dependencies
- **`test_api.py`** - Comprehensive API testing suite

### Setup & Deployment
- **`setup.sh`** - Automated backend environment setup
- **`Dockerfile`** - Container configuration for backend
- **`docker-compose.yml`** - Multi-service orchestration

### Key Components in app.py

#### Classes
- **`AmazonScraper`** - Web scraping functionality
- **`SmartphoneData`** - Pydantic data model
- **`RefreshResponse`** - API response model

#### Functions
- **`initialize_sentiment_pipeline()`** - Load AI model
- **`clean_text()`** - Text preprocessing
- **`analyze_sentiment_batch()`** - Batch sentiment analysis
- **`calculate_composite_score()`** - Scoring algorithm
- **`process_smartphones_data()`** - Main data processing
- **`get_mock_smartphone_data()`** - Fallback demo data

#### API Endpoints
- **`GET /`** - API information
- **`GET /health`** - Health check
- **`GET /top-mobiles`** - Main data endpoint
- **`POST /refresh`** - Cache refresh
- **`GET /docs`** - Auto-generated API docs

## 🎨 Frontend Files

### Core Application
- **`src/app/page.tsx`** - Main page component
- **`src/app/layout.tsx`** - Root layout with metadata
- **`src/app/globals.css`** - Global styles and Tailwind imports

### Components
- **`src/components/SentimentDashboard.tsx`** - Main dashboard component
- **`src/components/ui/`** - shadcn/ui component library

### Configuration
- **`package.json`** - Dependencies and scripts
- **`next.config.js`** - Next.js configuration
- **`tailwind.config.js`** - Tailwind CSS customization
- **`components.json`** - shadcn/ui component configuration

### Key Features in SentimentDashboard.tsx

#### State Management
- **Data fetching** with error handling
- **Loading states** with skeleton components
- **Real-time refresh** functionality

#### UI Components
- **Header section** with title and refresh button
- **Stats overview** with key metrics
- **Tabbed interface** (Rankings, Analytics, Insights)
- **Interactive charts** using Recharts
- **Responsive cards** for smartphone data

#### Data Visualization
- **Bar charts** for sentiment comparison
- **Pie charts** for score distribution
- **Progress bars** for individual metrics
- **Color-coded badges** for sentiment levels

## 🔄 Data Flow

### 1. Backend Data Processing
```
Amazon Scraping → Review Collection → Sentiment Analysis → Composite Scoring → API Response
```

### 2. Frontend Data Consumption
```
API Fetch → State Update → Component Render → Chart Generation → User Interaction
```

### 3. Real-time Updates
```
User Refresh → Backend Cache Clear → Fresh Scraping → New Analysis → Updated UI
```

## 🛠️ Development Workflow

### Backend Development
1. **Environment Setup**: Run `./setup.sh`
2. **Development**: Edit `app.py`
3. **Testing**: Run `python test_api.py`
4. **Debugging**: Check logs in terminal

### Frontend Development
1. **Environment Setup**: Run `./setup-frontend.sh`
2. **Development**: Edit components in `src/`
3. **Testing**: View at `http://localhost:3000`
4. **Styling**: Modify Tailwind classes

### Full Stack Testing
1. **Start Backend**: `python app.py`
2. **Start Frontend**: `npm run dev`
3. **Test Integration**: Verify data flow
4. **Performance Check**: Monitor response times

## 📦 Dependencies

### Backend Dependencies (requirements.txt)
- **fastapi** - Web framework
- **uvicorn** - ASGI server
- **transformers** - AI/ML models
- **torch** - PyTorch for model inference
- **beautifulsoup4** - Web scraping
- **requests** - HTTP client
- **pydantic** - Data validation
- **cachetools** - In-memory caching

### Frontend Dependencies (package.json)
- **next** - React framework
- **react** - UI library
- **typescript** - Type safety
- **tailwindcss** - CSS framework
- **@radix-ui** - Primitive components
- **recharts** - Data visualization
- **lucide-react** - Icon library

## 🔧 Configuration Files

### Backend Configuration
- **CORS settings** in `app.py`
- **Cache configuration** (TTL, size)
- **Model settings** (DistilBERT)
- **Scraping parameters** (timeouts, limits)

### Frontend Configuration
- **API endpoints** in components
- **Styling themes** in Tailwind config
- **Component variants** in shadcn config
- **Build settings** in Next.js config

## 🚀 Deployment Structure

### Docker Deployment
- **Backend container** from Dockerfile
- **Frontend container** (separate build)
- **Multi-container** via docker-compose

### Cloud Deployment
- **Backend**: API service (Railway, Render)
- **Frontend**: Static hosting (Vercel, Netlify)
- **Database**: Optional (PostgreSQL, MongoDB)

## 📊 Performance Considerations

### Backend Optimization
- **Async processing** for concurrent requests
- **Smart caching** to reduce API calls
- **Error handling** with graceful fallbacks
- **Rate limiting** for responsible scraping

### Frontend Optimization
- **Code splitting** with Next.js
- **Image optimization** for assets
- **Lazy loading** for charts
- **Responsive design** for mobile

## 🔍 Monitoring & Debugging

### Backend Monitoring
- **Health endpoint** for status checks
- **Logging** throughout the application
- **Error tracking** with detailed messages
- **Performance metrics** in responses

### Frontend Monitoring
- **Console logging** for debugging
- **Error boundaries** for crash handling
- **Loading states** for user feedback
- **Network monitoring** for API calls

This structure provides a comprehensive foundation for a production-ready sentiment analysis application with modern development practices and scalable architecture.
