package esprit_market.service.SAVService;

import esprit_market.dto.SAV.SavFeedbackRequestDTO;
import esprit_market.dto.SAV.SavFeedbackResponseDTO;
import esprit_market.entity.SAV.SavFeedback;
import esprit_market.mappers.SAVMapper;
import esprit_market.repository.SAVRepository.SavFeedbackRepository;
import esprit_market.repository.cartRepository.OrderItemRepository;
import esprit_market.repository.cartRepository.OrderRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.entity.cart.OrderItem;
import esprit_market.entity.cart.Order;
import esprit_market.entity.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavFeedbackService implements ISavFeedbackService {

    private final SavFeedbackRepository savFeedbackRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final SAVMapper savMapper;
    /** Keyword-based urgency scorer — injected, stateless, no external APIs. */
    private final ClaimPriorityScorer priorityScorer;

    /**
     * Create a new SAV claim for a client
     */
    @Override
    public SavFeedbackResponseDTO createFeedback(SavFeedbackRequestDTO request) {
        log.info("Creating SAV feedback for cartItemId: {}", request.getCartItemId());
        
        validateClaimTarget(request);
        
        SavFeedback feedback = savMapper.toSavFeedbackEntity(request);
        feedback.setReadByAdmin(false);
        feedback.setCreationDate(LocalDateTime.now());
        feedback.setStatus("PENDING");

        // Compute keyword-based urgency score from message + reason + problemNature
        // SAV claims → negative keywords (urgency/frustration)
        // FEEDBACK   → positive keywords (satisfaction/enthusiasm)
        boolean isFeedback = "FEEDBACK".equalsIgnoreCase(request.getType());
        int score = isFeedback
                ? priorityScorer.computePositive(request.getMessage(), request.getReason(), request.getProblemNature())
                : priorityScorer.compute(request.getMessage(), request.getReason(), request.getProblemNature());
        feedback.setPriorityScore(score);
        // Auto-set priority label if the client did not supply one
        if (feedback.getPriority() == null || feedback.getPriority().isBlank()) {
            feedback.setPriority(priorityScorer.scoreToLabel(score));
        }
        
        SavFeedback saved = savFeedbackRepository.save(feedback);
        log.info("SAV feedback created with ID: {}", saved.getId());
        
        return toResponseWithNames(saved);
    }

    /**
     * Get feedback by ID
     */
    @Override
    public SavFeedbackResponseDTO getFeedbackById(String id) {
        SavFeedback feedback = savFeedbackRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Feedback not found: " + id));
        return toResponseWithNames(feedback);
    }

    /**
     * Get all feedbacks (admin only)
     */
    @Override
    public List<SavFeedbackResponseDTO> getAllFeedbacks() {
        return savFeedbackRepository.findAll().stream()
                .map(this::toResponseWithNames)
                .sorted(SMART_SORT)
                .collect(Collectors.toList());
    }

    /**
     * Get feedbacks by CartItem
     */
    @Override
    public List<SavFeedbackResponseDTO> getFeedbacksByCartItem(String cartItemId) {
        return savFeedbackRepository.findByCartItemId(new ObjectId(cartItemId)).stream()
                .map(this::toResponseWithNames)
                .collect(Collectors.toList());
    }

    /**
     * Get feedbacks by type (SAV or FEEDBACK)
     */
    @Override
    public List<SavFeedbackResponseDTO> getFeedbacksByType(String type) {
        return savFeedbackRepository.findByType(type).stream()
                .map(this::toResponseWithNames)
                .sorted(SMART_SORT)
                .collect(Collectors.toList());
    }

    /**
     * Get FEEDBACKs for a specific product
     */
    @Override
    public List<SavFeedbackResponseDTO> getFeedbacksByProductId(String productId) {
        // 1. Find all order items for this product
        List<ObjectId> orderItemIds = orderItemRepository.findByProductId(new ObjectId(productId))
                .stream()
                .map(esprit_market.entity.cart.OrderItem::getId)
                .collect(Collectors.toList());
        
        if (orderItemIds.isEmpty()) {
            return List.of();
        }
        
        // 2. Find feedbacks linked to these order items
        return savFeedbackRepository.findByCartItemIdInAndType(orderItemIds, "FEEDBACK").stream()
                .map(this::toResponseWithUserName)
                .collect(Collectors.toList());
    }

    private SavFeedbackResponseDTO toResponseWithUserName(SavFeedback feedback) {
        SavFeedbackResponseDTO dto = toResponseWithNames(feedback);
        try {
            if (feedback.getCartItemId() != null) {
                OrderItem orderItem = orderItemRepository.findById(feedback.getCartItemId()).orElse(null);
                if (orderItem != null && orderItem.getOrderId() != null) {
                    Order order = orderRepository.findById(orderItem.getOrderId()).orElse(null);
                    if (order != null && order.getUser() != null) {
                        dto.setUserName(order.getUser().getFirstName() + " " + order.getUser().getLastName());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch user name for feedback {}: {}", feedback.getId(), e.getMessage());
        }
        return dto;
    }

    private void validateClaimTarget(SavFeedbackRequestDTO request) {
        boolean deliveryAgentClaim = "DELIVERY_AGENT".equalsIgnoreCase(request.getTargetType());

        if (deliveryAgentClaim) {
            if (request.getDeliveryAgentId() == null || request.getDeliveryAgentId().isBlank()) {
                throw new RuntimeException("Delivery agent is required for delivery-agent claims");
            }
            if (!userRepository.existsById(new ObjectId(request.getDeliveryAgentId()))) {
                throw new RuntimeException("Delivery agent not found: " + request.getDeliveryAgentId());
            }
            if (request.getCartItemId() != null && !request.getCartItemId().isBlank()
                    && !orderItemRepository.existsById(new ObjectId(request.getCartItemId()))) {
                throw new RuntimeException("OrderItem not found: " + request.getCartItemId());
            }
            return;
        }

        if (request.getCartItemId() == null || request.getCartItemId().isBlank()) {
            throw new RuntimeException("OrderItem is required for product claims");
        }
        if (!orderItemRepository.existsById(new ObjectId(request.getCartItemId()))) {
            throw new RuntimeException("OrderItem not found: " + request.getCartItemId());
        }
    }

    // ── Sorting ───────────────────────────────────────────────────────────────

    /**
     * Comparator: priorityScore DESC (null → 0), then creationDate DESC.
     * Applied to every list endpoint so urgent claims always surface first.
     */
    private static final Comparator<SavFeedbackResponseDTO> SMART_SORT =
            Comparator.comparingInt((SavFeedbackResponseDTO d) ->
                            d.getPriorityScore() != null ? d.getPriorityScore() : 0)
                    .reversed()
                    .thenComparing(
                            Comparator.comparing(
                                    d -> d.getCreationDate() != null ? d.getCreationDate() : java.time.LocalDateTime.MIN,
                                    Comparator.reverseOrder()
                            )
                    );

    // ── Private helpers ───────────────────────────────────────────────────────

    private SavFeedbackResponseDTO toResponseWithNames(SavFeedback feedback) {
        SavFeedbackResponseDTO dto = savMapper.toSavFeedbackResponse(feedback);
        try {
            if (feedback.getUserId() != null) {
                userRepository.findById(feedback.getUserId())
                        .ifPresent(user -> dto.setUserName((user.getFirstName() + " " + user.getLastName()).trim()));
            }
            if (feedback.getDeliveryAgentId() != null) {
                userRepository.findById(feedback.getDeliveryAgentId())
                        .ifPresent(agent -> dto.setDeliveryAgentName((agent.getFirstName() + " " + agent.getLastName()).trim()));
            }
        } catch (Exception e) {
            log.warn("Failed to enrich SAV feedback {}: {}", feedback.getId(), e.getMessage());
        }
        return dto;
    }

    /**
     * Get SAV claims by user ID (client's own claims)
     */
    public List<SavFeedbackResponseDTO> getSavClaimsByUserId(String userId) {
        log.info("Fetching SAV claims for user: {}", userId);
        return savFeedbackRepository.findByUserIdAndType(new ObjectId(userId), "SAV").stream()
                .map(this::toResponseWithNames)
                .sorted(SMART_SORT)
                .collect(Collectors.toList());
    }

    /**
     * Get SAV claims by status
     */
    public List<SavFeedbackResponseDTO> getSavClaimsByStatus(String status) {
        return savFeedbackRepository.findByTypeAndStatus("SAV", status).stream()
                .map(this::toResponseWithNames)
                .sorted(SMART_SORT)
                .collect(Collectors.toList());
    }

    /**
     * Update feedback
     */
    @Override
    public SavFeedbackResponseDTO updateFeedback(String id, SavFeedbackRequestDTO request) {
        SavFeedback feedback = savFeedbackRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Feedback not found: " + id));
        
        validateClaimTarget(request);
        
        feedback.setType(request.getType());
        feedback.setMessage(request.getMessage());
        feedback.setRating(request.getRating() != null ? request.getRating() : feedback.getRating());
        feedback.setReason(request.getReason());
        feedback.setProblemNature(request.getProblemNature());
        feedback.setPriority(request.getPriority());
        feedback.setDesiredSolution(request.getDesiredSolution());
        feedback.setPositiveTags(request.getPositiveTags());
        feedback.setRecommendsProduct(request.getRecommendsProduct());
        feedback.setImageUrls(request.getImageUrls());
        feedback.setTargetType(request.getTargetType() != null && !request.getTargetType().isBlank() ? request.getTargetType() : "PRODUCT");
        feedback.setDeliveryAgentId(request.getDeliveryAgentId() != null && !request.getDeliveryAgentId().isBlank() ? new ObjectId(request.getDeliveryAgentId()) : null);
        feedback.setLastUpdatedDate(LocalDateTime.now());

        // Recompute priority score when content changes (branch by type)
        boolean isUpdatedFeedback = "FEEDBACK".equalsIgnoreCase(request.getType());
        int updatedScore = isUpdatedFeedback
                ? priorityScorer.computePositive(request.getMessage(), request.getReason(), request.getProblemNature())
                : priorityScorer.compute(request.getMessage(), request.getReason(), request.getProblemNature());
        feedback.setPriorityScore(updatedScore);
        if (request.getPriority() == null || request.getPriority().isBlank()) {
            feedback.setPriority(priorityScorer.scoreToLabel(updatedScore));
        }
        
        if (request.getStatus() != null) {
            feedback.setStatus(request.getStatus());
        }
        if (request.getAdminResponse() != null) {
            feedback.setAdminResponse(request.getAdminResponse());
        }
        if (request.getReadByAdmin() != null) {
            feedback.setReadByAdmin(request.getReadByAdmin());
        }
        
        feedback.setCartItemId(request.getCartItemId() != null && !request.getCartItemId().isBlank()
                ? new ObjectId(request.getCartItemId())
                : null);
        
        return toResponseWithNames(savFeedbackRepository.save(feedback));
    }

    /**
     * Update feedback status
     */
    @Override
    public SavFeedbackResponseDTO updateFeedbackStatus(String id, String status) {
        SavFeedback feedback = savFeedbackRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Feedback not found: " + id));
        
        feedback.setStatus(status);
        feedback.setLastUpdatedDate(LocalDateTime.now());
        
        // Mark as read by admin if status changes from PENDING
        if (!"PENDING".equalsIgnoreCase(status)) {
            feedback.setReadByAdmin(true);
        }
        
        // Set resolved date if status is RESOLVED
        if ("RESOLVED".equalsIgnoreCase(status)) {
            feedback.setResolvedDate(LocalDateTime.now());
        }
        
        return toResponseWithNames(savFeedbackRepository.save(feedback));
    }

    /**
     * Update admin response
     */
    @Override
    public SavFeedbackResponseDTO updateFeedbackAdminResponse(String id, String adminResponse) {
        SavFeedback feedback = savFeedbackRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Feedback not found: " + id));
        
        feedback.setAdminResponse(adminResponse);
        feedback.setReadByAdmin(true);
        feedback.setLastUpdatedDate(LocalDateTime.now());
        
        return toResponseWithNames(savFeedbackRepository.save(feedback));
    }

    /**
     * Update AI verification results
     */
    public SavFeedbackResponseDTO updateAiVerification(String id, Double similarityScore, String decision, String recommendation) {
        SavFeedback feedback = savFeedbackRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Feedback not found: " + id));
        
        feedback.setAiSimilarityScore(similarityScore);
        feedback.setAiDecision(decision);
        feedback.setAiRecommendation(recommendation);
        feedback.setLastUpdatedDate(LocalDateTime.now());
        
        return toResponseWithNames(savFeedbackRepository.save(feedback));
    }

    /**
     * Delete feedback
     */
    @Override
    public void deleteFeedback(String id) {
        if (!savFeedbackRepository.existsById(new ObjectId(id))) {
            throw new RuntimeException("Feedback not found: " + id);
        }
        savFeedbackRepository.deleteById(new ObjectId(id));
    }
}
