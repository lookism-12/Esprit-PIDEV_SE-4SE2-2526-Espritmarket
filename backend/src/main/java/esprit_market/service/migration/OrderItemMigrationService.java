package esprit_market.service.migration;

import esprit_market.entity.cart.OrderItem;
import esprit_market.entity.marketplace.Product;
import esprit_market.repository.cartRepository.OrderItemRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Migration Service: Fix Missing shopId in OrderItems
 * 
 * This service populates the shopId field in existing OrderItems
 * by copying it from the related Product entity.
 * 
 * Usage:
 * - Call via REST endpoint: POST /api/admin/migrate/order-items-shopid
 * - Or inject and call: orderItemMigrationService.migrateOrderItemsShopId()
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderItemMigrationService {

    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    /**
     * Migrate all OrderItems to populate missing shopId
     * 
     * @return MigrationResult with statistics
     */
    @Transactional
    public MigrationResult migrateOrderItemsShopId() {
        log.info("========================================");
        log.info("🔧 STARTING ORDERITEM SHOPID MIGRATION");
        log.info("========================================");

        MigrationResult result = new MigrationResult();
        
        // Get all OrderItems
        List<OrderItem> allOrderItems = orderItemRepository.findAll();
        result.setTotalItems(allOrderItems.size());
        log.info("📊 Total OrderItems in database: {}", allOrderItems.size());

        int updatedCount = 0;
        int alreadyHasShopId = 0;
        int noProductFound = 0;
        int productHasNoShopId = 0;
        int errorCount = 0;

        for (OrderItem orderItem : allOrderItems) {
            try {
                // Check if shopId is already set
                if (orderItem.getShopId() != null) {
                    alreadyHasShopId++;
                    continue;
                }

                // Check if productId exists
                if (orderItem.getProductId() == null) {
                    log.warn("⚠️  OrderItem {} has no productId", orderItem.getId());
                    errorCount++;
                    continue;
                }

                // Find the product
                Optional<Product> productOpt = productRepository.findById(orderItem.getProductId());
                
                if (!productOpt.isPresent()) {
                    log.warn("⚠️  OrderItem {} - Product not found (productId: {})", 
                            orderItem.getId(), orderItem.getProductId());
                    noProductFound++;
                    continue;
                }

                Product product = productOpt.get();

                // Check if product has shopId
                if (product.getShopId() == null) {
                    log.warn("⚠️  OrderItem {} - Product '{}' has no shopId", 
                            orderItem.getId(), product.getName());
                    productHasNoShopId++;
                    continue;
                }

                // Update OrderItem with shopId from Product
                orderItem.setShopId(product.getShopId());
                orderItemRepository.save(orderItem);
                updatedCount++;

                if (updatedCount % 10 == 0) {
                    log.info("✅ Updated {} OrderItems...", updatedCount);
                }

            } catch (Exception e) {
                log.error("❌ ERROR processing OrderItem {}: {}", orderItem.getId(), e.getMessage(), e);
                errorCount++;
            }
        }

        // Set results
        result.setUpdatedCount(updatedCount);
        result.setAlreadyHasShopId(alreadyHasShopId);
        result.setNoProductFound(noProductFound);
        result.setProductHasNoShopId(productHasNoShopId);
        result.setErrorCount(errorCount);

        // Log summary
        log.info("========================================");
        log.info("🎉 MIGRATION COMPLETE");
        log.info("========================================");
        log.info("📊 Total OrderItems: {}", result.getTotalItems());
        log.info("✅ Successfully updated: {}", updatedCount);
        log.info("✓  Already had shopId: {}", alreadyHasShopId);
        log.info("⚠️  Product not found: {}", noProductFound);
        log.info("⚠️  Product has no shopId: {}", productHasNoShopId);
        log.info("❌ Errors: {}", errorCount);

        // Verification
        long finalItemsWithShopId = orderItemRepository.findAll().stream()
                .filter(item -> item.getShopId() != null)
                .count();
        long finalItemsWithoutShopId = orderItemRepository.findAll().stream()
                .filter(item -> item.getShopId() == null)
                .count();

        log.info("📊 VERIFICATION:");
        log.info("✅ OrderItems with shopId: {}", finalItemsWithShopId);
        log.info("❌ OrderItems without shopId: {}", finalItemsWithoutShopId);

        if (finalItemsWithoutShopId == 0) {
            log.info("🎉 SUCCESS! All OrderItems now have shopId!");
            result.setSuccess(true);
        } else {
            log.warn("⚠️  WARNING: {} OrderItems still missing shopId", finalItemsWithoutShopId);
            log.warn("   These may be orphaned records (products deleted or never had shopId)");
            result.setSuccess(false);
        }

        log.info("========================================");

        return result;
    }

    /**
     * Migration result DTO
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class MigrationResult {
        private int totalItems;
        private int updatedCount;
        private int alreadyHasShopId;
        private int noProductFound;
        private int productHasNoShopId;
        private int errorCount;
        private boolean success;

        public String getSummary() {
            return String.format(
                "Migration completed: %d/%d OrderItems updated. " +
                "Already had shopId: %d, Product not found: %d, Product has no shopId: %d, Errors: %d",
                updatedCount, totalItems, alreadyHasShopId, noProductFound, productHasNoShopId, errorCount
            );
        }
    }
}
