package esprit_market.service.SAVService;

import esprit_market.dto.SAV.SavFeedbackRequestDTO;
import esprit_market.dto.SAV.SavFeedbackResponseDTO;
import esprit_market.entity.SAV.SavFeedback;
import esprit_market.mappers.SAVMapper;
import esprit_market.repository.SAVRepository.SavFeedbackRepository;
import esprit_market.repository.cartRepository.OrderItemRepository;
import esprit_market.repository.cartRepository.OrderRepository;
import esprit_market.entity.cart.OrderItem;
import esprit_market.entity.cart.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavFeedbackService implements ISavFeedbackService {

    private final SavFeedbackRepository savFeedbackRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final SAVMapper savMapper;

    /**
     * Create a new SAV claim for a client
     */
    @Override
    public SavFeedbackResponseDTO createFeedback(SavFeedbackRequestDTO request) {
        log.info("Creating SAV feedback for cartItemId: {}", request.getCartItemId());
        
        if (!orderItemRepository.existsById(new ObjectId(request.getCartItemId()))) {
            throw new RuntimeException("OrderItem not found: " + request.getCartItemId());
        }
        
        SavFeedback feedback = savMapper.toSavFeedbackEntity(request);
        feedback.setReadByAdmin(false);
        feedback.setCreationDate(LocalDateTime.now());
        feedback.setStatus("PENDING");
        
        SavFeedback saved = savFeedbackRepository.save(feedback);
        log.info("SAV feedback created with ID: {}", saved.getId());
        
        return savMapper.toSavFeedbackResponse(saved);
    }

    /**
     * Get feedback by ID
     */
    @Override
    public SavFeedbackResponseDTO getFeedbackById(String id) {
        SavFeedback feedback = savFeedbackRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Feedback not found: " + id));
        return savMapper.toSavFeedbackResponse(feedback);
    }

    /**
     * Get all feedbacks (admin only)
     */
    @Override
    public List<SavFeedbackResponseDTO> getAllFeedbacks() {
        return savFeedbackRepository.findAll().stream()
                .map(savMapper::toSavFeedbackResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get feedbacks by CartItem
     */
    @Override
    public List<SavFeedbackResponseDTO> getFeedbacksByCartItem(String cartItemId) {
        return savFeedbackRepository.findByCartItemId(new ObjectId(cartItemId)).stream()
                .map(savMapper::toSavFeedbackResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get feedbacks by type (SAV or FEEDBACK)
     */
    @Override
    public List<SavFeedbackResponseDTO> getFeedbacksByType(String type) {
        return savFeedbackRepository.findByType(type).stream()
                .map(savMapper::toSavFeedbackResponse)
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
        SavFeedbackResponseDTO dto = savMapper.toSavFeedbackResponse(feedback);
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

    /**
     * Get SAV claims by user ID (client's own claims)
     */
    public List<SavFeedbackResponseDTO> getSavClaimsByUserId(String userId) {
        log.info("Fetching SAV claims for user: {}", userId);
        return savFeedbackRepository.findByUserIdAndType(new ObjectId(userId), "SAV").stream()
                .map(savMapper::toSavFeedbackResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get SAV claims by status
     */
    public List<SavFeedbackResponseDTO> getSavClaimsByStatus(String status) {
        return savFeedbackRepository.findByTypeAndStatus("SAV", status).stream()
                .map(savMapper::toSavFeedbackResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update feedback
     */
    @Override
    public SavFeedbackResponseDTO updateFeedback(String id, SavFeedbackRequestDTO request) {
        SavFeedback feedback = savFeedbackRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Feedback not found: " + id));
        
        if (!orderItemRepository.existsById(new ObjectId(request.getCartItemId()))) {
            throw new RuntimeException("OrderItem not found: " + request.getCartItemId());
        }
        
        feedback.setType(request.getType());
        feedback.setMessage(request.getMessage());
        feedback.setRating(request.getRating());
        feedback.setReason(request.getReason());
        feedback.setProblemNature(request.getProblemNature());
        feedback.setPriority(request.getPriority());
        feedback.setDesiredSolution(request.getDesiredSolution());
        feedback.setPositiveTags(request.getPositiveTags());
        feedback.setRecommendsProduct(request.getRecommendsProduct());
        feedback.setImageUrls(request.getImageUrls());
        feedback.setLastUpdatedDate(LocalDateTime.now());
        
        if (request.getStatus() != null) {
            feedback.setStatus(request.getStatus());
        }
        if (request.getAdminResponse() != null) {
            feedback.setAdminResponse(request.getAdminResponse());
        }
        if (request.getReadByAdmin() != null) {
            feedback.setReadByAdmin(request.getReadByAdmin());
        }
        
        feedback.setCartItemId(new ObjectId(request.getCartItemId()));
        
        return savMapper.toSavFeedbackResponse(savFeedbackRepository.save(feedback));
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
        
        return savMapper.toSavFeedbackResponse(savFeedbackRepository.save(feedback));
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
        
        return savMapper.toSavFeedbackResponse(savFeedbackRepository.save(feedback));
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
        
        return savMapper.toSavFeedbackResponse(savFeedbackRepository.save(feedback));
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
