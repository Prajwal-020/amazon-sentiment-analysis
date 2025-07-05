#!/usr/bin/env python3
"""
Debug script to analyze Amazon's HTML structure and fix the scraper
"""

import requests
from bs4 import BeautifulSoup
import re
import json

def debug_amazon_structure():
    """Debug Amazon's HTML structure to understand the current layout"""
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    })
    
    url = "https://www.amazon.in/gp/bestsellers/electronics/1805560031"
    
    try:
        print(f"🔍 Fetching: {url}")
        response = session.get(url, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'lxml')
        
        # Save HTML for inspection
        with open('amazon_debug.html', 'w', encoding='utf-8') as f:
            f.write(soup.prettify())
        print("📄 Saved HTML to amazon_debug.html")
        
        # Try different selectors
        selectors_to_test = [
            'div[class*="zg-item"]',
            'div[id*="gridItemRoot"]',
            'div[data-asin]',
            '.zg-item-immersion',
            '.zg-item',
            'div[class*="bestseller"]',
            'div[class*="product"]',
            'div[class*="item"]',
            '[data-component-type="s-search-result"]',
            '.s-result-item',
            'div[class*="grid"]',
            'li[data-asin]',
            'div[class*="card"]'
        ]
        
        print("\n🔍 Testing selectors:")
        for selector in selectors_to_test:
            try:
                elements = soup.select(selector)
                print(f"  {selector}: {len(elements)} elements")
                
                if elements and len(elements) > 5:
                    # Analyze first few elements
                    for i, elem in enumerate(elements[:3]):
                        print(f"    Element {i+1}:")
                        
                        # Look for product names
                        name_selectors = [
                            'h3', 'h2', 'h1',
                            'span[class*="title"]',
                            'span[class*="name"]',
                            'a[class*="title"]',
                            '.a-link-normal',
                            'span[class*="text"]'
                        ]
                        
                        for name_sel in name_selectors:
                            name_elem = elem.select_one(name_sel)
                            if name_elem:
                                text = name_elem.get_text(strip=True)
                                if len(text) > 10 and any(keyword in text.lower() for keyword in ['phone', 'mobile', 'smartphone', 'iphone', 'samsung', 'oneplus']):
                                    print(f"      📱 Found phone: {text[:60]}...")
                                    
                                    # Look for link
                                    link_elem = elem.select_one('a[href*="/dp/"]')
                                    if link_elem:
                                        href = link_elem.get('href', '')
                                        print(f"      🔗 Link: {href[:60]}...")
                                    
                                    # Look for price
                                    price_selectors = ['span[class*="price"]', '.a-price', 'span[class*="symbol"]']
                                    for price_sel in price_selectors:
                                        price_elem = elem.select_one(price_sel)
                                        if price_elem:
                                            price = price_elem.get_text(strip=True)
                                            if '₹' in price or 'Rs' in price:
                                                print(f"      💰 Price: {price}")
                                                break
                                    break
            except Exception as e:
                print(f"  {selector}: Error - {e}")
        
        # Look for any links to product pages
        print("\n🔗 Looking for product links:")
        product_links = soup.find_all('a', href=re.compile(r'/dp/'))
        print(f"Found {len(product_links)} product links")
        
        phone_links = []
        for link in product_links[:20]:
            text = link.get_text(strip=True)
            if len(text) > 10:
                text_lower = text.lower()
                if any(keyword in text_lower for keyword in ['phone', 'mobile', 'smartphone', 'iphone', 'samsung', 'oneplus', 'xiaomi', 'oppo', 'vivo', 'realme']):
                    href = link.get('href', '')
                    if not href.startswith('http'):
                        href = f"https://www.amazon.in{href}"
                    phone_links.append({
                        'name': text,
                        'link': href
                    })
                    print(f"  📱 {text[:60]}...")
        
        print(f"\n📱 Found {len(phone_links)} potential smartphones")
        
        # Save findings
        with open('phone_links.json', 'w', encoding='utf-8') as f:
            json.dump(phone_links, f, indent=2, ensure_ascii=False)
        print("💾 Saved phone links to phone_links.json")
        
        return phone_links
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

if __name__ == "__main__":
    debug_amazon_structure()
