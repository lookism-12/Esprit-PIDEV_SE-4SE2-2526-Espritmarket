# 🛒 EspritMarket Cart ML Service

AI-powered cart optimization service that provides:
- **Promotion Suggestions**: When to apply discounts
- **Price Adjustments**: Dynamic pricing recommendations

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ai-cart
pip install -r requirements.txt
```

### 2. Train the Model (First Time Only)

```bash
cd scripts
python train_model.py
```

This will:
- Load the dataset from `ecommerce_ml_dataset.csv`
- Train Random Forest (promotions) and XGBoost (pricing) models
- Save trained models to `models/` directory

### 3. Start the API Server

```bash
cd app
uvicorn main:app --reload --port 8002
```

The API will be available at: `http://localhost:8002`

## 📡 API Endpoints

### 1. Single Product Prediction

**POST** `/predict`

```json
{
  "product_id": "prod123",
  "cost_price": 50.0,
  "unit_price": 100.0,
  "stock": 150,
  "sales_volume": 45.0,
  "return_rate": 0.05,
  "profit": 2250.0,
  "demand_score": 0.75,
  "price_competitiveness_score": 0.8,
  "cart_abandonment_rate": 0.25,
  "loyalty_score": 0.6,
  "shop_performance_index": 0.85,
  "category": "Electronics"
}
```

**Response:**
```json
{
  "product_id": "prod123",
  "promotion_suggestion": "NO_PROMO",
  "price_adjustment": "STABLE",
  "confidence_promo": 0.92,
  "confidence_price": 0.85,
  "recommended_price": 100.0,
  "expected_impact": "Maintain current strategy"
}
```

### 2. Batch Prediction

**POST** `/predict/batch`

```json
{
  "products": [
    { /* product 1 */ },
    { /* product 2 */ }
  ]
}
```

### 3. Health Check

**GET** `/health`

Returns service status and model information.

### 4. API Documentation

**GET** `/docs`

Interactive Swagger UI documentation.

## 🧠 How It Works

### Input Features

The model uses 19 features:

**Base Features:**
- `cost_price`: Product cost
- `unit_price`: Selling price
- `stock`: Available inventory
- `sales_volume`: Units sold
- `return_rate`: Return percentage
- `profit`: Total profit
- `demand_score`: Demand indicator (0-1)
- `price_competitiveness_score`: Price competitiveness (0-1)
- `cart_abandonment_rate`: Cart abandonment (0-1)
- `loyalty_score`: Customer loyalty (0-1)
- `shop_performance_index`: Shop performance (0-1)
- `category`: Product category

**Engineered Features** (calculated automatically):
- `margin_pct`: Profit margin percentage
- `revenue`: Total revenue
- `stock_to_sales_ratio`: Stock vs sales ratio
- `profit_per_unit`: Profit per unit sold
- `price_x_demand`: Price × demand interaction
- `abandon_x_loyalty`: Abandonment × loyalty interaction
- `perf_x_demand`: Performance × demand interaction
- `category_enc`: Encoded category

### Output Predictions

**Promotion Suggestion:**
- `NO_PROMO`: No promotion needed
- `DISCOUNT`: Apply discount

**Price Adjustment:**
- `STABLE`: Keep current price
- `INCREASE`: Increase price (high demand)
- `DECREASE`: Decrease price (low demand)

## 🔧 Configuration

### Model Types

The service supports two modes:

1. **Trained Models** (Recommended)
   - Uses Random Forest for promotions
   - Uses XGBoost for price adjustments
   - Requires training first

2. **Rule-Based Fallback**
   - Uses business logic rules
   - Works without training
   - Lower accuracy but always available

### Environment Variables

```bash
# API Configuration
API_PORT=8002
API_HOST=0.0.0.0

# Model Configuration
MODEL_DIR=models
USE_TRAINED_MODEL=true
```

## 📊 Model Performance

After training, you should see:
- **Promotion Accuracy**: ~85-90%
- **Price Adjustment Accuracy**: ~80-85%

## 🔗 Integration with Spring Boot

### Backend Configuration

Add to `application.properties`:

```properties
# Cart ML Service
app.cart-ml.base-url=http://localhost:8002
app.cart-ml.timeout-seconds=10
app.cart-ml.enabled=true
```

### Java Service Example

```java
@Service
public class CartMLService {
    private final WebClient webClient;
    
    public CartMLService(WebClient.Builder builder) {
        this.webClient = builder
            .baseUrl("http://localhost:8002")
            .build();
    }
    
    public Mono<PredictionResponse> getPrediction(ProductInput product) {
        return webClient.post()
            .uri("/predict")
            .bodyValue(product)
            .retrieve()
            .bodyToMono(PredictionResponse.class);
    }
}
```

## 🧪 Testing

### Test with cURL

```bash
curl -X POST "http://localhost:8002/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "test123",
    "cost_price": 50,
    "unit_price": 100,
    "stock": 150,
    "sales_volume": 45,
    "return_rate": 0.05,
    "profit": 2250,
    "demand_score": 0.75,
    "price_competitiveness_score": 0.8,
    "cart_abandonment_rate": 0.25,
    "loyalty_score": 0.6,
    "shop_performance_index": 0.85,
    "category": "Electronics"
  }'
```

### Test with Python

```python
import requests

response = requests.post(
    "http://localhost:8002/predict",
    json={
        "product_id": "test123",
        "cost_price": 50.0,
        "unit_price": 100.0,
        # ... other fields
    }
)

print(response.json())
```

## 📁 Project Structure

```
ai-cart/
├── app/
│   └── main.py              # FastAPI application
├── scripts/
│   └── train_model.py       # Model training script
├── models/                  # Trained models (generated)
│   ├── rf_promo.pkl
│   ├── xgb_price.pkl
│   ├── le_promo.pkl
│   ├── le_price.pkl
│   └── le_category.pkl
├── ecommerce_ml_dataset.csv # Training dataset
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🐛 Troubleshooting

### Models not loading

If you see "Using rule-based fallback":
1. Run `python scripts/train_model.py` first
2. Check that `models/` directory exists
3. Verify all `.pkl` files are present

### Port already in use

Change the port:
```bash
uvicorn main:app --port 8003
```

### Import errors

Reinstall dependencies:
```bash
pip install -r requirements.txt --upgrade
```

## 📈 Future Improvements

- [ ] Add A/B testing support
- [ ] Real-time model retraining
- [ ] More sophisticated pricing strategies
- [ ] Integration with inventory management
- [ ] Performance monitoring dashboard

## 📝 License

Part of EspritMarket project.
