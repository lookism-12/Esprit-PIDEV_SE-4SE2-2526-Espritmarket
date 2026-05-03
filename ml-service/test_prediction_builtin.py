import urllib.request
import json

url = "http://localhost:8000/predict"
data = {
    "base_price": 1200.0,
    "offered_price": 1100.0,
    "quantity": 1,
    "buyer_rating": 4.0,
    "buyer_account_age_months": 12,
    "is_return_customer": 0,
    "message_length": 10,
    "has_exchange_proposal": 0,
    "has_image_attachment": 0,
    "product_category": "Electronics"
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as f:
        response = f.read().decode('utf-8')
        print(json.dumps(json.loads(response), indent=2))
except Exception as e:
    print(f"Error: {e}")
