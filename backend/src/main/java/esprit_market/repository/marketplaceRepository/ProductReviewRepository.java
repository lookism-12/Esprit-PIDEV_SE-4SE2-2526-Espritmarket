package esprit_market.repository.marketplaceRepository;

import esprit_market.entity.marketplace.ProductReview;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductReviewRepository extends MongoRepository<ProductReview, ObjectId> {
    
    /**
     * Find all reviews for a specific product
     */
    List<ProductReview> findByProductId(ObjectId productId);
    
    /**
     * Find all reviews for a specific seller
     */
    List<ProductReview> findBySellerId(ObjectId sellerId);
    
    /**
     * Find all reviews for a specific shop
     */
    List<ProductReview> findByShopId(ObjectId shopId);
    
    /**
     * Find review by customer and order item (prevent duplicate reviews)
     */
    Optional<ProductReview> findByCustomerIdAndOrderItemId(ObjectId customerId, ObjectId orderItemId);
    
    /**
     * Check if customer already reviewed this order item
     */
    boolean existsByCustomerIdAndOrderItemId(ObjectId customerId, ObjectId orderItemId);
    
    /**
     * Count approved reviews for a seller
     */
    long countBySellerIdAndApprovedTrue(ObjectId sellerId);
}
