# ML Integration - Quick Reference Card

## 🚀 Test Right Now (No FastAPI Needed!)

```bash
# Get mock recommendations
curl -X GET "http://localhost:8090/api/recommendation/user123"

# Send feedback
curl -X POST "http://localhost:8090/api/recommendation/feedback" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user123","product_id":"prod-001","action":"purchase"}'

# Check health
curl -X GET "http://localhost:8090/api/recommendation/health"
```

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/recommendation/{userId}` | GET | Get recommendations |
| `/api/recommendation/feedback` | POST | Send feedback (JSON) |
| `/api/recommendation/feedback/simple` | POST | Send feedback (Query params) |
| `/api/recommendation/health` | GET | Check service health |

## 🎯 Supported Actions

- `view` - Product viewed
- `like` - Product liked
- `purchase` - Product purchased
- `add_to_cart` - Added to cart
- `remove_from_cart` - Removed from cart

## 🔧 Configuration

```properties
# In application.properties
app.ml-service.base-url=http://127.0.0.1:8001
app.ml-service.timeout-seconds=30
app.ml-service.max-retries=3
app.ml-service.enabled=true
app.ml-service.use-fallback=true
```

## 🔌 Integration (One-Liners)

```java
// In FavorisService
recommendationIntegration.trackProductLike(userId, productId);

// In ProductService
recommendationIntegration.trackProductView(userId, productId);

// In CartService
recommendationIntegration.trackAddToCart(userId, productId);
recommendationIntegration.trackRemoveFromCart(userId, productId);

// In OrderService
recommendationIntegration.trackMultiplePurchases(userId, productIds);
```

## 📝 Response Examples

### Recommendations Response
```json
{
  "user_id": "user123",
  "recommendations": [
    {
      "product_id": "prod-001",
      "name": "Premium Wireless Headphones",
      "category": "Electronics",
      "price": 89.99,
      "score": 0.95,
      "reason": "Based on your interest in audio equipment"
    }
  ],
  "total_count": 5,
  "algorithm_used": "mock-collaborative-filtering",
  "generated_at": "2026-04-27T01:30:00.000Z"
}
```

### Feedback Response
```json
{
  "status": "success",
  "message": "Mock feedback processed successfully",
  "user_id": "user123",
  "product_id": "prod-001",
  "action": "purchase",
  "processed_at": "2026-04-27T01:30:00.000Z"
}
```

### Health Response
```json
{
  "status": "UP",
  "service": "ML Recommendation Service",
  "message": "Service is available",
  "timestamp": "2026-04-27T01:30:00.000Z"
}
```

## 🎭 Mock Data Features

✅ Works without FastAPI
✅ Automatic fallback
✅ 5 sample products
✅ Realistic scores and reasons
✅ Perfect for testing

## 🚀 When FastAPI is Running

```bash
# Start FastAPI
python -m uvicorn main:app --host 127.0.0.1 --port 8001

# Same endpoints now use real ML models!
curl -X GET "http://localhost:8090/api/recommendation/user123"
```

## 📚 Files Created

```
backend/
├── src/main/java/esprit_market/
│   ├── dto/recommendation/
│   │   ├── RecommendationDTO.java
│   │   ├── ProductRecommendationDTO.java
│   │   ├── FeedbackRequestDTO.java
│   │   └── FeedbackResponseDTO.java
│   ├── service/
│   │   ├── RecommendationService.java
│   │   ├── RecommendationIntegrationService.java
│   │   └── MockRecommendationService.java
│   ├── controller/
│   │   ├── RecommendationController.java
│   │   └── testController/RecommendationTestController.java
│   └── config/
│       ├── RecommendationConfig.java
│       └── RecommendationDevConfig.java
├── ML_INTEGRATION_README.md
├── ML_SETUP_QUICK_START.md
├── ML_TESTING_GUIDE.md
├── ML_INTEGRATION_COMPLETE.md
└── ML_QUICK_REFERENCE.md (this file)
```

## ✅ Checklist

- [x] Spring Boot integration complete
- [x] Mock data working
- [x] All endpoints available
- [x] Error handling implemented
- [x] Logging configured
- [x] Documentation complete
- [ ] FastAPI service running (optional)
- [ ] Integrated with existing services
- [ ] Frontend connected
- [ ] Deployed to production

## 🎯 Next Steps

1. **Test now** - Use curl examples above
2. **Integrate** - Add one-liners to your services
3. **Connect frontend** - Call REST endpoints
4. **Deploy** - Set environment variables

## 📞 Support

- See `ML_INTEGRATION_README.md` for complete guide
- See `ML_TESTING_GUIDE.md` for testing help
- Check logs for debugging: `grep "Recommendation" logs.txt`

---

**Status:** ✅ Ready to Use
**Version:** 1.0.0