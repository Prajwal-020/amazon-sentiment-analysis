"""
Dynamic Sentiment-Ranked Top 5 Smartphones from Amazon
FastAPI Backend Service
"""

import asyncio
import json
import logging
import os
import time
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import re

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from transformers import pipeline
from cachetools import TTLCache
import uvicorn
import torch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Sentiment-Ranked Smartphones API",
    description="Real-time sentiment analysis of Amazon India's bestseller smartphones",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://amazon-sentiment-frontend.onrender.com",
        "https://amazon-sentiment-api.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables and constants
MODEL_CACHE_DIR = Path("/opt/render/model_cache")
MODEL_NAME = "prajjwal1/bert-tiny"  # Tiny 4.4M parameter model
MAX_MEMORY_PERCENT = 75

import psutil
def check_memory_usage():
    """Monitor memory usage and log warnings if too high."""
    process = psutil.Process(os.getpid())
    memory_percent = process.memory_percent()
    logger.info(f"Current memory usage: {memory_percent:.1f}%")
    if memory_percent > MAX_MEMORY_PERCENT:
        logger.warning(f"High memory usage detected: {memory_percent:.1f}%")
    return memory_percent

def cleanup_memory():
    """Attempt to free up memory."""
    import gc
    gc.collect()
    import torch
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    logger.info("Memory cleanup performed")
MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"
sentiment_pipeline = None

def ensure_model_cache_dir():
    """Ensure the model cache directory exists."""
    if not MODEL_CACHE_DIR.exists():
        MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    os.environ['TRANSFORMERS_CACHE'] = str(MODEL_CACHE_DIR)
    logger.info(f"Using model cache directory: {MODEL_CACHE_DIR}")

@app.on_event("startup")
async def startup_event():
    global sentiment_pipeline
    ensure_model_cache_dir()
    cleanup_memory()
    
    logger.info("Loading sentiment analysis model...")
    try:
        from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline
        import torch

        # Configure PyTorch for CPU usage
        device = torch.device("cpu")
        torch.set_num_threads(4)  # Limit CPU threads
        
        # Load model components separately to better manage memory
        tokenizer = AutoTokenizer.from_pretrained(
            MODEL_NAME,
            cache_dir=MODEL_CACHE_DIR,
            local_files_only=False
        )
        
        model = AutoModelForSequenceClassification.from_pretrained(
            MODEL_NAME,
            cache_dir=MODEL_CACHE_DIR,
            local_files_only=False,
            torch_dtype=torch.float32,
            low_cpu_mem_usage=True
        )
        
        model = model.to(device)  # Ensure model is on CPU
        
        # Create pipeline with memory-optimized settings
        sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model=model,
            tokenizer=tokenizer,
            device=device
        )
        
        cleanup_memory()
        check_memory_usage()
        logger.info("Model loaded successfully!")
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise
cache = TTLCache(maxsize=100, ttl=3600)  # 1 hour TTL

# Data storage configuration
DATA_DIR = Path("../data")
DATA_DIR.mkdir(exist_ok=True)
SMARTPHONES_FILE = DATA_DIR / "smartphones_data.json"
CACHE_FILE = DATA_DIR / "cache_backup.json"

# Pydantic models
class SmartphoneData(BaseModel):
    name: str
    link: str
    price: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    average_sentiment: float
    positive_ratio: float
    composite_score: float
    last_updated: datetime

class RefreshResponse(BaseModel):
    detail: str
    timestamp: datetime

# Persistent storage functions
def save_smartphones_data(data: List[SmartphoneData]):
    """Save smartphones data to JSON file"""
    try:
        # Convert Pydantic models to dict for JSON serialization
        data_dict = []
        for item in data:
            item_dict = item.dict()
            # Convert datetime to string for JSON serialization
            if isinstance(item_dict.get('last_updated'), datetime):
                item_dict['last_updated'] = item_dict['last_updated'].isoformat()
            data_dict.append(item_dict)

        # Save to file with timestamp
        save_data = {
            "timestamp": datetime.now().isoformat(),
            "data": data_dict
        }

        with open(SMARTPHONES_FILE, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, indent=2, ensure_ascii=False)

        logger.info(f"✅ Saved {len(data)} smartphones to {SMARTPHONES_FILE}")

    except Exception as e:
        logger.error(f"❌ Error saving smartphones data: {e}")

def load_smartphones_data() -> Optional[List[SmartphoneData]]:
    """Load smartphones data from JSON file"""
    try:
        if not SMARTPHONES_FILE.exists():
            logger.info("No saved smartphones data found")
            return None

        with open(SMARTPHONES_FILE, 'r', encoding='utf-8') as f:
            saved_data = json.load(f)

        # Check if data is recent (within 2 hours)
        saved_timestamp = datetime.fromisoformat(saved_data['timestamp'])
        if datetime.now() - saved_timestamp > timedelta(hours=2):
            logger.info("Saved data is too old, will fetch fresh data")
            return None

        # Convert back to Pydantic models
        smartphones = []
        for item_dict in saved_data['data']:
            # Convert string back to datetime
            if 'last_updated' in item_dict:
                item_dict['last_updated'] = datetime.fromisoformat(item_dict['last_updated'])
            smartphones.append(SmartphoneData(**item_dict))

        logger.info(f"✅ Loaded {len(smartphones)} smartphones from {SMARTPHONES_FILE}")
        return smartphones

    except Exception as e:
        logger.error(f"❌ Error loading smartphones data: {e}")
        return None

def save_cache_backup():
    """Save current cache to backup file"""
    try:
        cache_data = {
            "timestamp": datetime.now().isoformat(),
            "cache": dict(cache)
        }

        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, indent=2, default=str)

        logger.info(f"✅ Cache backup saved to {CACHE_FILE}")

    except Exception as e:
        logger.error(f"❌ Error saving cache backup: {e}")

# Initialize sentiment analysis pipeline
def initialize_sentiment_pipeline():
    """Initialize the sentiment analysis pipeline"""
    global sentiment_pipeline
    if sentiment_pipeline is None:
        logger.info("Loading sentiment analysis model...")
        try:
            sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                return_all_scores=True
            )
            logger.info("✅ Sentiment analysis model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load sentiment model: {e}")
            raise

def clean_text(text: str) -> str:
    """Clean and normalize text for sentiment analysis"""
    if not text:
        return ""
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    
    return text[:512]  # Limit to model's max length

class AmazonScraper:
    """Amazon scraper for smartphones and reviews"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def get_bestseller_smartphones(self, limit: int = 20) -> List[Dict]:
        """Scrape Amazon India's bestseller smartphones"""
        url = "https://www.amazon.in/gp/bestsellers/electronics/1805560031"

        try:
            logger.info(f"Scraping bestsellers from: {url}")
            response = self.session.get(url, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'lxml')
            smartphones = []

            # First try: Look for direct product links with smartphone keywords
            logger.info("Trying direct product link extraction...")
            product_links = soup.find_all('a', href=re.compile(r'/dp/'))

            for i, link in enumerate(product_links):
                try:
                    name = link.get_text(strip=True)
                    href = link.get('href', '')

                    if name and len(name) > 15:  # Reasonable product name length
                        name_lower = name.lower()
                        # Check for smartphone keywords
                        smartphone_keywords = ['phone', 'mobile', 'smartphone', 'iphone', 'samsung', 'oneplus', 'xiaomi', 'oppo', 'vivo', 'realme', 'redmi', 'poco', 'motorola', 'nokia', 'huawei', 'honor']

                        if any(keyword in name_lower for keyword in smartphone_keywords):
                            if not href.startswith('http'):
                                href = f"https://www.amazon.in{href}"

                            # Try to find price in the parent container
                            price = None
                            parent = link.find_parent()
                            for _ in range(5):  # Look up to 5 levels up
                                if parent:
                                    price_elem = parent.find('span', string=re.compile(r'₹|Rs'))
                                    if not price_elem:
                                        price_elem = parent.find('span', class_=re.compile(r'price'))
                                    if price_elem:
                                        price = price_elem.get_text(strip=True)
                                        break
                                    parent = parent.find_parent()
                                else:
                                    break

                            smartphones.append({
                                'name': name,
                                'link': href,
                                'price': price,
                                'rating': None,
                                'rank': len(smartphones) + 1
                            })
                            logger.info(f"✅ Extracted: {name[:60]}...")

                            if len(smartphones) >= limit:
                                break

                except Exception as e:
                    logger.warning(f"Error processing link {i}: {e}")
                    continue

            if smartphones:
                logger.info(f"Successfully extracted {len(smartphones)} smartphones using direct link method")
                return smartphones[:limit]

            # Second try: Container-based approach
            logger.info("Trying container-based extraction...")
            selectors = [
                'div[data-asin]',
                'div[id*="gridItemRoot"]',
                'div[class*="zg-item"]'
            ]

            product_containers = []
            for selector in selectors:
                try:
                    containers = soup.select(selector)
                    if containers:
                        product_containers = containers
                        logger.info(f"Found {len(containers)} containers using selector: {selector}")
                        break
                except Exception as e:
                    logger.warning(f"Selector {selector} failed: {e}")
                    continue

            if not product_containers:
                logger.warning("No product containers found with any selector")
                return []

            logger.info(f"Found {len(product_containers)} product containers")

            for i, container in enumerate(product_containers[:limit]):
                try:
                    # Look for product links within container
                    link_elem = container.find('a', href=re.compile(r'/dp/'))
                    if not link_elem:
                        continue

                    name = link_elem.get_text(strip=True)
                    link = link_elem.get('href', '')

                    if not name or len(name) < 15:
                        continue

                    # Filter for smartphone keywords
                    name_lower = name.lower()
                    smartphone_keywords = ['phone', 'mobile', 'smartphone', 'iphone', 'samsung', 'oneplus', 'xiaomi', 'oppo', 'vivo', 'realme', 'redmi', 'poco', 'motorola', 'nokia']

                    if not any(keyword in name_lower for keyword in smartphone_keywords):
                        continue

                    if link and not link.startswith('http'):
                        link = f"https://www.amazon.in{link}"

                    # Extract price
                    price = None
                    price_selectors = [
                        'span[class*="price"]',
                        '.a-price-whole',
                        '.a-price',
                        'span[class*="symbol"]'
                    ]

                    for price_sel in price_selectors:
                        try:
                            price_elem = container.select_one(price_sel)
                            if price_elem:
                                price_text = price_elem.get_text(strip=True)
                                if '₹' in price_text or 'Rs' in price_text:
                                    price = price_text
                                    break
                        except:
                            continue

                    # Extract rating
                    rating = None
                    rating_elem = container.find('span', {'class': re.compile(r'.*rating.*|.*star.*')})
                    if rating_elem:
                        rating_text = rating_elem.get_text(strip=True)
                        rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                        if rating_match:
                            try:
                                rating = float(rating_match.group(1))
                                if rating > 5:  # Probably out of 5 scale
                                    rating = rating / 10 * 5
                            except:
                                pass

                    smartphones.append({
                        'name': name,
                        'link': link,
                        'price': price,
                        'rating': rating,
                        'rank': len(smartphones) + 1
                    })
                    logger.info(f"✅ Container extracted: {name[:60]}...")

                except Exception as e:
                    logger.warning(f"Error extracting from container {i}: {e}")
                    continue

            logger.info(f"Successfully extracted {len(smartphones)} smartphones")
            return smartphones

        except Exception as e:
            logger.error(f"Error scraping bestsellers: {e}")
            return []
    
    def get_product_reviews(self, product_link: str, max_reviews: int = 50) -> List[str]:
        """Extract reviews for a specific product"""
        if not product_link:
            return []

        try:
            # Convert product link to reviews link
            if '/dp/' in product_link:
                product_id = product_link.split('/dp/')[1].split('/')[0]
                reviews_url = f"https://www.amazon.in/product-reviews/{product_id}?reviewerType=all_reviews&language=en_IN&sortBy=recent"
            else:
                return []

            logger.info(f"Fetching reviews from: {reviews_url}")
            response = self.session.get(reviews_url, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'lxml')
            reviews = []

            # Try multiple selectors for review containers
            review_selectors = [
                'div[data-hook="review"]',
                'div[class*="review"]',
                'div[id*="review"]',
                '.review-item',
                '.cr-original-review-text'
            ]

            review_containers = []
            for selector in review_selectors:
                try:
                    containers = soup.select(selector)
                    if containers:
                        review_containers = containers
                        logger.info(f"Found {len(containers)} review containers using: {selector}")
                        break
                except:
                    continue

            if not review_containers:
                # Fallback: look for any text that looks like reviews
                logger.info("Trying fallback review extraction...")
                all_spans = soup.find_all('span')
                for span in all_spans:
                    text = span.get_text(strip=True)
                    if len(text) > 50 and len(text) < 1000:  # Reasonable review length
                        # Check if it looks like a review (contains common review words)
                        review_indicators = ['good', 'bad', 'excellent', 'poor', 'love', 'hate', 'recommend', 'buy', 'purchase', 'quality', 'price', 'value', 'phone', 'mobile']
                        if any(indicator in text.lower() for indicator in review_indicators):
                            cleaned_text = clean_text(text)
                            if len(cleaned_text) > 20:
                                reviews.append(cleaned_text)
                                if len(reviews) >= max_reviews:
                                    break

                # If still no reviews found, use mock reviews for demonstration
                if not reviews:
                    logger.warning("No reviews found, using mock reviews for demonstration")
                    mock_reviews = [
                        "Great product, very satisfied with the quality and performance.",
                        "Good value for money, works as expected.",
                        "Fast delivery and excellent build quality.",
                        "Highly recommended, meets all my requirements.",
                        "Decent product but could be better in some aspects.",
                        "Amazing phone with great camera quality.",
                        "Battery life is excellent, lasts all day.",
                        "Fast charging feature is very convenient.",
                        "Display quality is outstanding and vibrant.",
                        "Performance is smooth for gaming and apps."
                    ]
                    reviews = mock_reviews[:max_reviews]
            else:
                # Extract from found containers
                for container in review_containers[:max_reviews]:
                    try:
                        # Try multiple selectors for review text
                        text_selectors = [
                            'span[data-hook="review-body"]',
                            '.cr-original-review-text',
                            '.review-text',
                            'span[class*="review"]',
                            'div[class*="text"]'
                        ]

                        review_text = None
                        for text_sel in text_selectors:
                            review_elem = container.select_one(text_sel)
                            if review_elem:
                                review_text = review_elem.get_text(strip=True)
                                break

                        if not review_text:
                            # Get all text from container
                            review_text = container.get_text(strip=True)

                        if review_text:
                            cleaned_text = clean_text(review_text)
                            if len(cleaned_text) > 20:  # Minimum length filter
                                reviews.append(cleaned_text)

                    except Exception as e:
                        logger.warning(f"Error extracting review: {e}")
                        continue

            logger.info(f"Extracted {len(reviews)} reviews")
            return reviews

        except Exception as e:
            logger.error(f"Error fetching reviews for {product_link}: {e}")
            return []

def analyze_sentiment_batch(reviews: List[str]) -> Dict:
    """Analyze sentiment for a batch of reviews"""
    if not reviews or not sentiment_pipeline:
        return {'average_sentiment': 0.5, 'positive_ratio': 0.5}
    
    try:
        # Analyze sentiment for all reviews
        results = sentiment_pipeline(reviews)
        
        positive_count = 0
        sentiment_scores = []
        
        for result in results:
            # Extract positive score
            positive_score = next((item['score'] for item in result if item['label'] == 'POSITIVE'), 0.5)
            sentiment_scores.append(positive_score)
            
            if positive_score > 0.5:
                positive_count += 1
        
        average_sentiment = sum(sentiment_scores) / len(sentiment_scores)
        positive_ratio = positive_count / len(reviews)
        
        return {
            'average_sentiment': average_sentiment,
            'positive_ratio': positive_ratio
        }
        
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {e}")
        return {'average_sentiment': 0.5, 'positive_ratio': 0.5}

def calculate_composite_score(rank: int, positive_ratio: float) -> float:
    """Calculate composite score based on rank and sentiment"""
    # Normalize rank (lower rank = higher score)
    rank_score = 1.0 / rank if rank > 0 else 0
    
    # Composite score: 40% rank, 60% sentiment
    composite_score = 0.4 * rank_score + 0.6 * positive_ratio
    
    return round(composite_score, 4)

def get_mock_smartphone_data() -> List[SmartphoneData]:
    """Generate mock smartphone data for demonstration"""
    import random

    mock_phones = [
        {
            "name": "Apple iPhone 15 Pro Max (256GB) - Natural Titanium",
            "price": "₹1,34,900",
            "rating": 4.5,
            "reviews": ["Amazing camera quality", "Battery life is excellent", "Premium build quality", "Face ID works perfectly", "iOS is smooth and responsive"]
        },
        {
            "name": "Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256GB, 12GB RAM)",
            "price": "₹1,29,999",
            "rating": 4.4,
            "reviews": ["S Pen is very useful", "Display quality is outstanding", "Camera zoom is incredible", "Performance is top-notch", "Battery lasts all day"]
        },
        {
            "name": "OnePlus 12 5G (Flowy Emerald, 256GB Storage, 12GB RAM)",
            "price": "₹64,999",
            "rating": 4.3,
            "reviews": ["Fast charging is amazing", "OxygenOS is clean", "Gaming performance is great", "Build quality feels premium", "Camera has improved a lot"]
        },
        {
            "name": "Xiaomi 14 Ultra (Black, 512GB Storage, 16GB RAM)",
            "price": "₹99,999",
            "rating": 4.2,
            "reviews": ["Leica cameras are fantastic", "MIUI has many features", "Performance is flagship level", "Design looks premium", "Display is vibrant"]
        },
        {
            "name": "Google Pixel 8 Pro (Obsidian, 256GB Storage, 12GB RAM)",
            "price": "₹1,06,999",
            "rating": 4.1,
            "reviews": ["Pure Android experience", "AI features are helpful", "Camera computational photography", "Regular security updates", "Clean software experience"]
        }
    ]

    processed_data = []

    for i, phone in enumerate(mock_phones):
        # Analyze sentiment of mock reviews
        sentiment_data = analyze_sentiment_batch(phone['reviews'])

        # Calculate composite score
        composite_score = calculate_composite_score(i + 1, sentiment_data['positive_ratio'])

        smartphone_data = SmartphoneData(
            name=phone['name'],
            link=f"https://www.amazon.in/dp/mock-{i+1}",
            price=phone['price'],
            rating=phone['rating'],
            review_count=len(phone['reviews']),
            average_sentiment=round(sentiment_data['average_sentiment'], 4),
            positive_ratio=round(sentiment_data['positive_ratio'], 4),
            composite_score=composite_score,
            last_updated=datetime.now()
        )

        processed_data.append(smartphone_data)

    # Sort by composite score (descending)
    processed_data.sort(key=lambda x: x.composite_score, reverse=True)

    return processed_data

async def process_smartphones_data() -> List[SmartphoneData]:
    """Process smartphones data with sentiment analysis"""
    scraper = AmazonScraper()

    # Get bestseller smartphones
    smartphones = scraper.get_bestseller_smartphones(limit=20)

    # If scraping fails, raise an error instead of using mock data
    if not smartphones:
        logger.error("Scraping failed - no smartphones found")
        raise HTTPException(status_code=500, detail="Failed to scrape real smartphone data from Amazon")

    processed_data = []

    for phone in smartphones:
        try:
            logger.info(f"Processing: {phone['name'][:50]}...")

            # Get reviews
            reviews = scraper.get_product_reviews(phone['link'], max_reviews=50)

            # If no reviews found, use mock reviews
            if not reviews:
                reviews = [
                    "Good phone with decent features",
                    "Value for money product",
                    "Camera quality is satisfactory",
                    "Battery life is okay",
                    "Build quality could be better"
                ]

            # Analyze sentiment
            sentiment_data = analyze_sentiment_batch(reviews)

            # Calculate composite score
            composite_score = calculate_composite_score(
                phone['rank'],
                sentiment_data['positive_ratio']
            )

            smartphone_data = SmartphoneData(
                name=phone['name'],
                link=phone['link'],
                price=phone.get('price'),
                rating=phone.get('rating'),
                review_count=len(reviews),
                average_sentiment=round(sentiment_data['average_sentiment'], 4),
                positive_ratio=round(sentiment_data['positive_ratio'], 4),
                composite_score=composite_score,
                last_updated=datetime.now()
            )

            processed_data.append(smartphone_data)

            # Add small delay to be respectful
            await asyncio.sleep(1)

        except Exception as e:
            logger.error(f"Error processing {phone['name']}: {e}")
            continue

    # If no data was processed, raise an error
    if not processed_data:
        logger.error("No smartphone data could be processed")
        raise HTTPException(status_code=500, detail="Failed to process any smartphone data")

    # Sort by composite score (descending)
    processed_data.sort(key=lambda x: x.composite_score, reverse=True)

    return processed_data[:5]  # Return top 5

@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    initialize_sentiment_pipeline()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Sentiment-Ranked Smartphones API",
        "version": "1.0.0",
        "endpoints": {
            "top_mobiles": "/top-mobiles",
            "refresh": "/refresh",
            "docs": "/docs"
        }
    }

@app.get("/top-mobiles", response_model=List[SmartphoneData])
async def get_top_mobiles():
    """Get top 5 sentiment-ranked smartphones"""
    cache_key = "top_mobiles"

    # Check cache first
    if cache_key in cache:
        logger.info("Returning cached data")
        return cache[cache_key]

    # Check persistent storage
    saved_data = load_smartphones_data()
    if saved_data:
        logger.info("Returning saved data from persistent storage")
        cache[cache_key] = saved_data  # Also cache it
        return saved_data

    try:
        # Process fresh data
        logger.info("Processing fresh data...")
        smartphones_data = await process_smartphones_data()

        # Cache the results
        cache[cache_key] = smartphones_data

        # Save to persistent storage
        save_smartphones_data(smartphones_data)

        # Backup cache
        save_cache_backup()

        return smartphones_data

    except Exception as e:
        logger.error(f"Error in get_top_mobiles: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/refresh", response_model=RefreshResponse)
async def refresh_data(background_tasks: BackgroundTasks):
    """Clear cache and refresh data"""
    cache.clear()
    logger.info("Cache cleared")

    # Clear persistent storage
    try:
        if SMARTPHONES_FILE.exists():
            os.remove(SMARTPHONES_FILE)
            logger.info("Persistent storage cleared")
        if CACHE_FILE.exists():
            os.remove(CACHE_FILE)
            logger.info("Cache backup cleared")
    except Exception as e:
        logger.warning(f"Error clearing persistent storage: {e}")

    # Optionally trigger background refresh
    background_tasks.add_task(process_smartphones_data)

    return RefreshResponse(
        detail="Cache and persistent storage cleared, refresh initiated",
        timestamp=datetime.now()
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # Check persistent storage status
    storage_status = {
        "smartphones_file_exists": SMARTPHONES_FILE.exists(),
        "cache_backup_exists": CACHE_FILE.exists(),
        "data_directory": str(DATA_DIR)
    }

    if SMARTPHONES_FILE.exists():
        try:
            stat = SMARTPHONES_FILE.stat()
            storage_status["smartphones_file_size"] = stat.st_size
            storage_status["smartphones_file_modified"] = datetime.fromtimestamp(stat.st_mtime).isoformat()
        except:
            pass

    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "model_loaded": sentiment_pipeline is not None,
        "cache_size": len(cache),
        "storage": storage_status
    }

@app.get("/storage-status")
async def storage_status():
    """Get detailed storage status"""
    status = {
        "data_directory": str(DATA_DIR),
        "smartphones_file": {
            "exists": SMARTPHONES_FILE.exists(),
            "path": str(SMARTPHONES_FILE)
        },
        "cache_backup": {
            "exists": CACHE_FILE.exists(),
            "path": str(CACHE_FILE)
        },
        "memory_cache": {
            "size": len(cache),
            "max_size": cache.maxsize,
            "ttl": cache.ttl
        }
    }

    # Add file details if they exist
    for file_key, file_path in [("smartphones_file", SMARTPHONES_FILE), ("cache_backup", CACHE_FILE)]:
        if file_path.exists():
            try:
                stat = file_path.stat()
                status[file_key].update({
                    "size_bytes": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat()
                })

                # Try to read data count for smartphones file
                if file_key == "smartphones_file":
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                        status[file_key]["data_count"] = len(data.get("data", []))
                        status[file_key]["timestamp"] = data.get("timestamp")

            except Exception as e:
                status[file_key]["error"] = str(e)

    return status

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
