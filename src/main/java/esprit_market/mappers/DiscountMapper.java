package esprit_market.mappers;

import esprit_market.dto.DiscountCreateRequest;
import esprit_market.dto.DiscountResponse;
import esprit_market.dto.DiscountUpdateRequest;
import esprit_market.entity.cart.Discount;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.stream.Collectors;

@Component
public class DiscountMapper {
    
    /**
     * Convert entity to Response DTO with computed fields.
     */
    public DiscountResponse toResponse(Discount discount) {
        if (discount == null) return null;
        
        LocalDate today = LocalDate.now();
        boolean isExpired = discount.getEndDate() != null && discount.getEndDate().isBefore(today);
        boolean isCurrentlyActive = Boolean.TRUE.equals(discount.getActive()) &&
                                    (discount.getStartDate() == null || !discount.getStartDate().isAfter(today)) &&
                                    (discount.getEndDate() == null || !discount.getEndDate().isBefore(today));
        Integer daysUntilExpiration = null;
        if (discount.getEndDate() != null && !discount.getEndDate().isBefore(today)) {
            daysUntilExpiration = (int) ChronoUnit.DAYS.between(today, discount.getEndDate());
        }
        
        return DiscountResponse.builder()
            .id(discount.getId() != null ? discount.getId().toHexString() : null)
            .name(discount.getName())
            .description(discount.getDescription())
            .discountType(discount.getDiscountType())
            .discountValue(discount.getDiscountValue())
            .startDate(discount.getStartDate())
            .endDate(discount.getEndDate())
            .active(discount.getActive())
            .minCartAmount(discount.getMinCartAmount())
            .autoActivate(discount.getAutoActivate())
            .categoryIds(discount.getCategoryIds() != null ? 
                discount.getCategoryIds().stream()
                    .map(ObjectId::toHexString)
                    .collect(Collectors.toList()) : null)
            .isCurrentlyActive(isCurrentlyActive)
            .isExpired(isExpired)
            .daysUntilExpiration(daysUntilExpiration)
            .build();
    }
    
    /**
     * Convert CreateRequest to entity for new discount creation.
     */
    public Discount toEntity(DiscountCreateRequest request) {
        if (request == null) return null;
        
        return Discount.builder()
            .name(request.getName())
            .description(request.getDescription())
            .discountType(request.getDiscountType())
            .discountValue(request.getDiscountValue())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .active(true)
            .minCartAmount(request.getMinCartAmount())
            .autoActivate(request.getAutoActivate() != null ? request.getAutoActivate() : false)
            .categoryIds(request.getCategoryIds() != null ?
                request.getCategoryIds().stream()
                    .filter(this::isValidObjectId)
                    .map(ObjectId::new)
                    .collect(Collectors.toList()) : null)
            .build();
    }
    
    /**
     * Apply UpdateRequest fields to existing entity.
     */
    public void updateEntity(Discount existing, DiscountUpdateRequest request) {
        if (existing == null || request == null) return;
        
        if (request.getName() != null) existing.setName(request.getName());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
        if (request.getDiscountType() != null) existing.setDiscountType(request.getDiscountType());
        if (request.getDiscountValue() != null) existing.setDiscountValue(request.getDiscountValue());
        if (request.getStartDate() != null) existing.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) existing.setEndDate(request.getEndDate());
        if (request.getActive() != null) existing.setActive(request.getActive());
        if (request.getMinCartAmount() != null) existing.setMinCartAmount(request.getMinCartAmount());
        if (request.getAutoActivate() != null) existing.setAutoActivate(request.getAutoActivate());
        if (request.getCategoryIds() != null) {
            existing.setCategoryIds(request.getCategoryIds().stream()
                .filter(this::isValidObjectId)
                .map(ObjectId::new)
                .collect(Collectors.toList()));
        }
    }
    
    private boolean isValidObjectId(String id) {
        return id != null && !id.isEmpty() && id.length() == 24 && id.matches("[0-9a-fA-F]{24}");
    }
}
