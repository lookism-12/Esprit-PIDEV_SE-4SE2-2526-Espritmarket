# ML Integration - Quick Start Guide

## ✅ Fixed Issues
- Updated all imports from `javax.validation` to `jakarta.validation` (Spring Boot 3.x compatible)
- Added WebFlux dependency to `pom.xml`
- All files compile without errors

## 🚀 Quick Setup (5 minutes)

### Step 1: Verify Dependencies
Your `pom.xml` now includes:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

### Step 2: Configure ML Service
Add to `application.properties`:
```properties
app.ml-service.base-url=http://127.0.0.1:8001
app.ml-service.timeout-seconds=30
app.ml-service.max-retries=3
app.ml-service.enabled=true
```

### Step 3: Start Your Services
```bash
# Terminal 1: Start FastAPI ML Service
python -m uvicorn main:app --host 127.0.0.1 --port 8001

# Terminal 2: Start Spring Boot
mvn spring-boot:run
```

### Step 4: Test the Integration
```bash
# Test health check
curl http://localhost:8090/api/test/recommendation/test-health

# Test recommendations
curl http://localhost:8090/api/test/recommendation/test-recommendations/user123

# Test feedback
curl -X POST "http://localhost:8090/api/test/recommendation/test-feedback?userId=user123&productId=prod456&action=view"
```

## 📋 Integration Checklist

### For Each Service You Want to Track:

1. **FavorisService** (Track likes):
   ```java
   @Autowired
   private RecommendationIntegrationService recommendationIntegration;
   
   // In your addFavoris() method:
   recommendationIntegration.trackProductLike(userId, productId);
   ```

2. **ProductService** (Track views):
   ```java
   @Autowired
   private RecommendationIntegrationService recommendationIntegration;
   
   // In your getProductById() method:
   recommendationIntegration.trackProductView(userId, productId);
   ```

3. **CartService** (Track cart actions):
   ```java
   @Autowired
   private RecommendationIntegrationService recommendationIntegration;
   
   // In addToCart():
   recommendationIntegration.trackAddToCart(userId, productId);
   
   // In removeFromCart():
   recommendationIntegration.trackRemoveFromCart(userId, productId);
   ```

4. **OrderService** (Track purchases):
   ```java
   @Autowired
   private RecommendationIntegrationService recommendationIntegration;
   
   // In completeOrder():
   recommendationIntegration.trackMultiplePurchases(userId, productIds);
   ```

## 🔍 Available Endpoints

### Production Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/recommendation/{userId}` | Get recommendations |
| POST | `/api/recommendation/feedback` | Send feedback (JSON) |
| POST | `/api/recommendation/feedback/simple` | Send feedback (Query params) |
| GET | `/api/recommendation/health` | Check service health |

### Test Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/test/recommendation/test-recommendations/{userId}` | Test recommendations |
| POST | `/api/test/recommendation/test-feedback` | Test feedback |
| POST | `/api/test/recommendation/test-integration/{action}` | Test integration |
| GET | `/api/test/recommendation/test-health` | Test health |
| GET | `/api/test/recommendation/instructions` | Get instructions |

## 📊 Supported Actions
- `view` - Product viewed
- `like` - Product liked/favorited
- `purchase` - Product purchased
- `add_to_cart` - Added to cart
- `remove_from_cart` - Removed from cart

## 🛠️ Troubleshooting

### Issue: "ML service not available"
```bash
# Check if FastAPI is running
curl http://127.0.0.1:8001/health

# If not, start it:
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

### Issue: Compilation errors
```bash
# Clean and rebuild
mvn clean install

# Or just compile
mvn compile
```

### Issue: Timeout errors
Increase timeout in `application.properties`:
```properties
app.ml-service.timeout-seconds=60
```

## 📝 Example: Complete Integration

Here's a complete example of integrating with FavorisService:

```java
package esprit_market.service.marketplaceService;

import esprit_market.service.RecommendationIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FavorisService {
    
    private final FavorisRepository repository;
    private final RecommendationIntegrationService recommendationIntegration;
    
    public void addFavoris(String userId, String productId) {
        // Your existing logic
        Favoris favoris = new Favoris();
        favoris.setUserId(userId);
        favoris.setProductId(productId);
        repository.save(favoris);
        
        // Add ML tracking (one line!)
        recommendationIntegration.trackProductLike(userId, productId);
    }
}
```

## 🎯 Next Steps

1. ✅ Dependencies are configured
2. ✅ All files compile without errors
3. ⏭️ Add the one-line integrations to your services
4. ⏭️ Test with the test endpoints
5. ⏭️ Deploy to production

## 📚 Full Documentation
See `ML_INTEGRATION_README.md` for comprehensive documentation.

## ✨ Summary
Your ML integration is ready to use! All compilation issues are fixed, and you can start integrating with your existing services immediately.