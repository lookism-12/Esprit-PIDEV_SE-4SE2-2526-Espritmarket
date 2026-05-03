package esprit_market.controller.gamification;

import esprit_market.dto.gamification.RewardDTO;
import esprit_market.entity.gamification.Reward;
import esprit_market.repository.gamification.RewardRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/rewards")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reward Management (Admin)", description = "Admin endpoints for managing wheel rewards")
@SecurityRequirement(name = "Bearer Authentication")
@PreAuthorize("hasRole('ADMIN')")
public class RewardManagementController {
    
    private final RewardRepository rewardRepository;
    
    /**
     * Get all rewards (including inactive)
     */
    @GetMapping
    @Operation(summary = "Get all rewards", description = "Get all rewards including inactive ones")
    public ResponseEntity<List<RewardDTO>> getAllRewards() {
        List<Reward> rewards = rewardRepository.findAll();
        List<RewardDTO> dtos = rewards.stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * Create new reward
     */
    @PostMapping
    @Operation(summary = "Create reward", description = "Create a new reward")
    public ResponseEntity<RewardDTO> createReward(@RequestBody RewardDTO dto) {
        Reward reward = Reward.builder()
            .label(dto.getLabel())
            .type(dto.getType())
            .value(dto.getValue())
            .probability(dto.getProbability())
            .active(dto.getActive() != null ? dto.getActive() : true)
            .color(dto.getColor())
            .icon(dto.getIcon())
            .description(dto.getDescription())
            .couponCode(dto.getCouponCode())
            .minOrderValue(dto.getMinOrderValue())
            .expiryDays(dto.getExpiryDays())
            .targetSegment(dto.getTargetSegment())
            .build();
        
        reward = rewardRepository.save(reward);
        log.info("Created new reward: {}", reward.getLabel());
        
        return ResponseEntity.ok(mapToDTO(reward));
    }
    
    /**
     * Update reward
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update reward", description = "Update an existing reward")
    public ResponseEntity<RewardDTO> updateReward(
            @PathVariable String id,
            @RequestBody RewardDTO dto) {
        
        ObjectId objectId = new ObjectId(id);
        Reward reward = rewardRepository.findById(objectId)
            .orElseThrow(() -> new RuntimeException("Reward not found"));
        
        reward.setLabel(dto.getLabel());
        reward.setType(dto.getType());
        reward.setValue(dto.getValue());
        reward.setProbability(dto.getProbability());
        reward.setActive(dto.getActive());
        reward.setColor(dto.getColor());
        reward.setIcon(dto.getIcon());
        reward.setDescription(dto.getDescription());
        reward.setCouponCode(dto.getCouponCode());
        reward.setMinOrderValue(dto.getMinOrderValue());
        reward.setExpiryDays(dto.getExpiryDays());
        reward.setTargetSegment(dto.getTargetSegment());
        
        reward = rewardRepository.save(reward);
        log.info("Updated reward: {}", reward.getLabel());
        
        return ResponseEntity.ok(mapToDTO(reward));
    }
    
    /**
     * Delete reward
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete reward", description = "Delete a reward")
    public ResponseEntity<Void> deleteReward(@PathVariable String id) {
        ObjectId objectId = new ObjectId(id);
        rewardRepository.deleteById(objectId);
        log.info("Deleted reward: {}", id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Toggle reward active status
     */
    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Toggle reward status", description = "Activate or deactivate a reward")
    public ResponseEntity<RewardDTO> toggleReward(@PathVariable String id) {
        ObjectId objectId = new ObjectId(id);
        Reward reward = rewardRepository.findById(objectId)
            .orElseThrow(() -> new RuntimeException("Reward not found"));
        
        reward.setActive(!reward.getActive());
        reward = rewardRepository.save(reward);
        
        log.info("Toggled reward {} to {}", reward.getLabel(), reward.getActive() ? "active" : "inactive");
        
        return ResponseEntity.ok(mapToDTO(reward));
    }
    
    private RewardDTO mapToDTO(Reward reward) {
        return RewardDTO.builder()
            .id(reward.getId().toHexString())
            .label(reward.getLabel())
            .type(reward.getType())
            .value(reward.getValue())
            .probability(reward.getProbability())
            .active(reward.getActive())
            .color(reward.getColor())
            .icon(reward.getIcon())
            .description(reward.getDescription())
            .couponCode(reward.getCouponCode())
            .minOrderValue(reward.getMinOrderValue())
            .expiryDays(reward.getExpiryDays())
            .targetSegment(reward.getTargetSegment())
            .build();
    }
}
