# ML Recommendation System Integration

## Overview
This integration connects your Spring Boot backend with a FastAPI ML recommendation service, providing personalized product recommendations and user behavior tracking.

## Architecture
```
Angular Frontend → Spring Boot Backend → FastAPI ML Service
                                    ↓
                              MongoDB (user interactions)
```

## Files Created

### 1. DTOs (`/dto/recommendation/`)
- `RecommendationDTO.java` - Response from ML service with recommendations
- `ProductRecommendationDTO.java` - Individual product recommendation
- `FeedbackRequestDTO.java` - Request for sending user feedback
- `FeedbackResponseDTO.java` - Response from feedback submission

### 2. Configuration (`/config/`)
- `RecommendationConfig.java` - ML service configuration and WebClient setup

### 3. Services (`/service/`)
- `RecommendationService.java` - Main service for ML communication
- `RecommendationIntegrationService.java` - Easy integration helpers
- `RecommendationIntegrationExample.java` - Integration examples

### 4. Controllers (`/controller/`)
- `RecommendationController.java` - REST endpoints for recommendations
- `RecommendationTestController.java` - Test endpoints for validation

## Configuration

Add these properties to `application.properties`:

```properties
# ML Recommendation Service Configuration
app.ml-service.base-url=${ML_SERVICE_BASE_URL:http://127.0.0.1:8001}
app.ml-service.timeout-seconds=${ML_SERVICE_TIMEOUT_SECONDS:30}
app.ml-service.max-retries=${ML_SERVICE_MAX_RETRIES:3}
app.ml-service.enabled=${ML_SERVICE_ENABLED:true}
```

### Environment Variables (Production)
```bash
ML_SERVICE_BASE_URL=http://your-ml-service:8001
ML_SERVICE_TIMEOUT_SECONDS=30
ML_SERVICE_MAX_RETRIES=3
ML_SERVICE_ENABLED=true
```

## API Endpoints

### Main Endpoints
- `GET /api/recommendation/{userId}` - Get recommendations for user
- `POST /api/recommendation/feedback` - Send user interaction feedback
- `POST /api/recommendation/feedback/simple` - Send feedback with query params
- `GET /api/recommendation/health` - Check ML service health

### Test Endpoints
- `GET /api/test/recommendation/test-recommendations/{userId}` - Test recommendations
- `POST /api/test/recommendation/test-feedback` - Test feedback
- `POST /api/test/recommendation/test-integration/{action}` - Test integration
- `GET /api/test/recommendation/test-health` - Test health check
- `GET /api/test/recommendation/instructions` - Get test instructions

## Usage Examples

### 1. Get Recommendations
```bash
curl -X GET "http://localhost:8090/api/recommendation/user123"
```

### 2. Send Feedback
```bash
curl -X POST "http://localhost:8090/api/recommendation/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "product_id": "prod456", 
    "action": "purchase"
  }'
```

### 3. Simple Feedback
```bash
curl -X POST "http://localhost:8090/api/recommendation/feedback/simple?user_id=user123&product_id=prod456&action=view"
```

## Integration with Existing Services

### 1. FavorisService Integration
```java
@Service
public class FavorisService {
    private final RecommendationIntegrationService recommendationIntegration;
    
    public void addFavoris(String userId, String productId) {
        // Your existing logic...
        
        // Add ML tracking
        recommendationIntegration.trackProductLike(userId, productId);
    }
}
```

### 2. ProductService Integration
```java
@Service
public class ProductService {
    private final RecommendationIntegrationService recommendationIntegration;
    
    public Product getProductById(String productId, String userId) {
        // Your existing logic...
        
        // Add ML tracking
        recommendationIntegration.trackProductView(userId, productId);
        
        return product;
    }
}
```

### 3. CartService Integration
```java
@Service
public class CartService {
    private final RecommendationIntegrationService recommendationIntegration;
    
    public void addToCart(String userId, String productId) {
        // Your existing logic...
        
        // Add ML tracking
        recommendationIntegration.trackAddToCart(userId, productId);
    }
    
    public void removeFromCart(String userId, String productId) {
        // Your existing logic...
        
        // Add ML tracking
        recommendationIntegration.trackRemoveFromCart(userId, productId);
    }
}
```

### 4. OrderService Integration
```java
@Service
public class OrderService {
    private final RecommendationIntegrationService recommendationIntegration;
    
    public void completeOrder(String userId, List<String> productIds) {
        // Your existing logic...
        
        // Add ML tracking
        recommendationIntegration.trackMultiplePurchases(userId, productIds);
    }
}
```

## Supported Actions
- `view` - User viewed a product
- `like` - User liked/favorited a product
- `purchase` - User purchased a product
- `add_to_cart` - User added product to cart
- `remove_from_cart` - User removed product from cart

## Error Handling

### Graceful Degradation
- If ML service is down, recommendations return empty list
- Feedback tracking fails silently (async)
- Main application functionality is not affected

### Retry Logic
- Automatic retry on 5xx server errors
- Exponential backoff strategy
- Configurable max retries

### Logging
- Comprehensive logging for debugging
- Error tracking for monitoring
- Performance metrics

## Testing

### 1. Start FastAPI Service
```bash
# Make sure your FastAPI service is running on http://127.0.0.1:8001
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

### 2. Test Health Check
```bash
curl -X GET "http://localhost:8090/api/test/recommendation/test-health"
```

### 3. Test Recommendations
```bash
curl -X GET "http://localhost:8090/api/test/recommendation/test-recommendations/user123"
```

### 4. Test Feedback
```bash
curl -X POST "http://localhost:8090/api/test/recommendation/test-feedback?userId=user123&productId=prod456&action=view"
```

### 5. Test Integration
```bash
curl -X POST "http://localhost:8090/api/test/recommendation/test-integration/like?userId=user123&productId=prod456"
```

## Production Deployment

### 1. Environment Setup
```bash
export ML_SERVICE_BASE_URL=http://ml-service:8001
export ML_SERVICE_ENABLED=true
```

### 2. Docker Compose Example
```yaml
services:
  spring-boot-app:
    environment:
      - ML_SERVICE_BASE_URL=http://ml-service:8001
      - ML_SERVICE_ENABLED=true
  
  ml-service:
    image: your-ml-service:latest
    ports:
      - "8001:8001"
```

### 3. Kubernetes ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ml-config
data:
  ML_SERVICE_BASE_URL: "http://ml-service:8001"
  ML_SERVICE_ENABLED: "true"
```

## Monitoring

### Health Checks
- `/api/recommendation/health` - Overall ML service health
- `/api/test/recommendation/test-health` - Detailed health check

### Metrics to Monitor
- ML service response time
- Recommendation request success rate
- Feedback submission success rate
- Service availability percentage

## Security Considerations

### 1. Authentication
- Add JWT authentication to recommendation endpoints if needed
- Validate user permissions before providing recommendations

### 2. Rate Limiting
- Implement rate limiting for recommendation requests
- Prevent abuse of feedback endpoints

### 3. Data Privacy
- Ensure user data is handled according to privacy policies
- Consider data anonymization for ML training

## Troubleshooting

### Common Issues

1. **ML Service Not Available**
   - Check if FastAPI service is running
   - Verify network connectivity
   - Check firewall settings

2. **Timeout Errors**
   - Increase timeout configuration
   - Check ML service performance
   - Consider caching strategies

3. **Empty Recommendations**
   - Check if user has interaction history
   - Verify ML model is trained
   - Check ML service logs

### Debug Mode
Enable debug logging:
```properties
logging.level.esprit_market.service.RecommendationService=DEBUG
logging.level.esprit_market.controller.RecommendationController=DEBUG
```

## Next Steps

1. **Integrate with existing services** using the provided examples
2. **Test thoroughly** using the test endpoints
3. **Monitor performance** in production
4. **Collect feedback** to improve recommendations
5. **Scale ML service** as needed for production load

## Support

For issues or questions:
1. Check the logs for error details
2. Use test endpoints to isolate problems
3. Verify ML service is running and accessible
4. Check configuration properties