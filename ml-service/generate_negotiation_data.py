import pandas as pd
import numpy as np
import os
import random

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

def generate_negotiation_dataset(num_samples=5000):
    data = []
    categories = ["Electronics", "Clothing", "Home & Garden", "Sports", "Beauty", "Toys", "Books", "Automotive", "Food & Grocery", "Health"]
    
    for i in range(num_samples):
        base_price = round(random.uniform(10, 2000), 2)
        # Offered price usually between 40% and 110% of base price
        offered_price = round(base_price * random.uniform(0.4, 1.1), 2)
        quantity = random.randint(1, 5)
        buyer_rating = round(random.uniform(1.0, 5.0), 1)
        buyer_account_age_months = random.randint(1, 48)
        is_return_customer = 1 if random.random() < 0.2 else 0
        message_length = random.randint(0, 500)
        has_exchange_proposal = 1 if random.random() < 0.1 else 0
        has_image_attachment = 1 if random.random() < 0.15 else 0
        product_category = random.choice(categories)
        
        # LOGIC FOR DECISION
        price_ratio = offered_price / base_price
        
        # Base probability depends heavily on price ratio
        if price_ratio >= 1.0:
            prob = 0.98
        elif price_ratio >= 0.9:
            prob = 0.90
        elif price_ratio >= 0.8:
            prob = 0.75
        elif price_ratio >= 0.7:
            prob = 0.40
        elif price_ratio >= 0.6:
            prob = 0.15
        else:
            prob = 0.05
            
        # Adjust based on other factors
        if buyer_rating >= 4.5: prob += 0.1
        if buyer_rating < 2.5: prob -= 0.15
        if is_return_customer: prob += 0.15
        if message_length > 100: prob += 0.05
        if has_image_attachment: prob += 0.05
        
        # Clamp probability
        prob = max(0.01, min(0.99, prob))
        
        decision = "ACCEPT" if random.random() < prob else "REJECT"
        
        data.append({
            "offer_id": f"OFFER_{i:05d}",
            "base_price": base_price,
            "offered_price": offered_price,
            "quantity": quantity,
            "buyer_rating": buyer_rating,
            "buyer_account_age_months": buyer_account_age_months,
            "is_return_customer": is_return_customer,
            "message_length": message_length,
            "has_exchange_proposal": has_exchange_proposal,
            "has_image_attachment": has_image_attachment,
            "product_category": product_category,
            "provider_decision": decision
        })
        
    df = pd.DataFrame(data)
    
    # Ensure directory exists
    os.makedirs("../datasets", exist_ok=True)
    df.to_csv("../datasets/negotiation_dataset.csv", index=False)
    print(f"Generated {num_samples} samples and saved to ../datasets/negotiation_dataset.csv")

if __name__ == "__main__":
    generate_negotiation_dataset()
