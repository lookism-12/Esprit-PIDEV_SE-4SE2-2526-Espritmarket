package esprit_market.controller.cartController;

import esprit_market.Enum.cartEnum.CartStatus;
import esprit_market.dto.cartDto.CartResponse;
import esprit_market.service.cartService.ICartService;
import esprit_market.service.cartService.UserNotAuthenticatedException;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for order status management.
 * Handles order status transitions and provides order tracking endpoints.
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENT')")
public class OrderStatusController {
    
    private final ICartService cartService;
    
    private ObjectId getUserId(Authentication authentication) {
        // For now, use the same logic as CartController
        // In production, extract from JWT token
        return new ObjectId("69ca5e6695e20022a11b7c88");
    }
    
    // ==================== ORDER STATUS QUERIES ====================
    
    /**
     * Get all orders for the authenticated user
     */
    @GetMapping
    public ResponseEntity<List<CartResponse>> getMyOrders(Authentication authentication) {
        ObjectId userId = getUserId(authentication);
        List<CartResponse> orders = cartService.getUserOrders(userId);
        return ResponseEntity.ok(orders);
    }
    
    /**
     * Get orders by status for the authenticated user
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<CartResponse>> getOrdersByStatus(
            @PathVariable CartStatus status,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        List<CartResponse> orders = cartService.getUserOrdersByStatus(userId, status);
        return ResponseEntity.ok(orders);
    }
    
    /**
     * Get specific order by ID
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<CartResponse> getOrderById(
            @PathVariable String orderId,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        CartResponse order = cartService.getOrderById(userId, new ObjectId(orderId));
        return ResponseEntity.ok(order);
    }
    
    // ==================== ORDER STATUS UPDATES ====================
    
    /**
     * Update order status (for admins/sellers)
     */
    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SELLER')")
    public ResponseEntity<CartResponse> updateOrderStatus(
            @PathVariable String orderId,
            @RequestBody OrderStatusUpdateRequest request,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        CartResponse updatedOrder = cartService.updateOrderStatus(
                userId, new ObjectId(orderId), request.getStatus());
        return ResponseEntity.ok(updatedOrder);
    }
    
    /**
     * Mark order as paid (payment confirmation)
     */
    @PutMapping("/{orderId}/pay")
    public ResponseEntity<CartResponse> markOrderAsPaid(
            @PathVariable String orderId,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        CartResponse order = cartService.markOrderAsPaid(userId, new ObjectId(orderId));
        return ResponseEntity.ok(order);
    }
    
    /**
     * Process order (for sellers)
     */
    @PutMapping("/{orderId}/process")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SELLER')")
    public ResponseEntity<CartResponse> processOrder(
            @PathVariable String orderId,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        CartResponse order = cartService.processOrder(userId, new ObjectId(orderId));
        return ResponseEntity.ok(order);
    }
    
    /**
     * Ship order (for sellers)
     */
    @PutMapping("/{orderId}/ship")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SELLER')")
    public ResponseEntity<CartResponse> shipOrder(
            @PathVariable String orderId,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        CartResponse order = cartService.shipOrder(userId, new ObjectId(orderId));
        return ResponseEntity.ok(order);
    }
    
    /**
     * Deliver order (for delivery personnel)
     */
    @PutMapping("/{orderId}/deliver")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DELIVERY')")
    public ResponseEntity<CartResponse> deliverOrder(
            @PathVariable String orderId,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        CartResponse order = cartService.deliverOrder(userId, new ObjectId(orderId));
        return ResponseEntity.ok(order);
    }
    
    // ==================== STOCK INFORMATION ====================
    
    /**
     * Get current stock for a product (public endpoint)
     */
    @GetMapping("/product/{productId}/stock")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ProductStockResponse> getProductStock(
            @PathVariable String productId) {
        
        ObjectId prodId = new ObjectId(productId);
        int stock = ((esprit_market.service.cartService.CartServiceImpl) cartService).getProductStock(prodId);
        boolean available = ((esprit_market.service.cartService.CartServiceImpl) cartService).isProductAvailable(prodId);
        
        return ResponseEntity.ok(new ProductStockResponse(productId, stock, available));
    }
    
    // ==================== DTOs ====================
    
    public static class OrderStatusUpdateRequest {
        private CartStatus status;
        
        public CartStatus getStatus() { return status; }
        public void setStatus(CartStatus status) { this.status = status; }
    }
    
    public static class ProductStockResponse {
        private String productId;
        private int stock;
        private boolean available;
        
        public ProductStockResponse(String productId, int stock, boolean available) {
            this.productId = productId;
            this.stock = stock;
            this.available = available;
        }
        
        public String getProductId() { return productId; }
        public int getStock() { return stock; }
        public boolean isAvailable() { return available; }
    }
}