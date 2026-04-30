package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.entity.cart.Order;

import java.util.List;
import java.util.Set;

public final class OrderDeliveryEligibility {

    private static final Set<String> CARD_PAYMENT_METHODS = Set.of(
            "CARD",
            "CREDIT_CARD",
            "DEBIT_CARD",
            "ONLINE_PAYMENT",
            "STRIPE"
    );

    private static final Set<String> CASH_PAYMENT_METHODS = Set.of(
            "CASH",
            "CASH_ON_DELIVERY"
    );

    private OrderDeliveryEligibility() {
    }

    public static boolean isEligibleForDelivery(Order order) {
        if (order == null) {
            return false;
        }

        if (isCardPaymentMethod(order.getPaymentMethod())) {
            return true;
        }

        return isCashPaymentMethod(order.getPaymentMethod())
                && order.getStatus() == OrderStatus.CONFIRMED;
    }

    public static boolean isCardPaymentMethod(String paymentMethod) {
        return CARD_PAYMENT_METHODS.contains(normalize(paymentMethod));
    }

    public static boolean isCashPaymentMethod(String paymentMethod) {
        return CASH_PAYMENT_METHODS.contains(normalize(paymentMethod));
    }

    public static List<String> cardPaymentMethods() {
        return List.copyOf(CARD_PAYMENT_METHODS);
    }

    public static List<String> cashPaymentMethods() {
        return List.copyOf(CASH_PAYMENT_METHODS);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
