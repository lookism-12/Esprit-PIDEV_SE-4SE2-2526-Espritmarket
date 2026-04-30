package esprit_market.service.SAVService;

import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.Enum.userEnum.Role;
import esprit_market.dto.SAV.DeliveryRequestDTO;
import esprit_market.dto.SAV.DeliveryResponseDTO;
import esprit_market.entity.SAV.Delivery;
import esprit_market.entity.cart.Cart;
import esprit_market.entity.cart.Order;
import esprit_market.entity.user.User;
import esprit_market.mappers.SAVMapper;
import esprit_market.repository.SAVRepository.DeliveryRepository;
import esprit_market.repository.cartRepository.CartRepository;
import esprit_market.repository.cartRepository.OrderRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.cartService.OrderDeliveryEligibility;
import esprit_market.service.notificationService.NotificationService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryService implements IDeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final SAVMapper savMapper;
    private final NotificationService notificationService;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String formatOrderNumber(Delivery d) {
        if (d.getCartId() == null) return "ORD-UNKNOWN";
        String shortHex = d.getCartId().toHexString().substring(0, Math.min(5, d.getCartId().toHexString().length())).toUpperCase();
        int year = d.getDeliveryDate() != null ? d.getDeliveryDate().getYear() : java.time.LocalDateTime.now().getYear();
        return String.format("ORD-%d-%s", year, shortHex);
    }

    private String getDriverFullName(User driver) {
        return (driver.getFirstName() != null ? driver.getFirstName() : "") + " " +
               (driver.getLastName() != null ? driver.getLastName() : "");
    }

    private String generateDeliveryConfirmationCode() {
        return String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
    }

    private boolean ensureDeliveryConfirmationCode(Delivery delivery) {
        if (delivery == null) {
            return false;
        }
        if (delivery.getDeliveryConfirmationCode() != null && !delivery.getDeliveryConfirmationCode().isBlank()) {
            return false;
        }
        delivery.setDeliveryConfirmationCode(generateDeliveryConfirmationCode());
        return true;
    }

    private Delivery saveWithConfirmationCodeIfMissing(Delivery delivery) {
        if (ensureDeliveryConfirmationCode(delivery)) {
            return deliveryRepository.save(delivery);
        }
        return delivery;
    }

    private DeliveryResponseDTO toDeliveryResponseWithCode(Delivery delivery) {
        return savMapper.toDeliveryResponse(saveWithConfirmationCodeIfMissing(delivery));
    }

    private Optional<Order> resolveLinkedOrder(Delivery delivery) {
        if (delivery == null) {
            return Optional.empty();
        }
        if (delivery.getOrderId() != null) {
            Optional<Order> order = orderRepository.findById(delivery.getOrderId());
            if (order.isPresent()) {
                return order;
            }
        }
        if (delivery.getCartId() != null) {
            return orderRepository.findAllByCartId(delivery.getCartId()).stream().findFirst();
        }
        return Optional.empty();
    }

    private void syncOrderStatusFromDelivery(Delivery delivery, OrderStatus status) {
        resolveLinkedOrder(delivery).ifPresent(order -> {
            if (order.getStatus() == OrderStatus.RESTOCKED || order.getStatus() == OrderStatus.CANCELLED) {
                return;
            }
            if (order.getStatus() == OrderStatus.DELIVERED && status != OrderStatus.DELIVERED) {
                return;
            }
            order.setStatus(status);
            order.setLastUpdated(LocalDateTime.now());
            if (status == OrderStatus.DELIVERED) {
                order.setDeliveredAt(LocalDateTime.now());
                if (order.getPaymentStatus() == esprit_market.Enum.cartEnum.PaymentStatus.PENDING_PAYMENT) {
                    order.setPaymentStatus(esprit_market.Enum.cartEnum.PaymentStatus.PAID);
                    order.setPaidAt(LocalDateTime.now());
                }
            }
            if (status == OrderStatus.RETURNED) {
                order.setReturnedAt(LocalDateTime.now());
            }
            if (order.getDeliveryId() == null && delivery.getId() != null) {
                order.setDeliveryId(delivery.getId());
            }
            orderRepository.save(order);
        });
    }

    // ─── Existing CRUD ────────────────────────────────────────────────────────

    private Optional<Order> resolveOrderForDelivery(Delivery delivery) {
        if (delivery == null) {
            return Optional.empty();
        }

        if (delivery.getOrderId() != null) {
            Optional<Order> order = orderRepository.findById(delivery.getOrderId());
            if (order.isPresent()) {
                return order;
            }
        }

        if (delivery.getCartId() != null) {
            return orderRepository.findAllByCartId(delivery.getCartId()).stream()
                    .filter(OrderDeliveryEligibility::isEligibleForDelivery)
                    .findFirst();
        }

        return Optional.empty();
    }

    private Optional<Delivery> findExistingDeliveryForOrder(Order order) {
        if (order.getDeliveryId() != null) {
            Optional<Delivery> delivery = deliveryRepository.findById(order.getDeliveryId());
            if (delivery.isPresent()) {
                return delivery;
            }
        }

        Optional<Delivery> byOrderId = deliveryRepository.findByOrderId(order.getId());
        if (byOrderId.isPresent()) {
            return byOrderId;
        }

        if (order.getCartId() != null) {
            return deliveryRepository.findByCartId(order.getCartId()).stream().findFirst();
        }

        return Optional.empty();
    }

    private void syncEligibleOrdersIntoDeliveries() {
        orderRepository.findAll().stream()
                .filter(OrderDeliveryEligibility::isEligibleForDelivery)
                .forEach(this::ensureDeliveryExistsForOrder);
    }

    private List<Order> findEligibleOrdersForDelivery() {
        List<Order> cardOrders = orderRepository.findByPaymentMethodIn(
                OrderDeliveryEligibility.cardPaymentMethods()
        );
        List<Order> confirmedCashOrders = orderRepository.findByPaymentMethodInAndStatus(
                OrderDeliveryEligibility.cashPaymentMethods(),
                OrderStatus.CONFIRMED
        );

        Map<ObjectId, Order> eligibleOrdersById = new HashMap<>();
        cardOrders.forEach(order -> eligibleOrdersById.put(order.getId(), order));
        confirmedCashOrders.forEach(order -> eligibleOrdersById.put(order.getId(), order));
        return List.copyOf(eligibleOrdersById.values());
    }

    private void ensureDeliveryExistsForOrder(Order order) {
        Optional<Delivery> existingDelivery = findExistingDeliveryForOrder(order);

        if (existingDelivery.isPresent()) {
            Delivery delivery = existingDelivery.get();
            boolean changed = false;

            if (delivery.getOrderId() == null) {
                delivery.setOrderId(order.getId());
                changed = true;
            }

            if (delivery.getCartId() == null && order.getCartId() != null) {
                delivery.setCartId(order.getCartId());
                changed = true;
            }

            if ((delivery.getAddress() == null || delivery.getAddress().isBlank())
                    && order.getShippingAddress() != null) {
                delivery.setAddress(order.getShippingAddress());
                changed = true;
            }

            if (ensureDeliveryConfirmationCode(delivery)) {
                changed = true;
            }

            if (changed) {
                deliveryRepository.save(delivery);
            }

            if (order.getDeliveryId() == null) {
                order.setDeliveryId(delivery.getId());
                orderRepository.save(order);
            }
            return;
        }

        Delivery delivery = Delivery.builder()
                .address(order.getShippingAddress())
                .deliveryDate(order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now())
                .status("PREPARING")
                .cartId(order.getCartId())
                .orderId(order.getId())
                .deliveryConfirmationCode(generateDeliveryConfirmationCode())
                .build();

        Delivery savedDelivery = deliveryRepository.save(delivery);
        order.setDeliveryId(savedDelivery.getId());
        orderRepository.save(order);
    }

    private Map<ObjectId, Order> mapEligibleOrdersById(List<Order> eligibleOrders) {
        Map<ObjectId, Order> ordersById = new HashMap<>();
        for (Order order : eligibleOrders) {
            if (order.getId() != null) {
                ordersById.put(order.getId(), order);
            }
        }
        return ordersById;
    }

    private Map<ObjectId, Order> mapEligibleOrdersByCartId(List<Order> eligibleOrders) {
        Map<ObjectId, Order> ordersByCartId = new HashMap<>();
        for (Order order : eligibleOrders) {
            if (order.getCartId() != null) {
                ordersByCartId.putIfAbsent(order.getCartId(), order);
            }
        }
        return ordersByCartId;
    }

    private boolean isDeliveryLinkedToEligibleOrder(
            Delivery delivery,
            Map<ObjectId, Order> eligibleOrdersById,
            Map<ObjectId, Order> eligibleOrdersByCartId
    ) {
        if (delivery.getOrderId() != null) {
            return eligibleOrdersById.containsKey(delivery.getOrderId());
        }

        return delivery.getCartId() != null
                && eligibleOrdersByCartId.containsKey(delivery.getCartId());
    }

    private void syncEligibleOrdersIntoDeliveries(List<Order> eligibleOrders, List<Delivery> deliveries) {
        Map<ObjectId, Delivery> deliveriesById = new HashMap<>();
        Map<ObjectId, Delivery> deliveriesByOrderId = new HashMap<>();
        Map<ObjectId, Delivery> deliveriesByCartId = new HashMap<>();

        for (Delivery delivery : deliveries) {
            if (delivery.getId() != null) {
                deliveriesById.put(delivery.getId(), delivery);
            }
            if (delivery.getOrderId() != null) {
                deliveriesByOrderId.putIfAbsent(delivery.getOrderId(), delivery);
            }
            if (delivery.getCartId() != null) {
                deliveriesByCartId.putIfAbsent(delivery.getCartId(), delivery);
            }
        }

        Set<ObjectId> updatedOrderIds = new HashSet<>();
        for (Order order : eligibleOrders) {
            Delivery delivery = null;

            if (order.getDeliveryId() != null) {
                delivery = deliveriesById.get(order.getDeliveryId());
            }
            if (delivery == null && order.getId() != null) {
                delivery = deliveriesByOrderId.get(order.getId());
            }
            if (delivery == null && order.getCartId() != null) {
                delivery = deliveriesByCartId.get(order.getCartId());
            }

            if (delivery == null) {
                delivery = Delivery.builder()
                        .address(order.getShippingAddress())
                        .deliveryDate(order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now())
                        .status("PREPARING")
                        .cartId(order.getCartId())
                        .orderId(order.getId())
                        .deliveryConfirmationCode(generateDeliveryConfirmationCode())
                        .build();

                Delivery savedDelivery = deliveryRepository.save(delivery);
                deliveries.add(savedDelivery);
                deliveriesById.put(savedDelivery.getId(), savedDelivery);
                if (savedDelivery.getOrderId() != null) {
                    deliveriesByOrderId.putIfAbsent(savedDelivery.getOrderId(), savedDelivery);
                }
                if (savedDelivery.getCartId() != null) {
                    deliveriesByCartId.putIfAbsent(savedDelivery.getCartId(), savedDelivery);
                }

                order.setDeliveryId(savedDelivery.getId());
                orderRepository.save(order);
                updatedOrderIds.add(order.getId());
                continue;
            }

            boolean deliveryChanged = false;
            if (delivery.getOrderId() == null && order.getId() != null) {
                delivery.setOrderId(order.getId());
                deliveriesByOrderId.putIfAbsent(order.getId(), delivery);
                deliveryChanged = true;
            }
            if (delivery.getCartId() == null && order.getCartId() != null) {
                delivery.setCartId(order.getCartId());
                deliveriesByCartId.putIfAbsent(order.getCartId(), delivery);
                deliveryChanged = true;
            }
            if ((delivery.getAddress() == null || delivery.getAddress().isBlank())
                    && order.getShippingAddress() != null) {
                delivery.setAddress(order.getShippingAddress());
                deliveryChanged = true;
            }
            if (ensureDeliveryConfirmationCode(delivery)) {
                deliveryChanged = true;
            }
            if (deliveryChanged) {
                deliveryRepository.save(delivery);
            }

            if (order.getDeliveryId() == null && delivery.getId() != null && !updatedOrderIds.contains(order.getId())) {
                order.setDeliveryId(delivery.getId());
                orderRepository.save(order);
                updatedOrderIds.add(order.getId());
            }
        }
    }

    @Override
    public DeliveryResponseDTO createDelivery(DeliveryRequestDTO request) {
        User assignedUser = userRepository.findById(new ObjectId(request.getUserId()))
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable avec l'ID: " + request.getUserId()));
        if (assignedUser.getRoles() == null ||
                (!assignedUser.getRoles().contains(Role.DELIVERY) && !assignedUser.getRoles().contains(Role.ADMIN))) {
            throw new RuntimeException("L'utilisateur assigné doit obligatoirement avoir le rôle DELIVERY ou ADMIN.");
        }
        if (!cartRepository.existsById(new ObjectId(request.getCartId()))) {
            throw new RuntimeException("Panier (Cart) introuvable avec l'ID: " + request.getCartId());
        }
        Delivery delivery = savMapper.toDeliveryEntity(request);
        delivery.setStatus("PREPARING");
        ensureDeliveryConfirmationCode(delivery);
        return savMapper.toDeliveryResponse(deliveryRepository.save(delivery));
    }

    @Override
    public DeliveryResponseDTO getDeliveryById(String id) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID: " + id));
        return toDeliveryResponseWithCode(delivery);
    }

    @Override
    public List<DeliveryResponseDTO> getAllDeliveries() {
        try {
            List<Order> eligibleOrders = findEligibleOrdersForDelivery();

            List<Delivery> deliveries = deliveryRepository.findAll();

            Map<ObjectId, Order> eligibleOrdersById = mapEligibleOrdersById(eligibleOrders);
            Map<ObjectId, Order> eligibleOrdersByCartId = mapEligibleOrdersByCartId(eligibleOrders);
            System.out.println("📦 Found " + deliveries.size() + " deliveries in database");
            
            return deliveries.stream()
                    .filter(delivery -> isDeliveryLinkedToEligibleOrder(
                            delivery,
                            eligibleOrdersById,
                            eligibleOrdersByCartId
                    ))
                    .map(delivery -> {
                        try {
                            return toDeliveryResponseWithCode(delivery);
                        } catch (Exception e) {
                            System.err.println("❌ Error mapping delivery with ID: " + 
                                (delivery.getId() != null ? delivery.getId().toHexString() : "null"));
                            System.err.println("   Delivery data: userId=" + delivery.getUserId() + 
                                ", cartId=" + delivery.getCartId() + 
                                ", status=" + delivery.getStatus());
                            System.err.println("   Error: " + e.getMessage());
                            e.printStackTrace();
                            // Return null for problematic deliveries, filter them out later
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("❌ Fatal error in getAllDeliveries: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch deliveries: " + e.getMessage(), e);
        }
    }

    @Override
    public List<DeliveryResponseDTO> getDeliveriesByUser(String userId) {
        return deliveryRepository.findByUserId(new ObjectId(userId)).stream()
                .map(this::toDeliveryResponseWithCode)
                .collect(Collectors.toList());
    }

    @Override
    public List<DeliveryResponseDTO> getDriverWorklist(String driverId) {
        ObjectId driverObjectId = new ObjectId(driverId);
        return deliveryRepository.findByUserIdOrPendingDriverId(driverObjectId, driverObjectId).stream()
                .map(this::toDeliveryResponseWithCode)
                .collect(Collectors.toList());
    }

    @Override
    public List<DeliveryResponseDTO> getDeliveriesByCart(String cartId) {
        return deliveryRepository.findByCartId(new ObjectId(cartId)).stream()
                .map(this::toDeliveryResponseWithCode)
                .collect(Collectors.toList());
    }

    @Override
    public List<DeliveryResponseDTO> getDeliveriesByStatus(String status) {
        return deliveryRepository.findByStatus(status).stream()
                .map(this::toDeliveryResponseWithCode)
                .collect(Collectors.toList());
    }

    @Override
    public DeliveryResponseDTO updateDelivery(String id, DeliveryRequestDTO request) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID: " + id));
        User assignedUser = userRepository.findById(new ObjectId(request.getUserId()))
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable avec l'ID: " + request.getUserId()));
        if (assignedUser.getRoles() == null ||
                (!assignedUser.getRoles().contains(Role.DELIVERY) && !assignedUser.getRoles().contains(Role.ADMIN))) {
            throw new RuntimeException("L'utilisateur assigné doit obligatoirement avoir le rôle DELIVERY ou ADMIN.");
        }
        if (delivery.getCartId() == null || !delivery.getCartId().toHexString().equals(request.getCartId())) {
            if (!cartRepository.existsById(new ObjectId(request.getCartId()))) {
                throw new RuntimeException("Panier (Cart) introuvable avec l'ID: " + request.getCartId());
            }
            delivery.setCartId(new ObjectId(request.getCartId()));
        }
        delivery.setAddress(request.getAddress());
        delivery.setDeliveryDate(request.getDeliveryDate());
        if (request.getStatus() != null) delivery.setStatus(request.getStatus());
        delivery.setUserId(new ObjectId(request.getUserId()));
        ensureDeliveryConfirmationCode(delivery);
        return savMapper.toDeliveryResponse(deliveryRepository.save(delivery));
    }

    @Override
    public DeliveryResponseDTO updateDeliveryStatus(String id, String status) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID: " + id));
        if (("DELIVERED".equals(delivery.getStatus()) || "RETURNED".equals(delivery.getStatus()))
                && !delivery.getStatus().equals(status)) {
            throw new RuntimeException("Delivered and returned deliveries are locked and cannot be changed.");
        }
        delivery.setStatus(status);
        ensureDeliveryConfirmationCode(delivery);
        if ("RETURNED".equals(status)) {
            delivery.setReturnedAt(LocalDateTime.now());
            syncOrderStatusFromDelivery(delivery, OrderStatus.RETURNED);
        }
        if ("DELIVERED".equals(status)) {
            delivery.setDeliveredAt(LocalDateTime.now());
            syncOrderStatusFromDelivery(delivery, OrderStatus.DELIVERED);
        }
        return savMapper.toDeliveryResponse(deliveryRepository.save(delivery));
    }

    @Override
    public void deleteDelivery(String id) {
        if (!deliveryRepository.existsById(new ObjectId(id))) {
            throw new RuntimeException("Livraison introuvable avec l'ID: " + id);
        }
        deliveryRepository.deleteById(new ObjectId(id));
    }

    // ─── Driver Workflow ─────────────────────────────────────────────────────

    /**
     * ÉTAPE 2 — Admin assigne un livreur.
     * Définit pendingDriverId, envoie une notification au livreur avec tous les détails.
     */
    @Override
    public DeliveryResponseDTO assignDriver(String deliveryId, String driverId) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(deliveryId))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable: " + deliveryId));

        User driver = userRepository.findById(new ObjectId(driverId))
                .orElseThrow(() -> new RuntimeException("Livreur introuvable: " + driverId));

        if (driver.getRoles() == null || !driver.getRoles().contains(Role.DELIVERY)) {
            throw new RuntimeException("L'utilisateur n'a pas le rôle DELIVERY.");
        }

        if ("DELIVERED".equals(delivery.getStatus()) || "RETURNED".equals(delivery.getStatus())) {
            throw new RuntimeException("Cette livraison est finale et ne peut plus etre assignee.");
        }

        // Fetch cart for details (total amount, shipping address)
        String cartTotal = "N/A";
        String clientName = "Client";
        if (delivery.getCartId() != null) {
            cartRepository.findById(delivery.getCartId()).ifPresent(cart -> {
                // used in lambda below
            });
            Cart cart = cartRepository.findById(delivery.getCartId()).orElse(null);
            if (cart != null) {
                cartTotal = cart.getTotal() != null ? String.format("%.2f TND", cart.getTotal()) : "N/A";
                // Try to get client name from cart's userId
                if (cart.getUserId() != null) {
                    userRepository.findById(cart.getUserId()).ifPresent(client -> {
                        // Will use formatted below
                    });
                    User client = userRepository.findById(cart.getUserId()).orElse(null);
                    if (client != null) {
                        clientName = (client.getFirstName() != null ? client.getFirstName() : "") + " " +
                                     (client.getLastName() != null ? client.getLastName() : "");
                    }
                }
            }
        }

        // Mark as pending for driver
        delivery.setPendingDriverId(new ObjectId(driverId));
        delivery.setDeclineReason(null);
        delivery.setDeclinedByDriverId(null);
        ensureDeliveryConfirmationCode(delivery);
        deliveryRepository.save(delivery);

        // Build notification content for driver
        String orderNumber = formatOrderNumber(delivery);
        String title = "📦 New Delivery Assignment — " + orderNumber;
        String description = String.format(
            "You have been assigned a delivery!\n\n" +
            "📦 Order: %s\n" +
            "📍 Address: %s\n" +
            "👤 Client: %s\n" +
            "💰 Amount: %s\n\n" +
            "Please respond to this assignment in your driver dashboard.",
            orderNumber,
            delivery.getAddress(),
            clientName.trim().isEmpty() ? "Client" : clientName.trim(),
            cartTotal
        );

        notificationService.sendNotification(driver, title, description,
                NotificationType.INTERNAL_NOTIFICATION, deliveryId);

        return toDeliveryResponseWithCode(delivery);
    }

    /**
     * ÉTAPE 3A/3B — Livreur accepte ou refuse la course.
     */
    @Override
    public DeliveryResponseDTO respondToDelivery(String deliveryId, String driverId, boolean accepted, String declineReason) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(deliveryId))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable: " + deliveryId));

        User driver = userRepository.findById(new ObjectId(driverId))
                .orElseThrow(() -> new RuntimeException("Livreur introuvable: " + driverId));

        // Verify this driver is the one pending
        if (delivery.getPendingDriverId() == null ||
                !delivery.getPendingDriverId().toHexString().equals(driverId)) {
            throw new RuntimeException("Ce livreur n'est pas assigné à cette livraison.");
        }

        String orderNumber = formatOrderNumber(delivery);
        String driverName = getDriverFullName(driver).trim();

        if (accepted) {
            // ÉTAPE 3A — Accept
            delivery.setUserId(new ObjectId(driverId));
            delivery.setPendingDriverId(null);
            delivery.setStatus("IN_TRANSIT");
            deliveryRepository.save(delivery);

            // Notify all admins
            notificationService.notifyAllAdmins(
                "🚀 Driver Accepted — " + orderNumber,
                "Driver " + driverName + " accepted delivery " + orderNumber + " and is now IN TRANSIT.",
                NotificationType.INTERNAL_NOTIFICATION,
                deliveryId
            );
        } else {
            // ÉTAPE 3B — Decline
            String reason = (declineReason != null && !declineReason.isEmpty()) ? declineReason : "No reason provided";
            delivery.setDeclinedByDriverId(driverId);
            delivery.setDeclineReason(reason);
            delivery.setPendingDriverId(null);
            delivery.setUserId(null);  // Remove driver assignment
            delivery.setStatus("DRIVER_REFUSED");
            deliveryRepository.save(delivery);

            // Notify all admins — urgent red
            notificationService.notifyAllAdmins(
                "⚠️ Driver DECLINED — " + orderNumber,
                "Driver " + driverName + " declined delivery " + orderNumber + ". Reason: " + reason + " — Reassignment needed!",
                NotificationType.INTERNAL_NOTIFICATION,
                deliveryId
            );
        }

        return toDeliveryResponseWithCode(delivery);
    }

    /**
     * ÉTAPE 4 — Livreur confirme la livraison.
     */
    @Override
    public DeliveryResponseDTO markAsDelivered(String deliveryId, String driverId, String confirmationCode) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(deliveryId))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable: " + deliveryId));

        User driver = userRepository.findById(new ObjectId(driverId))
                .orElseThrow(() -> new RuntimeException("Livreur introuvable: " + driverId));

        // Verify this driver is assigned to this delivery
        if (delivery.getUserId() == null || !delivery.getUserId().toHexString().equals(driverId)) {
            throw new RuntimeException("Ce livreur n'est pas assigné à cette livraison.");
        }

        if ("RETURNED".equals(delivery.getStatus())) {
            throw new RuntimeException("Cette livraison est deja retournee et ne peut plus etre livree.");
        }
        if ("DELIVERED".equals(delivery.getStatus())) {
            return toDeliveryResponseWithCode(delivery);
        }

        ensureDeliveryConfirmationCode(delivery);
        String expectedCode = delivery.getDeliveryConfirmationCode();
        String providedCode = confirmationCode == null ? "" : confirmationCode.replaceAll("\\s+", "");
        if (providedCode.isBlank() || !providedCode.equals(expectedCode)) {
            throw new RuntimeException("Invalid delivery confirmation code.");
        }

        delivery.setStatus("DELIVERED");
        delivery.setDeliveredAt(LocalDateTime.now());
        delivery.setPendingDriverId(null);
        deliveryRepository.save(delivery);
        syncOrderStatusFromDelivery(delivery, OrderStatus.DELIVERED);

        String orderNumber = formatOrderNumber(delivery);
        String driverName = getDriverFullName(driver).trim();

        // Notify all admins
        notificationService.notifyAllAdmins(
            "📦 Order Delivered — " + orderNumber,
            "Order " + orderNumber + " was successfully delivered by " + driverName + ".",
            NotificationType.INTERNAL_NOTIFICATION,
            deliveryId
        );

        return toDeliveryResponseWithCode(delivery);
    }

    /**
     * ÉTAPE 4B — Livreur marque la livraison comme retournée (échec de livraison).
     */
    @Override
    public DeliveryResponseDTO markAsReturned(String deliveryId, String driverId, String reason) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(deliveryId))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable: " + deliveryId));

        User driver = userRepository.findById(new ObjectId(driverId))
                .orElseThrow(() -> new RuntimeException("Livreur introuvable: " + driverId));

        // Verify this driver is assigned to this delivery
        if (delivery.getUserId() == null || !delivery.getUserId().toHexString().equals(driverId)) {
            throw new RuntimeException("Ce livreur n'est pas assigné à cette livraison.");
        }

        if ("DELIVERED".equals(delivery.getStatus())) {
            throw new RuntimeException("Cette livraison est deja livree et ne peut plus etre retournee.");
        }
        if ("RETURNED".equals(delivery.getStatus())) {
            return toDeliveryResponseWithCode(delivery);
        }

        String returnReason = (reason != null && !reason.isEmpty()) ? reason : "Delivery failed";
        delivery.setStatus("RETURNED");
        delivery.setReturnedAt(LocalDateTime.now());
        delivery.setReturnReason(returnReason);
        delivery.setPendingDriverId(null);
        deliveryRepository.save(delivery);
        syncOrderStatusFromDelivery(delivery, OrderStatus.RETURNED);

        String orderNumber = formatOrderNumber(delivery);
        String driverName = getDriverFullName(driver).trim();

        // Notify all admins — urgent attention needed
        notificationService.notifyAllAdmins(
            "↩️ Delivery Returned — " + orderNumber,
            "Order " + orderNumber + " was returned by " + driverName + ". Reason: " + returnReason + " — Provider must verify and restock.",
            NotificationType.INTERNAL_NOTIFICATION,
            deliveryId
        );

        return toDeliveryResponseWithCode(delivery);
    }

    /**
     * Retourne les livraisons en attente de réponse pour un livreur donné.
     */
    @Override
    public List<DeliveryResponseDTO> getPendingForDriver(String driverId) {
        return deliveryRepository.findAll().stream()
                .filter(d -> d.getPendingDriverId() != null &&
                             d.getPendingDriverId().toHexString().equals(driverId))
                .map(this::toDeliveryResponseWithCode)
                .collect(Collectors.toList());
    }
}
