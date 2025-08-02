# Project Structure

This document outlines the organized structure of the Sentiment Analysis project.

## Directory Structure

```
sentiment_analysis/
├── README.md                    # Main project documentation
├── promptDoc.md                 # AI prompt documentation
├── .gitignore                   # Root-level gitignore (Python/backend)
├── Dockerfile                   # Docker configuration
├── docker-compose.yml           # Docker Compose configuration
├── venv/                        # Python virtual environment
│
├── backend/                     # Backend API (FastAPI + Python)
│   ├── app.py                   # Main FastAPI application
│   └── requirements.txt         # Python dependencies
│
├── frontend/                    # Frontend application (Next.js + TypeScript)
│   ├── .gitignore              # Frontend-specific gitignore
│   ├── package.json            # Node.js dependencies
│   ├── package-lock.json       # Locked dependency versions
│   ├── next.config.ts          # Next.js configuration
│   ├── tsconfig.json           # TypeScript configuration
│   ├── tailwind.config.ts      # Tailwind CSS configuration
│   ├── components.json         # shadcn/ui configuration
│   ├── src/                    # Source code
│   │   ├── app/                # Next.js app directory
│   │   ├── components/         # React components
│   │   └── lib/                # Utility libraries
│   ├── public/                 # Static assets
│   └── node_modules/           # Node.js dependencies (ignored)
│
├── scripts/                     # Automation scripts
│   ├── setup.sh               # Backend setup script
│   ├── setup-frontend.sh      # Frontend setup script
│   ├── run-full-stack.sh      # Start both services
│   └── stop-services.sh       # Stop all services
│
├── tests/                       # Test files and utilities
│   ├── test_api.py             # API testing script
│   └── debug_scraper.py        # Amazon scraper debugging tool
│
├── docs/                        # Documentation
│   ├── DEPLOYMENT.md           # Deployment instructions
│   ├── RUNNING_THE_APP.md      # How to run the application
│   ├── PROJECT_SUMMARY.md      # Project overview
│   ├── QUICK_REFERENCE.md      # Quick reference guide
│   ├── REAL_DATA_SUCCESS.md    # Real data implementation notes
│   └── FRONTEND_ROUTES_FIX.md  # Frontend routing fixes
│
├── logs/                        # Application logs
│   ├── backend.log             # Backend service logs
│   └── frontend.log            # Frontend service logs
│
└── data/                        # Data files and debug outputs
    ├── phone_links.json        # Scraped phone data
    └── amazon_debug.html       # Debug HTML output
```

## Key Components

### Backend (`/backend/`)
- **FastAPI application** with sentiment analysis capabilities
- **Amazon scraping** for smartphone data
- **Sentiment analysis** using Hugging Face transformers
- **RESTful API** endpoints for data retrieval

### Frontend (`/frontend/`)
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Responsive design** for mobile and desktop

### Scripts (`/scripts/`)
- **Automated setup** for both backend and frontend
- **Service management** (start/stop)
- **Cross-platform compatibility** (macOS, Linux)

### Tests (`/tests/`)
- **API testing** with comprehensive endpoint coverage
- **Debug utilities** for troubleshooting scrapers
- **Performance monitoring** and validation

## Usage

### Quick Start
```bash
# Setup backend
./scripts/setup.sh

# Setup frontend (if needed)
./scripts/setup-frontend.sh

# Run full application
./scripts/run-full-stack.sh

# Stop all services
./scripts/stop-services.sh
```

### Manual Setup
```bash
# Backend
cd backend
python -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npm run dev
```

## Services

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Backend API | 8001 | http://localhost:8001 | FastAPI server |
| API Docs | 8001 | http://localhost:8001/docs | Swagger documentation |
| Frontend | 3000 | http://localhost:3000 | Next.js application |

## Environment Variables

### Backend
- `PORT`: API server port (default: 8001)
- `HOST`: API server host (default: 0.0.0.0)

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8001)

## Development Workflow

1. **Setup**: Run setup scripts for initial configuration
2. **Development**: Use individual service commands or full-stack script
3. **Testing**: Run test scripts to validate functionality
4. **Debugging**: Check logs in `/logs/` directory
5. **Deployment**: Follow deployment documentation

## File Naming Conventions

- **Scripts**: kebab-case with `.sh` extension
- **Documentation**: UPPERCASE with `.md` extension
- **Code files**: Follow language conventions (camelCase for JS/TS, snake_case for Python)
- **Directories**: lowercase with hyphens for multi-word names

## Git Workflow

- **Root `.gitignore`**: Handles Python, virtual environments, logs, OS files
- **Frontend `.gitignore`**: Handles Node.js, Next.js, build artifacts
- **Organized commits**: Use conventional commit messages
- **Branch naming**: feature/, bugfix/, hotfix/ prefixes

This structure provides clear separation of concerns, easy maintenance, and scalable development workflow.
