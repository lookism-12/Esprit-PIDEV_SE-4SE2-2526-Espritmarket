import requests
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

response = requests.post(url, json=data)
print(f"Status Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
