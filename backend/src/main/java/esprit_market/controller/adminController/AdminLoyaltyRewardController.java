package esprit_market.controller.adminController;

import esprit_market.dto.cartDto.LoyaltyRewardDTO;
import esprit_market.entity.cart.LoyaltyReward;
import esprit_market.repository.cartRepository.LoyaltyRewardRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin controller for managing loyalty rewards
 */
@RestController
@RequestMapping("/api/admin/loyalty/rewards")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Loyalty Rewards", description = "Manage loyalty reward tiers")
public class AdminLoyaltyRewardController {
    
    private final LoyaltyRewardRepository rewardRepository;
    
    /**
     * Get all rewards
     */
    @GetMapping
    @Operation(summary = "Get all rewards", description = "Returns all loyalty rewards")
    public ResponseEntity<List<LoyaltyRewardDTO>> getAllRewards() {
        List<LoyaltyReward> rewards = rewardRepository.findAllByOrderByDisplayOrderAsc();
        List<LoyaltyRewardDTO> dtos = rewards.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * Get reward by ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get reward by ID")
    public ResponseEntity<LoyaltyRewardDTO> getRewardById(@PathVariable String id) {
        LoyaltyReward reward = rewardRepository.findById(new ObjectId(id))
            .orElseThrow(() -> new RuntimeException("Reward not found"));
        return ResponseEntity.ok(toDTO(reward));
    }
    
    /**
     * Create new reward
     */
    @PostMapping
    @Operation(summary = "Create new reward", description = "Creates a new loyalty reward tier")
    public ResponseEntity<LoyaltyRewardDTO> createReward(
            @Valid @RequestBody LoyaltyRewardDTO dto,
            Authentication authentication) {
        
        LoyaltyReward reward = LoyaltyReward.builder()
            .name(dto.getName())
            .description(dto.getDescription())
            .pointsRequired(dto.getPointsRequired())
            .rewardType(dto.getRewardType())
            .rewardValue(dto.getRewardValue())
            .maxDiscountAmount(dto.getMaxDiscountAmount())
            .minOrderAmount(dto.getMinOrderAmount())
            .validityDays(dto.getValidityDays())
            .active(dto.getActive() != null ? dto.getActive() : true)
            .displayOrder(dto.getDisplayOrder())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .createdBy(authentication.getName())
            .build();
        
        LoyaltyReward saved = rewardRepository.save(reward);
        log.info("✅ Admin {} created reward: {}", authentication.getName(), saved.getName());
        
        return ResponseEntity.ok(toDTO(saved));
    }
    
    /**
     * Update reward
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update reward", description = "Updates an existing loyalty reward")
    public ResponseEntity<LoyaltyRewardDTO> updateReward(
            @PathVariable String id,
            @Valid @RequestBody LoyaltyRewardDTO dto,
            Authentication authentication) {
        
        LoyaltyReward reward = rewardRepository.findById(new ObjectId(id))
            .orElseThrow(() -> new RuntimeException("Reward not found"));
        
        reward.setName(dto.getName());
        reward.setDescription(dto.getDescription());
        reward.setPointsRequired(dto.getPointsRequired());
        reward.setRewardType(dto.getRewardType());
        reward.setRewardValue(dto.getRewardValue());
        reward.setMaxDiscountAmount(dto.getMaxDiscountAmount());
        reward.setMinOrderAmount(dto.getMinOrderAmount());
        reward.setValidityDays(dto.getValidityDays());
        reward.setActive(dto.getActive());
        reward.setDisplayOrder(dto.getDisplayOrder());
        reward.setUpdatedAt(LocalDateTime.now());
        
        LoyaltyReward updated = rewardRepository.save(reward);
        log.info("✅ Admin {} updated reward: {}", authentication.getName(), updated.getName());
        
        return ResponseEntity.ok(toDTO(updated));
    }
    
    /**
     * Delete reward
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete reward", description = "Deletes a loyalty reward")
    public ResponseEntity<Void> deleteReward(
            @PathVariable String id,
            Authentication authentication) {
        
        LoyaltyReward reward = rewardRepository.findById(new ObjectId(id))
            .orElseThrow(() -> new RuntimeException("Reward not found"));
        
        rewardRepository.delete(reward);
        log.info("✅ Admin {} deleted reward: {}", authentication.getName(), reward.getName());
        
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Toggle reward active status
     */
    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Toggle reward status", description = "Activates or deactivates a reward")
    public ResponseEntity<LoyaltyRewardDTO> toggleRewardStatus(
            @PathVariable String id,
            Authentication authentication) {
        
        LoyaltyReward reward = rewardRepository.findById(new ObjectId(id))
            .orElseThrow(() -> new RuntimeException("Reward not found"));
        
        reward.setActive(!reward.getActive());
        reward.setUpdatedAt(LocalDateTime.now());
        
        LoyaltyReward updated = rewardRepository.save(reward);
        log.info("✅ Admin {} toggled reward {} to {}", 
                authentication.getName(), updated.getName(), updated.getActive() ? "ACTIVE" : "INACTIVE");
        
        return ResponseEntity.ok(toDTO(updated));
    }
    
    private LoyaltyRewardDTO toDTO(LoyaltyReward reward) {
        return LoyaltyRewardDTO.builder()
            .id(reward.getId().toHexString())
            .name(reward.getName())
            .description(reward.getDescription())
            .pointsRequired(reward.getPointsRequired())
            .rewardType(reward.getRewardType())
            .rewardValue(reward.getRewardValue())
            .maxDiscountAmount(reward.getMaxDiscountAmount())
            .minOrderAmount(reward.getMinOrderAmount())
            .validityDays(reward.getValidityDays())
            .active(reward.getActive())
            .displayOrder(reward.getDisplayOrder())
            .createdAt(reward.getCreatedAt())
            .updatedAt(reward.getUpdatedAt())
            .createdBy(reward.getCreatedBy())
            .build();
    }
}
