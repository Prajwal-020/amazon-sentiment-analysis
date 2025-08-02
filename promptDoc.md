# Project Report: Dynamic Sentiment‑Ranked Top 5 Smartphones from Amazon

## 1  Project Overview
Create a lightweight backend service that **scrapes Amazon India’s bestseller smartphones list in real time, collects recent user reviews, applies sentiment analysis, and produces a sentiment‑weighted ranking of the top five handsets**. The service exposes a simple REST API (`/top‑mobiles`) so any front‑end or analytics layer can consume the data.

## 2  Objectives
| # | Goal | Success Metric |
|---|------|---------------|
| 1 | Identify trending mobile phones from Amazon dynamically | < 5 min end‑to‑end refresh latency |
| 2 | Quantify user opinion via sentiment score | ≥ 85 % macro F1 on held‑out review set |
| 3 | Present the five best devices, ordered by a composite score | Endpoint returns JSON with stable schema |

## 3  Key Features
* **Web‑scrape Bestseller List** – Parse the top‑N product cards from Amazon’s “Mobiles” bestseller page.
* **Review Harvesting** – Fetch the first 1–2 pages of English‑language reviews per product.
* **Sentiment Inference** – Run the *distilbert‑base‑uncased‑finetuned‑sst‑2* model (or equivalent) locally with Hugging Face Transformers.
* **Composite Ranking** – Combine list rank (popularity) and positive‑review ratio into a single score.
* **REST API** – Expose `/top‑mobiles` (GET) plus `/refresh` (POST) to purge the cache.
* **In‑Memory Caching** – Memoise results to avoid hammering Amazon between refreshes.

## 4  Data Source & Ethics
| Aspect | Detail |
|--------|--------|
| URL | `https://www.amazon.in/gp/bestsellers/electronics/1805560031` |
| Review Endpoint | Derived by replacing `/dp/` with `/product‑reviews/` and adding `?reviewerType=all_reviews&language=en_IN` |
| Legal | **Scraping Amazon may violate their ToS**. In production, switch to the official Product Advertising API, respect robots.txt, and throttle requests. |

## 5  System Architecture
```
Client ───► /top‑mobiles (FastAPI)
               │
               ▼
       1  Scrape Bestseller Page
               │
       2  For each product:
               │  2a  Extract Reviews
               │  2b  Sentiment Pipeline
               ▼
       3  Aggregate → Composite Score
               ▼
       4  Cache (LRU, TTL)
               ▼
             JSON Response
```
* **Language**: Python 3.11
* **Framework**: FastAPI + Uvicorn ASGI server
* **Libraries**: `beautifulsoup4`, `lxml`, `requests`, `transformers`, `torch`

## 6  Algorithmic Details
1. **Best‑seller scraping**: collect up to **20** product rows, keep `(name, canonical_link)` pairs.
2. **Review sampling**: download up to **50** most‑recent English reviews per phone.
3. **Sentiment scoring**: label each review as POSITIVE / NEGATIVE; map scores to `[0,1]` scale.
4. **Composite score**:
   \[
   S = 0.4 \times \frac{1}{rank} + 0.6 \times \text{positive_ratio}
   \]
5. **Sort** by `S` desc; return top 5.

## 7  API Specification
| Method | URL | Purpose | Response Schema |
|--------|-----|---------|-----------------|
| GET | `/top‑mobiles` | Retrieve cached ranking | `[{name:str, link:str, average_sentiment:float, positive_ratio:float, composite_score:float}]` |
| POST | `/refresh` | Clear cache & force re‑scrape | `{detail:str}` |

## 8  Deployment Guide
1. **Local dev**: `pip install …`, `uvicorn app:app --reload` – hot reload.
2. **Docker** (optional):
   ```Dockerfile
   FROM python:3.11‑slim
   COPY app.py /app/
   RUN pip install fastapi uvicorn[standard] beautifulsoup4 lxml requests transformers torch
   CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "80"]
   ```
3. **Cloud**: Deploy container to AWS Fargate / Fly.io / Render; configure a cron or background task to hit `/refresh` hourly.

## 9  Performance & Scaling
* **Model loading**: first inference warms up ≈ 200 MB; keep the pipeline singleton in memory.
* **Concurrency**: Uvicorn with workers ≥ CPU cores; enable `async` scraping or batch requests for speed.
* **Rate limits**: Add exponential back‑off and rotate proxies if staying with scraping.

## 10  Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Amazon blocks scraper | Use official API or proxy rotation & polite crawl delay |
| Model bias or sarcasm blindness | Fine‑tune on domain reviews; cross‑check star ratings |
| Sudden bestseller list redesign | Feature‑test HTML selectors; version selector logic |

## 11  Future Enhancements
* **Multi‑marketplace support** (e.g., `.com`, `.co.uk`).
* **Historical trending dashboard** (store daily snapshots and plot shifts).
* **Aspect‑based sentiment** (battery, camera, performance).
* **User‑facing UI** in React / Streamlit with charts.

## 12  Estimated Timeline (1 Engineer)
| Week | Deliverable |
|------|-------------|
| 1 | Set up repo, project skeleton, best‑seller scraper |
| 2 | Review extraction + sentiment pipeline integration |
| 3 | Composite scoring, API routes, caching |
| 4 | Dockerisation, cloud deploy, load tests, docs |

---
**Hand this document to any AI code‑assistant or developer; it contains all the high‑level requirements and design choices needed to generate the full implementation.**
