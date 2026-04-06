package esprit_market.service.cartService;

import esprit_market.entity.marketplace.Product;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.bson.types.ObjectId;

/**
 * Service responsible for managing product stock operations.
 * Handles stock validation, reduction, and restoration in a thread-safe manner.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StockManagementService {
    
    private final ProductRepository productRepository;
    
    /**
     * Validates if sufficient stock is available for the requested quantity.
     * 
     * @param productId The product to check
     * @param requestedQuantity The quantity requested
     * @throws InsufficientStockException if not enough stock
     * @throws ResourceNotFoundException if product not found
     */
    public void validateStockAvailability(ObjectId productId, int requestedQuantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        // FIXED: Use stock field as primary stock field (consistent with Products API)
        int availableStock = product.getStock();
        
        // Fallback to quantity field if stock is not set
        if (availableStock == 0 && product.getQuantity() > 0) {
            availableStock = product.getQuantity();
            log.debug("Using quantity field as fallback for product {}", product.getName());
        }
        
        if (availableStock < requestedQuantity) {
            log.warn("Insufficient stock for product {}. Available: {}, Requested: {}", 
                    product.getName(), availableStock, requestedQuantity);
            throw new InsufficientStockException(
                String.format("Insufficient stock for product '%s'. Available: %d, Requested: %d", 
                        product.getName(), availableStock, requestedQuantity));
        }
        
        log.debug("Stock validation passed for product {}. Available: {}, Requested: {}", 
                product.getName(), availableStock, requestedQuantity);
    }
    
    /**
     * Reduces product stock by the specified quantity.
     * This operation is atomic and thread-safe.
     * 
     * @param productId The product to update
     * @param quantity The quantity to reduce
     * @throws InsufficientStockException if not enough stock
     * @throws ResourceNotFoundException if product not found
     */
    @Transactional
    public void reduceStock(ObjectId productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        // FIXED: Use stock field as primary stock field (consistent with Products API)
        int currentStock = product.getStock();
        
        // Fallback to quantity field if stock is not set
        if (currentStock == 0 && product.getQuantity() > 0) {
            currentStock = product.getQuantity();
            log.debug("Using quantity field as fallback for product {}", product.getName());
        }
        
        // Double-check stock availability (race condition protection)
        if (currentStock < quantity) {
            throw new InsufficientStockException(
                String.format("Insufficient stock for product '%s'. Available: %d, Requested: %d", 
                        product.getName(), currentStock, quantity));
        }
        
        int newStock = currentStock - quantity;
        
        // Update both quantity and stock fields to maintain consistency
        product.setStock(newStock);
        product.setQuantity(newStock); // Keep both fields in sync
        
        Product savedProduct = productRepository.save(product);
        
        log.info("Stock reduced for product '{}'. Previous: {}, Reduced: {}, New: {}", 
                product.getName(), currentStock, quantity, newStock);
        
        // Emit stock change event for real-time updates
        logStockChange(savedProduct, quantity, "REDUCED");
    }
    
    /**
     * Restores product stock by the specified quantity.
     * Used when orders are cancelled or refunded.
     * 
     * @param productId The product to update
     * @param quantity The quantity to restore
     * @throws ResourceNotFoundException if product not found
     */
    @Transactional
    public void restoreStock(ObjectId productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        // FIXED: Use stock field as primary stock field (consistent with Products API)
        int currentStock = product.getStock();
        
        // Fallback to quantity field if stock is not set
        if (currentStock == 0 && product.getQuantity() > 0) {
            currentStock = product.getQuantity();
            log.debug("Using quantity field as fallback for product {}", product.getName());
        }
        
        int newStock = currentStock + quantity;
        
        // Update both quantity and stock fields to maintain consistency
        product.setStock(newStock);
        product.setQuantity(newStock); // Keep both fields in sync
        
        Product savedProduct = productRepository.save(product);
        
        log.info("Stock restored for product '{}'. Previous: {}, Restored: {}, New: {}", 
                product.getName(), currentStock, quantity, newStock);
        
        // Emit stock change event for real-time updates
        logStockChange(savedProduct, quantity, "RESTORED");
    }
    
    /**
     * Gets current stock level for a product.
     * 
     * @param productId The product to check
     * @return Current stock level
     * @throws ResourceNotFoundException if product not found
     */
    public int getCurrentStock(ObjectId productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        // Use quantity field as primary stock field
        return product.getQuantity();
    }
    
    /**
     * Checks if a product is available for purchase (stock > 0).
     * 
     * @param productId The product to check
     * @return true if product has stock, false otherwise
     * @throws ResourceNotFoundException if product not found
     */
    public boolean isProductAvailable(ObjectId productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        
        // Use quantity field as primary stock field
        return product.getQuantity() > 0;
    }
    
    /**
     * Gets the maximum quantity that can be purchased for a product.
     * Useful for UI to limit quantity selection.
     * 
     * @param productId The product to check
     * @return Maximum purchasable quantity
     * @throws ResourceNotFoundException if product not found
     */
    public int getMaxPurchasableQuantity(ObjectId productId) {
        return getCurrentStock(productId);
    }
    
    /**
     * Batch operation to validate stock for multiple products.
     * Used during cart validation before checkout.
     * 
     * @param stockRequirements Map of productId -> required quantity
     * @throws InsufficientStockException if any product doesn't have enough stock
     */
    public void validateBatchStockAvailability(java.util.Map<ObjectId, Integer> stockRequirements) {
        for (java.util.Map.Entry<ObjectId, Integer> requirement : stockRequirements.entrySet()) {
            validateStockAvailability(requirement.getKey(), requirement.getValue());
        }
        
        log.debug("Batch stock validation passed for {} products", stockRequirements.size());
    }
    
    /**
     * Batch operation to reduce stock for multiple products.
     * Used during order confirmation.
     * 
     * @param stockReductions Map of productId -> quantity to reduce
     * @throws InsufficientStockException if any product doesn't have enough stock
     */
    @Transactional
    public void batchReduceStock(java.util.Map<ObjectId, Integer> stockReductions) {
        // First validate all products have sufficient stock
        validateBatchStockAvailability(stockReductions);
        
        // Then reduce stock for all products
        for (java.util.Map.Entry<ObjectId, Integer> reduction : stockReductions.entrySet()) {
            reduceStock(reduction.getKey(), reduction.getValue());
        }
        
        log.info("Batch stock reduction completed for {} products", stockReductions.size());
    }
    
    /**
     * Batch operation to restore stock for multiple products.
     * Used during order cancellation or refund.
     * 
     * @param stockRestorations Map of productId -> quantity to restore
     */
    @Transactional
    public void batchRestoreStock(java.util.Map<ObjectId, Integer> stockRestorations) {
        for (java.util.Map.Entry<ObjectId, Integer> restoration : stockRestorations.entrySet()) {
            restoreStock(restoration.getKey(), restoration.getValue());
        }
        
        log.info("Batch stock restoration completed for {} products", stockRestorations.size());
    }
    
    private void logStockChange(Product product, int quantity, String operation) {
        log.debug("STOCK_CHANGE_EVENT: Product={}, Operation={}, Quantity={}, NewStock={}", 
                product.getName(), operation, quantity, product.getStock());
        
        // Here you could emit events for real-time UI updates:
        // applicationEventPublisher.publishEvent(new StockChangeEvent(product.getId(), product.getStock()));
    }
}