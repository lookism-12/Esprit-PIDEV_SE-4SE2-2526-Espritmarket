package esprit_market.service.cartService;

import esprit_market.dto.DiscountCreateRequest;
import esprit_market.dto.DiscountResponse;
import esprit_market.dto.DiscountUpdateRequest;
import org.bson.types.ObjectId;

import java.util.List;

public interface IDiscountService {
    
    // ==================== CREATE/UPDATE ====================
    
    DiscountResponse save(DiscountCreateRequest request);
    
    DiscountResponse update(ObjectId id, DiscountUpdateRequest request);
    
    // ==================== READ ====================
    
    List<DiscountResponse> findAll();
    
    DiscountResponse findById(ObjectId id);
    
    List<DiscountResponse> findActiveDiscounts();
    
    // ==================== DELETE ====================
    
    void deleteById(ObjectId id);
    
    void deactivateExpiredDiscounts();
}
