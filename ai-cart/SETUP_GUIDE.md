# 🚀 Cart ML Service - Complete Setup Guide

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Dataset: `ecommerce_ml_dataset.csv` (already in folder)

## 🔧 Step-by-Step Setup

### Step 1: Install Python Dependencies

Open terminal in the `ai-cart` folder and run:

**Windows:**
```cmd
pip install -r requirements.txt
```

**Linux/Mac:**
```bash
pip3 install -r requirements.txt
```

This will install:
- FastAPI (web framework)
- Uvicorn (ASGI server)
- Pandas & NumPy (data processing)
- Scikit-learn (Random Forest model)
- XGBoost (gradient boosting model)
- Joblib (model serialization)

### Step 2: Train the Models

**Windows:**
```cmd
cd scripts
python train_model.py
cd ..
```

**Linux/Mac:**
```bash
cd scripts
python3 train_model.py
cd ..
```

You should see output like:
```
📂 Loading dataset...
✅ Loaded 10000 records
🧹 Cleaning data...
✅ Cleaned data: 9850 records remaining
🧠 Engineering features...
✅ Created 19 features
...
🎯 PROMOTION ACCURACY: 0.8750
💰 PRICE ADJUSTMENT ACCURACY: 0.8250
✅ Models saved to: ../models
🎉 Training complete!
```

This creates the `models/` folder with:
- `rf_promo.pkl` - Promotion prediction model
- `xgb_price.pkl` - Price adjustment model
- `le_promo.pkl` - Promotion label encoder
- `le_price.pkl` - Price label encoder
- `le_category.pkl` - Category encoder

### Step 3: Start the API Server

**Option A: Using startup script (Recommended)**

**Windows:**
```cmd
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Option B: Manual start**

```bash
cd app
uvicorn main:app --reload --port 8002
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8002
INFO:     Application startup complete.
✅ Loaded trained models successfully
```

### Step 4: Test the API

Open your browser and go to:
- **API Docs**: http://localhost:8002/docs
- **Health Check**: http://localhost:8002/health
- **Home**: http://localhost:8002

## 🧪 Testing the Service

### Test 1: Health Check

```bash
curl http://localhost:8002/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Cart ML API",
  "model_type": "trained",
  "timestamp": "2026-05-02T..."
}
```

### Test 2: Single Prediction

```bash
curl -X POST "http://localhost:8002/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "test123",
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
  }'
```

Expected response:
```json
{
  "product_id": "test123",
  "promotion_suggestion": "NO_PROMO",
  "price_adjustment": "STABLE",
  "confidence_promo": 0.92,
  "confidence_price": 0.85,
  "recommended_price": 100.0,
  "expected_impact": "Maintain current strategy"
}
```

### Test 3: Interactive API Docs

1. Go to http://localhost:8002/docs
2. Click on "POST /predict"
3. Click "Try it out"
4. Modify the example JSON
5. Click "Execute"

## 🔗 Integration with Spring Boot Backend

### Step 1: Add Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
# Cart ML Service Configuration
app.cart-ml.base-url=http://localhost:8002
app.cart-ml.timeout-seconds=10
app.cart-ml.enabled=true
```

### Step 2: Create Java Service

Create `backend/src/main/java/esprit_market/service/cartService/CartMLService.java`:

```java
@Service
@Slf4j
public class CartMLService {
    
    private final WebClient webClient;
    
    @Value("${app.cart-ml.base-url}")
    private String baseUrl;
    
    @Value("${app.cart-ml.enabled}")
    private boolean enabled;
    
    public CartMLService(WebClient.Builder builder) {
        this.webClient = builder.build();
    }
    
    public CartMLPrediction getPrediction(CartItem item) {
        if (!enabled) {
            return getDefaultPrediction();
        }
        
        try {
            return webClient.post()
                .uri(baseUrl + "/predict")
                .bodyValue(toMLInput(item))
                .retrieve()
                .bodyToMono(CartMLPrediction.class)
                .block();
        } catch (Exception e) {
            log.error("ML prediction failed: {}", e.getMessage());
            return getDefaultPrediction();
        }
    }
    
    private CartMLInput toMLInput(CartItem item) {
        // Map CartItem to ML input format
        return CartMLInput.builder()
            .productId(item.getProductId().toHexString())
            .costPrice(item.getCostPrice())
            .unitPrice(item.getUnitPrice())
            // ... map other fields
            .build();
    }
    
    private CartMLPrediction getDefaultPrediction() {
        return CartMLPrediction.builder()
            .promotionSuggestion("NO_PROMO")
            .priceAdjustment("STABLE")
            .build();
    }
}
```

### Step 3: Use in Cart Controller

```java
@RestController
@RequestMapping("/api/cart")
public class CartController {
    
    private final CartMLService mlService;
    
    @PostMapping("/optimize")
    public ResponseEntity<CartOptimization> optimizeCart(@RequestBody Cart cart) {
        List<CartMLPrediction> predictions = cart.getItems().stream()
            .map(mlService::getPrediction)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(new CartOptimization(predictions));
    }
}
```

## 📊 Understanding the Predictions

### Promotion Suggestions

| Value | Meaning | When to Use |
|-------|---------|-------------|
| `NO_PROMO` | No discount needed | High demand, low abandonment |
| `DISCOUNT` | Apply discount | Low demand, high abandonment, or excess stock |

### Price Adjustments

| Value | Meaning | Recommended Action |
|-------|---------|-------------------|
| `STABLE` | Keep current price | Balanced demand and supply |
| `INCREASE` | Raise price | High demand, low stock |
| `DECREASE` | Lower price | Low demand, high stock |

### Confidence Scores

- **0.9 - 1.0**: Very confident
- **0.7 - 0.9**: Confident
- **0.5 - 0.7**: Moderate confidence
- **< 0.5**: Low confidence (use with caution)

## 🐛 Troubleshooting

### Problem: "Module not found" error

**Solution:**
```bash
pip install -r requirements.txt --upgrade
```

### Problem: "Models not found" error

**Solution:**
```bash
cd scripts
python train_model.py
```

### Problem: Port 8002 already in use

**Solution:** Change the port
```bash
uvicorn main:app --port 8003
```

### Problem: Training fails with memory error

**Solution:** Reduce dataset size or use a machine with more RAM

### Problem: Predictions are always the same

**Solution:** Check if models are loaded correctly. Look for "✅ Loaded trained models successfully" in logs.

## 📈 Performance Optimization

### For Production

1. **Use Gunicorn** instead of Uvicorn:
```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8002
```

2. **Enable caching** for repeated predictions

3. **Use batch predictions** for multiple products

4. **Monitor performance** with logging

## 🔄 Updating the Model

To retrain with new data:

1. Update `ecommerce_ml_dataset.csv` with new data
2. Run training script:
```bash
cd scripts
python train_model.py
```
3. Restart the API server

The new models will be loaded automatically.

## 📝 Next Steps

1. ✅ Install dependencies
2. ✅ Train models
3. ✅ Start API server
4. ✅ Test endpoints
5. ✅ Integrate with Spring Boot
6. 🔄 Monitor and improve

## 🆘 Need Help?

Check the logs:
- API logs: Terminal where uvicorn is running
- Training logs: Output of train_model.py

Common issues are usually:
- Missing dependencies
- Models not trained
- Wrong port configuration
- Network connectivity

## 🎉 Success Checklist

- [ ] Dependencies installed
- [ ] Models trained successfully
- [ ] API server running on port 8002
- [ ] Health check returns "healthy"
- [ ] Test prediction works
- [ ] Spring Boot can connect to API
- [ ] Predictions make business sense

You're all set! 🚀
