package esprit_market.service.SAVService;

import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.Enum.userEnum.Role;
import esprit_market.dto.SAV.DeliveryRequestDTO;
import esprit_market.dto.SAV.DeliveryResponseDTO;
import esprit_market.entity.SAV.Delivery;
import esprit_market.entity.cart.Cart;
import esprit_market.entity.user.User;
import esprit_market.mappers.SAVMapper;
import esprit_market.repository.SAVRepository.DeliveryRepository;
import esprit_market.repository.cartRepository.CartRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.notificationService.NotificationService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryService implements IDeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
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

    // ─── Existing CRUD ────────────────────────────────────────────────────────

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
        return savMapper.toDeliveryResponse(deliveryRepository.save(delivery));
    }

    @Override
    public DeliveryResponseDTO getDeliveryById(String id) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID: " + id));
        return savMapper.toDeliveryResponse(delivery);
    }

    @Override
    public List<DeliveryResponseDTO> getAllDeliveries() {
        try {
            List<Delivery> deliveries = deliveryRepository.findAll();
            System.out.println("📦 Found " + deliveries.size() + " deliveries in database");
            
            return deliveries.stream()
                    .map(delivery -> {
                        try {
                            return savMapper.toDeliveryResponse(delivery);
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
                .map(savMapper::toDeliveryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<DeliveryResponseDTO> getDeliveriesByCart(String cartId) {
        return deliveryRepository.findByCartId(new ObjectId(cartId)).stream()
                .map(savMapper::toDeliveryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<DeliveryResponseDTO> getDeliveriesByStatus(String status) {
        return deliveryRepository.findByStatus(status).stream()
                .map(savMapper::toDeliveryResponse)
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
        return savMapper.toDeliveryResponse(deliveryRepository.save(delivery));
    }

    @Override
    public DeliveryResponseDTO updateDeliveryStatus(String id, String status) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID: " + id));
        delivery.setStatus(status);
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

        return savMapper.toDeliveryResponse(delivery);
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

        return savMapper.toDeliveryResponse(delivery);
    }

    /**
     * ÉTAPE 4 — Livreur confirme la livraison.
     */
    @Override
    public DeliveryResponseDTO markAsDelivered(String deliveryId, String driverId) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(deliveryId))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable: " + deliveryId));

        User driver = userRepository.findById(new ObjectId(driverId))
                .orElseThrow(() -> new RuntimeException("Livreur introuvable: " + driverId));

        // Verify this driver is assigned to this delivery
        if (delivery.getUserId() == null || !delivery.getUserId().toHexString().equals(driverId)) {
            throw new RuntimeException("Ce livreur n'est pas assigné à cette livraison.");
        }

        delivery.setStatus("DELIVERED");
        deliveryRepository.save(delivery);

        String orderNumber = formatOrderNumber(delivery);
        String driverName = getDriverFullName(driver).trim();

        // Notify all admins
        notificationService.notifyAllAdmins(
            "📦 Order Delivered — " + orderNumber,
            "Order " + orderNumber + " was successfully delivered by " + driverName + ".",
            NotificationType.INTERNAL_NOTIFICATION,
            deliveryId
        );

        return savMapper.toDeliveryResponse(delivery);
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

        delivery.setStatus("RETURNED");
        deliveryRepository.save(delivery);

        String orderNumber = formatOrderNumber(delivery);
        String driverName = getDriverFullName(driver).trim();
        String returnReason = (reason != null && !reason.isEmpty()) ? reason : "Delivery failed";

        // Notify all admins — urgent attention needed
        notificationService.notifyAllAdmins(
            "↩️ Delivery Returned — " + orderNumber,
            "Order " + orderNumber + " was returned by " + driverName + ". Reason: " + returnReason + " — Provider must verify and restock.",
            NotificationType.INTERNAL_NOTIFICATION,
            deliveryId
        );

        return savMapper.toDeliveryResponse(delivery);
    }

    /**
     * Retourne les livraisons en attente de réponse pour un livreur donné.
     */
    @Override
    public List<DeliveryResponseDTO> getPendingForDriver(String driverId) {
        return deliveryRepository.findAll().stream()
                .filter(d -> d.getPendingDriverId() != null &&
                             d.getPendingDriverId().toHexString().equals(driverId))
                .map(savMapper::toDeliveryResponse)
                .collect(Collectors.toList());
    }
}
