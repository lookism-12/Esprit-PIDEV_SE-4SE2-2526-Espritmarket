package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.entity.cart.Order;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Validates order status transitions according to business rules.
 * 
 * WORKFLOW WITH RETURNED LOGIC:
 * - Orders start as PENDING
 * - Provider confirms: PENDING → CONFIRMED (stock reduced)
 * - Delivery workflow: CONFIRMED → PREPARING → IN_TRANSIT → DELIVERED or RETURNED
 * - Cancellation: PENDING/CONFIRMED → CANCELLED (stock restored if was CONFIRMED)
 * 
 * STRICT TRANSITION RULES:
 * - PENDING → CONFIRMED (provider only)
 * - PENDING → CANCELLED (provider/client)
 * - CONFIRMED → PREPARING (delivery only)
 * - CONFIRMED → CANCELLED (client/admin, before delivery starts)
 * - PREPARING → IN_TRANSIT (delivery only)
 * - IN_TRANSIT → DELIVERED (delivery only, success)
 * - IN_TRANSIT → RETURNED (delivery only, failed delivery)
 * 
 * FORBIDDEN TRANSITIONS:
 * - Cannot go backwards (e.g., DELIVERED → CONFIRMED)
 * - Cannot change DELIVERED, RETURNED, or CANCELLED (final states)
 * - Cannot cancel after PREPARING (too late, already in delivery process)
 * 
 * PAYMENT vs ORDER STATUS:
 * - PaymentStatus (PENDING_PAYMENT/PAID) is separate from OrderStatus
 * - Stock reduction happens when orderStatus = CONFIRMED
 * - Stock restoration happens when orderStatus = RETURNED or CANCELLED (if was CONFIRMED)
 * - Provider CANNOT change PaymentStatus (only delivery can for CASH orders)
 */
@Service
public class OrderStatusValidator {
    
    /**
     * Validate if status transition is allowed
     */
    public void validateTransition(Order order, OrderStatus newStatus, String actor) {
        OrderStatus currentStatus = order.getStatus();
        
        // Same status is always allowed (idempotent)
        if (currentStatus == newStatus) {
            return;
        }
        
        // Validate based on current status
        switch (currentStatus) {
            case PENDING:
                validateFromPending(newStatus, actor, order);
                break;
            case CONFIRMED:
                validateFromConfirmed(newStatus, actor);
                break;
            case PREPARING:
                validateFromPreparing(newStatus, actor);
                break;
            case IN_TRANSIT:
                validateFromInTransit(newStatus, actor);
                break;
            case DELIVERED:
            case RESTOCKED:
            case CANCELLED:
                throw new IllegalStateException(
                    String.format("Cannot change status from %s (final state)", currentStatus)
                );
            case RETURNED:
                validateFromReturned(newStatus, actor);
                break;
            default:
                throw new IllegalStateException("Unknown order status: " + currentStatus);
        }
    }
    
    private void validateFromPending(OrderStatus newStatus, String actor, Order order) {
        switch (newStatus) {
            case CONFIRMED:
                if (!"PROVIDER".equals(actor) && !"SYSTEM".equals(actor)) {
                    throw new IllegalStateException("Only provider or system can confirm orders");
                }
                break;
            case CANCELLED:
                if (!"PROVIDER".equals(actor) && !"CLIENT".equals(actor) && !"SYSTEM".equals(actor)) {
                    throw new IllegalStateException("Only provider, client, or system can cancel orders");
                }
                if ("CLIENT".equals(actor) && !canClientCancelOrder(order)) {
                    throw new IllegalStateException("Client can only cancel within 7 days of order creation");
                }
                break;
            case RESTOCKED:
                // Allow PENDING → RESTOCKED when delivery was returned before provider confirmed
                if (!"PROVIDER".equals(actor) && !"ADMIN".equals(actor)) {
                    throw new IllegalStateException("Only provider or admin can restock orders");
                }
                break;
            default:
                throw new IllegalStateException(
                    String.format("Invalid transition from PENDING to %s. Only CONFIRMED, CANCELLED, or RESTOCKED allowed.", newStatus)
                );
        }
    }
    
    private void validateFromConfirmed(OrderStatus newStatus, String actor) {
        switch (newStatus) {
            case PREPARING:
                if (!"DELIVERY".equals(actor) && !"ADMIN".equals(actor)) {
                    throw new IllegalStateException("Only delivery or admin can mark orders as preparing");
                }
                break;
            case CANCELLED:
                // Allow cancellation from CONFIRMED (before delivery starts)
                if (!"CLIENT".equals(actor) && !"ADMIN".equals(actor)) {
                    throw new IllegalStateException("Only client or admin can cancel confirmed orders before delivery");
                }
                break;
            case RESTOCKED:
                // Allow direct CONFIRMED → RESTOCKED when delivery was returned
                // but order status was never updated to RETURNED (legacy/async flow)
                if (!"PROVIDER".equals(actor) && !"ADMIN".equals(actor)) {
                    throw new IllegalStateException("Only provider or admin can restock orders");
                }
                break;
            default:
                throw new IllegalStateException(
                    String.format("Invalid transition from CONFIRMED to %s. Only PREPARING, CANCELLED, or RESTOCKED allowed.", newStatus)
                );
        }
    }
    
    private void validateFromPreparing(OrderStatus newStatus, String actor) {
        if (newStatus == OrderStatus.IN_TRANSIT) {
            if (!"DELIVERY".equals(actor) && !"ADMIN".equals(actor)) {
                throw new IllegalStateException("Only delivery or admin can mark orders as in transit");
            }
        } else {
            throw new IllegalStateException(
                String.format("Invalid transition from PREPARING to %s. Only IN_TRANSIT allowed. Cannot cancel after preparing.", newStatus)
            );
        }
    }
    
    private void validateFromInTransit(OrderStatus newStatus, String actor) {
        switch (newStatus) {
            case DELIVERED:
                if (!"DELIVERY".equals(actor) && !"ADMIN".equals(actor)) {
                    throw new IllegalStateException("Only delivery or admin can mark orders as delivered");
                }
                break;
            case RETURNED:
                if (!"DELIVERY".equals(actor) && !"ADMIN".equals(actor)) {
                    throw new IllegalStateException("Only delivery or admin can mark orders as returned");
                }
                break;
            default:
                throw new IllegalStateException(
                    String.format("Invalid transition from IN_TRANSIT to %s. Only DELIVERED or RETURNED allowed.", newStatus)
                );
        }
    }
    
    private void validateFromReturned(OrderStatus newStatus, String actor) {
        if (newStatus == OrderStatus.RESTOCKED) {
            if (!"PROVIDER".equals(actor) && !"ADMIN".equals(actor)) {
                throw new IllegalStateException("Only provider or admin can restock returned orders");
            }
        } else {
            throw new IllegalStateException(
                String.format("Invalid transition from RETURNED to %s. Only RESTOCKED allowed.", newStatus)
            );
        }
    }
    
    /**
     * Check if client can cancel order (within 7 days of creation)
     */
    public boolean canClientCancelOrder(Order order) {
        if (order.getCreatedAt() == null) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        long daysSinceCreation = ChronoUnit.DAYS.between(order.getCreatedAt(), now);
        
        return daysSinceCreation <= 7;
    }
    
    /**
     * Check if order should be auto-cancelled (48h timeout)
     * @deprecated Orders are auto-confirmed now, no timeout needed
     */
    @Deprecated
    public boolean shouldAutoCancelOrder(Order order) {
        if (order.getStatus() != OrderStatus.PENDING) {
            return false;
        }
        
        if (order.getCreatedAt() == null) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        long hoursSinceCreation = ChronoUnit.HOURS.between(order.getCreatedAt(), now);
        
        return hoursSinceCreation >= 48;
    }
}
