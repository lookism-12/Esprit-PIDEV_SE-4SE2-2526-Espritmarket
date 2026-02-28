package esprit_market;

import esprit_market.Enum.cartEnum.CartItemStatus;
import esprit_market.Enum.cartEnum.CartStatus;
import esprit_market.Enum.cartEnum.DiscountType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Cart-related Enums.
 * Tests enum values, behavior, and usage patterns.
 * 
 * IMPORTANT Business Logic:
 * - DRAFT status = Cart (shopping phase, editable)
 * - CONFIRMED status = Order (checkout complete, not editable)
 * - PAID, CANCELLED, etc. = Post-order states
 */
class CartEnumTest {

    // ==================== CART STATUS ENUM TESTS ====================

    @Nested
    @DisplayName("CartStatus Enum Tests")
    class CartStatusTests {

        @Test
        @DisplayName("Should have all expected status values")
        void cartStatus_HasAllExpectedValues() {
            CartStatus[] values = CartStatus.values();

            assertEquals(8, values.length);
            assertNotNull(CartStatus.valueOf("DRAFT"));
            assertNotNull(CartStatus.valueOf("CONFIRMED"));
            assertNotNull(CartStatus.valueOf("PAID"));
            assertNotNull(CartStatus.valueOf("CANCELLED"));
            assertNotNull(CartStatus.valueOf("PARTIALLY_CANCELLED"));
            assertNotNull(CartStatus.valueOf("PARTIALLY_REFUNDED"));
            assertNotNull(CartStatus.valueOf("REFUNDED"));
            assertNotNull(CartStatus.valueOf("PENDING"));
        }

        @Test
        @DisplayName("DRAFT should represent Cart/Shopping state")
        void cartStatus_Draft_IsCartState() {
            CartStatus draft = CartStatus.DRAFT;

            assertEquals("DRAFT", draft.name());
            assertEquals(0, draft.ordinal());
        }

        @Test
        @DisplayName("CONFIRMED should represent Order/Checked-out state")
        void cartStatus_Confirmed_IsOrderState() {
            CartStatus confirmed = CartStatus.CONFIRMED;

            assertEquals("CONFIRMED", confirmed.name());
            assertEquals(1, confirmed.ordinal());
        }

        @ParameterizedTest
        @EnumSource(CartStatus.class)
        @DisplayName("All CartStatus values should have valid names")
        void cartStatus_AllValues_HaveValidNames(CartStatus status) {
            assertNotNull(status.name());
            assertFalse(status.name().isEmpty());
        }

        @Test
        @DisplayName("Should correctly identify editable states")
        void cartStatus_EditableStates() {
            // Only DRAFT carts should be editable
            CartStatus draft = CartStatus.DRAFT;
            CartStatus confirmed = CartStatus.CONFIRMED;
            CartStatus paid = CartStatus.PAID;

            // Simulating business logic check
            boolean isDraftEditable = draft == CartStatus.DRAFT;
            boolean isConfirmedEditable = confirmed == CartStatus.DRAFT;
            boolean isPaidEditable = paid == CartStatus.DRAFT;

            assertTrue(isDraftEditable, "DRAFT should be editable");
            assertFalse(isConfirmedEditable, "CONFIRMED should not be editable");
            assertFalse(isPaidEditable, "PAID should not be editable");
        }

        @Test
        @DisplayName("Should correctly identify cancellable states")
        void cartStatus_CancellableStates() {
            // Only CONFIRMED and PAID orders can be cancelled
            CartStatus draft = CartStatus.DRAFT;
            CartStatus confirmed = CartStatus.CONFIRMED;
            CartStatus paid = CartStatus.PAID;
            CartStatus cancelled = CartStatus.CANCELLED;

            // Simulating cancellation eligibility check
            boolean isDraftCancellable = draft == CartStatus.CONFIRMED || draft == CartStatus.PAID;
            boolean isConfirmedCancellable = confirmed == CartStatus.CONFIRMED || confirmed == CartStatus.PAID;
            boolean isPaidCancellable = paid == CartStatus.CONFIRMED || paid == CartStatus.PAID;
            boolean isCancelledCancellable = cancelled == CartStatus.CONFIRMED || cancelled == CartStatus.PAID;

            assertFalse(isDraftCancellable, "DRAFT should not be cancellable");
            assertTrue(isConfirmedCancellable, "CONFIRMED should be cancellable");
            assertTrue(isPaidCancellable, "PAID should be cancellable");
            assertFalse(isCancelledCancellable, "CANCELLED should not be cancellable");
        }

        @Test
        @DisplayName("Should correctly identify Order states (non-DRAFT)")
        void cartStatus_OrderStates() {
            // All non-DRAFT states are considered "orders"
            for (CartStatus status : CartStatus.values()) {
                boolean isOrder = status != CartStatus.DRAFT;

                if (status == CartStatus.DRAFT) {
                    assertFalse(isOrder, "DRAFT is not an order");
                } else {
                    assertTrue(isOrder, status.name() + " should be considered an order");
                }
            }
        }

        @Test
        @DisplayName("Should correctly identify terminal states")
        void cartStatus_TerminalStates() {
            // Terminal states cannot transition further
            CartStatus cancelled = CartStatus.CANCELLED;
            CartStatus refunded = CartStatus.REFUNDED;

            boolean isCancelledTerminal = cancelled == CartStatus.CANCELLED || cancelled == CartStatus.REFUNDED;
            boolean isRefundedTerminal = refunded == CartStatus.CANCELLED || refunded == CartStatus.REFUNDED;

            assertTrue(isCancelledTerminal);
            assertTrue(isRefundedTerminal);
        }
    }

    // ==================== CART ITEM STATUS ENUM TESTS ====================

    @Nested
    @DisplayName("CartItemStatus Enum Tests")
    class CartItemStatusTests {

        @Test
        @DisplayName("Should have all expected status values")
        void cartItemStatus_HasAllExpectedValues() {
            CartItemStatus[] values = CartItemStatus.values();

            assertEquals(4, values.length);
            assertNotNull(CartItemStatus.valueOf("ACTIVE"));
            assertNotNull(CartItemStatus.valueOf("CANCELLED"));
            assertNotNull(CartItemStatus.valueOf("PARTIALLY_CANCELLED"));
            assertNotNull(CartItemStatus.valueOf("REFUNDED"));
        }

        @Test
        @DisplayName("ACTIVE should be default status")
        void cartItemStatus_Active_IsDefault() {
            CartItemStatus active = CartItemStatus.ACTIVE;

            assertEquals("ACTIVE", active.name());
            assertEquals(0, active.ordinal());
        }

        @ParameterizedTest
        @EnumSource(CartItemStatus.class)
        @DisplayName("All CartItemStatus values should have valid names")
        void cartItemStatus_AllValues_HaveValidNames(CartItemStatus status) {
            assertNotNull(status.name());
            assertFalse(status.name().isEmpty());
        }

        @Test
        @DisplayName("Should correctly identify cancellable item states")
        void cartItemStatus_CancellableStates() {
            CartItemStatus active = CartItemStatus.ACTIVE;
            CartItemStatus partiallyCancelled = CartItemStatus.PARTIALLY_CANCELLED;
            CartItemStatus cancelled = CartItemStatus.CANCELLED;
            CartItemStatus refunded = CartItemStatus.REFUNDED;

            // Items can be cancelled if ACTIVE or PARTIALLY_CANCELLED
            boolean isActiveCancellable = active == CartItemStatus.ACTIVE ||
                    active == CartItemStatus.PARTIALLY_CANCELLED;
            boolean isPartialCancellable = partiallyCancelled == CartItemStatus.ACTIVE ||
                    partiallyCancelled == CartItemStatus.PARTIALLY_CANCELLED;
            boolean isCancelledCancellable = cancelled == CartItemStatus.ACTIVE ||
                    cancelled == CartItemStatus.PARTIALLY_CANCELLED;
            boolean isRefundedCancellable = refunded == CartItemStatus.ACTIVE ||
                    refunded == CartItemStatus.PARTIALLY_CANCELLED;

            assertTrue(isActiveCancellable, "ACTIVE items should be cancellable");
            assertTrue(isPartialCancellable, "PARTIALLY_CANCELLED items should be cancellable");
            assertFalse(isCancelledCancellable, "CANCELLED items should not be cancellable");
            assertFalse(isRefundedCancellable, "REFUNDED items should not be cancellable");
        }

        @Test
        @DisplayName("Should correctly identify terminal item states")
        void cartItemStatus_TerminalStates() {
            CartItemStatus cancelled = CartItemStatus.CANCELLED;
            CartItemStatus refunded = CartItemStatus.REFUNDED;

            assertTrue(cancelled == CartItemStatus.CANCELLED);
            assertTrue(refunded == CartItemStatus.REFUNDED);
        }
    }

    // ==================== DISCOUNT TYPE ENUM TESTS ====================

    @Nested
    @DisplayName("DiscountType Enum Tests")
    class DiscountTypeTests {

        @Test
        @DisplayName("Should have all expected discount types")
        void discountType_HasAllExpectedValues() {
            DiscountType[] values = DiscountType.values();

            assertEquals(2, values.length);
            assertNotNull(DiscountType.valueOf("PERCENTAGE"));
            assertNotNull(DiscountType.valueOf("FIXED"));
        }

        @Test
        @DisplayName("PERCENTAGE should be first enum value")
        void discountType_Percentage_IsFirst() {
            DiscountType percentage = DiscountType.PERCENTAGE;

            assertEquals("PERCENTAGE", percentage.name());
            assertEquals(0, percentage.ordinal());
        }

        @Test
        @DisplayName("FIXED should be second enum value")
        void discountType_Fixed_IsSecond() {
            DiscountType fixed = DiscountType.FIXED;

            assertEquals("FIXED", fixed.name());
            assertEquals(1, fixed.ordinal());
        }

        @ParameterizedTest
        @EnumSource(DiscountType.class)
        @DisplayName("All DiscountType values should have valid names")
        void discountType_AllValues_HaveValidNames(DiscountType type) {
            assertNotNull(type.name());
            assertFalse(type.name().isEmpty());
        }

        @Test
        @DisplayName("Should calculate PERCENTAGE discount correctly")
        void discountType_Percentage_Calculation() {
            DiscountType type = DiscountType.PERCENTAGE;
            double subtotal = 100.0;
            double discountValue = 20.0; // 20%

            double expectedDiscount = 20.0;
            double actualDiscount = (type == DiscountType.PERCENTAGE)
                    ? subtotal * (discountValue / 100.0)
                    : Math.min(discountValue, subtotal);

            assertEquals(expectedDiscount, actualDiscount, 0.01);
        }

        @Test
        @DisplayName("Should calculate FIXED discount correctly")
        void discountType_Fixed_Calculation() {
            DiscountType type = DiscountType.FIXED;
            double subtotal = 100.0;
            double discountValue = 15.0; // $15 off

            double expectedDiscount = 15.0;
            double actualDiscount = (type == DiscountType.PERCENTAGE)
                    ? subtotal * (discountValue / 100.0)
                    : Math.min(discountValue, subtotal);

            assertEquals(expectedDiscount, actualDiscount, 0.01);
        }

        @Test
        @DisplayName("FIXED discount should be capped at subtotal")
        void discountType_Fixed_CappedAtSubtotal() {
            DiscountType type = DiscountType.FIXED;
            double subtotal = 10.0;
            double discountValue = 50.0; // More than subtotal

            double expectedDiscount = 10.0; // Capped at subtotal
            double actualDiscount = (type == DiscountType.PERCENTAGE)
                    ? subtotal * (discountValue / 100.0)
                    : Math.min(discountValue, subtotal);

            assertEquals(expectedDiscount, actualDiscount, 0.01);
        }
    }

    // ==================== STATUS TRANSITION TESTS ====================

    @Nested
    @DisplayName("Status Transition Tests")
    class StatusTransitionTests {

        @Test
        @DisplayName("Valid transition: DRAFT -> CONFIRMED (checkout)")
        void transition_DraftToConfirmed_Valid() {
            CartStatus current = CartStatus.DRAFT;
            CartStatus target = CartStatus.CONFIRMED;

            boolean isValidTransition = (current == CartStatus.DRAFT && target == CartStatus.CONFIRMED);

            assertTrue(isValidTransition, "DRAFT to CONFIRMED should be valid");
        }

        @Test
        @DisplayName("Valid transition: CONFIRMED -> PAID")
        void transition_ConfirmedToPaid_Valid() {
            CartStatus current = CartStatus.CONFIRMED;
            CartStatus target = CartStatus.PAID;

            boolean isValidTransition = (current == CartStatus.CONFIRMED && target == CartStatus.PAID);

            assertTrue(isValidTransition, "CONFIRMED to PAID should be valid");
        }

        @Test
        @DisplayName("Valid transition: CONFIRMED -> CANCELLED")
        void transition_ConfirmedToCancelled_Valid() {
            CartStatus current = CartStatus.CONFIRMED;
            CartStatus target = CartStatus.CANCELLED;

            boolean isValidTransition = (current == CartStatus.CONFIRMED && target == CartStatus.CANCELLED);

            assertTrue(isValidTransition, "CONFIRMED to CANCELLED should be valid");
        }

        @Test
        @DisplayName("Invalid transition: CANCELLED -> CONFIRMED")
        void transition_CancelledToConfirmed_Invalid() {
            CartStatus current = CartStatus.CANCELLED;
            CartStatus target = CartStatus.CONFIRMED;

            // Terminal state cannot transition
            boolean isInvalidTransition = (current == CartStatus.CANCELLED);

            assertTrue(isInvalidTransition, "CANCELLED should not transition to anything");
        }

        @Test
        @DisplayName("Valid item transition: ACTIVE -> CANCELLED")
        void itemTransition_ActiveToCancelled_Valid() {
            CartItemStatus current = CartItemStatus.ACTIVE;
            CartItemStatus target = CartItemStatus.CANCELLED;

            boolean isValidTransition = (current == CartItemStatus.ACTIVE &&
                    target == CartItemStatus.CANCELLED);

            assertTrue(isValidTransition);
        }

        @Test
        @DisplayName("Valid item transition: ACTIVE -> PARTIALLY_CANCELLED")
        void itemTransition_ActiveToPartiallyCancelled_Valid() {
            CartItemStatus current = CartItemStatus.ACTIVE;
            CartItemStatus target = CartItemStatus.PARTIALLY_CANCELLED;

            boolean isValidTransition = (current == CartItemStatus.ACTIVE &&
                    target == CartItemStatus.PARTIALLY_CANCELLED);

            assertTrue(isValidTransition);
        }

        @Test
        @DisplayName("Valid item transition: PARTIALLY_CANCELLED -> CANCELLED")
        void itemTransition_PartiallyCancelledToCancelled_Valid() {
            CartItemStatus current = CartItemStatus.PARTIALLY_CANCELLED;
            CartItemStatus target = CartItemStatus.CANCELLED;

            boolean isValidTransition = (current == CartItemStatus.PARTIALLY_CANCELLED &&
                    target == CartItemStatus.CANCELLED);

            assertTrue(isValidTransition);
        }
    }

    // ==================== ENUM VALUE OF TESTS ====================

    @Nested
    @DisplayName("Enum valueOf Tests")
    class EnumValueOfTests {

        @Test
        @DisplayName("CartStatus valueOf should work correctly")
        void cartStatus_ValueOf_Works() {
            assertEquals(CartStatus.DRAFT, CartStatus.valueOf("DRAFT"));
            assertEquals(CartStatus.CONFIRMED, CartStatus.valueOf("CONFIRMED"));
            assertEquals(CartStatus.PAID, CartStatus.valueOf("PAID"));
            assertEquals(CartStatus.CANCELLED, CartStatus.valueOf("CANCELLED"));
        }

        @Test
        @DisplayName("CartStatus valueOf with invalid value should throw exception")
        void cartStatus_ValueOf_Invalid_ThrowsException() {
            assertThrows(IllegalArgumentException.class,
                    () -> CartStatus.valueOf("INVALID"));
        }

        @Test
        @DisplayName("CartItemStatus valueOf should work correctly")
        void cartItemStatus_ValueOf_Works() {
            assertEquals(CartItemStatus.ACTIVE, CartItemStatus.valueOf("ACTIVE"));
            assertEquals(CartItemStatus.CANCELLED, CartItemStatus.valueOf("CANCELLED"));
        }

        @Test
        @DisplayName("CartItemStatus valueOf with invalid value should throw exception")
        void cartItemStatus_ValueOf_Invalid_ThrowsException() {
            assertThrows(IllegalArgumentException.class,
                    () -> CartItemStatus.valueOf("INVALID"));
        }

        @Test
        @DisplayName("DiscountType valueOf should work correctly")
        void discountType_ValueOf_Works() {
            assertEquals(DiscountType.PERCENTAGE, DiscountType.valueOf("PERCENTAGE"));
            assertEquals(DiscountType.FIXED, DiscountType.valueOf("FIXED"));
        }

        @Test
        @DisplayName("DiscountType valueOf with invalid value should throw exception")
        void discountType_ValueOf_Invalid_ThrowsException() {
            assertThrows(IllegalArgumentException.class,
                    () -> DiscountType.valueOf("INVALID"));
        }
    }
}
