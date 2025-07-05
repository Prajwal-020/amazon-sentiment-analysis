"""
Test script for the Sentiment Analysis API
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8001"

def test_health_endpoint():
    """Test the health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    print("\n🔍 Testing root endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
        return False

def test_top_mobiles_endpoint():
    """Test the top mobiles endpoint"""
    print("\n🔍 Testing top-mobiles endpoint...")
    print("⚠️  This may take 2-3 minutes as it scrapes and analyzes data...")
    
    start_time = time.time()
    try:
        response = requests.get(f"{BASE_URL}/top-mobiles", timeout=300)  # 5 min timeout
        end_time = time.time()
        
        print(f"Status: {response.status_code}")
        print(f"Response time: {end_time - start_time:.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Number of smartphones returned: {len(data)}")
            
            for i, phone in enumerate(data, 1):
                print(f"\n📱 #{i}: {phone['name'][:60]}...")
                print(f"   💰 Price: {phone.get('price', 'N/A')}")
                print(f"   ⭐ Rating: {phone.get('rating', 'N/A')}")
                print(f"   📝 Reviews analyzed: {phone['review_count']}")
                print(f"   😊 Positive ratio: {phone['positive_ratio']:.2%}")
                print(f"   📊 Composite score: {phone['composite_score']:.4f}")
                print(f"   🕒 Last updated: {phone['last_updated']}")
            
            return True
        else:
            print(f"❌ Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Top mobiles endpoint failed: {e}")
        return False

def test_refresh_endpoint():
    """Test the refresh endpoint"""
    print("\n🔍 Testing refresh endpoint...")
    try:
        response = requests.post(f"{BASE_URL}/refresh", timeout=30)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Refresh endpoint failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting API tests...")
    print(f"Testing API at: {BASE_URL}")
    print("=" * 60)
    
    tests = [
        ("Health Check", test_health_endpoint),
        ("Root Endpoint", test_root_endpoint),
        ("Refresh Endpoint", test_refresh_endpoint),
        ("Top Mobiles Endpoint", test_top_mobiles_endpoint),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"Running: {test_name}")
        print('='*60)
        
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ Test {test_name} crashed: {e}")
            results[test_name] = False
        
        time.sleep(1)  # Brief pause between tests
    
    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print('='*60)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASSED" if passed_test else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the logs above for details.")

if __name__ == "__main__":
    main()
