package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.TunisianHoliday;
import esprit_market.config.Exceptions;
import esprit_market.dto.cartDto.AppliedPromotionDTO;
import esprit_market.dto.cartDto.EventPromotionRequest;
import esprit_market.dto.cartDto.EventPromotionResponse;
import esprit_market.entity.cart.EventPromotion;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.EventPromotionRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Event Promotion Service Implementation
 * 
 * Business Rules:
 * 1. Each provider has ONE event promotion configuration
 * 2. Holiday and birthday promotions are independent
 * 3. If both apply, use the BEST discount (highest value)
 * 4. Minimum order amounts are optional per promotion type
 * 5. Maximum discount caps are optional per promotion type
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventPromotionServiceImpl implements IEventPromotionService {
    
    private final EventPromotionRepository eventPromotionRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public EventPromotionResponse configureEventPromotion(EventPromotionRequest request, ObjectId providerId, ObjectId shopId) {
        log.info("Configuring event promotion for provider {} and shop {}", 
                providerId.toHexString(), shopId.toHexString());
        
        // Validate shop ownership
        var shop = shopRepository.findById(shopId)
                .filter(s -> s.getOwnerId().equals(providerId))
                .orElseThrow(() -> new Exceptions.AccessDeniedException("Shop does not belong to this provider"));
        
        // Validate holiday promotion configuration
        if (Boolean.TRUE.equals(request.getHolidayEnabled())) {
            if (request.getHolidayDiscountPercentage() == null || request.getHolidayDiscountPercentage() <= 0) {
                throw new IllegalArgumentException("Holiday discount percentage is required when holiday promotion is enabled");
            }
        }
        
        // Validate birthday promotion configuration
        if (Boolean.TRUE.equals(request.getBirthdayEnabled())) {
            if (request.getBirthdayDiscountPercentage() == null || request.getBirthdayDiscountPercentage() <= 0) {
                throw new IllegalArgumentException("Birthday discount percentage is required when birthday promotion is enabled");
            }
        }
        
        // Find existing configuration or create new
        EventPromotion eventPromotion = eventPromotionRepository.findByProviderId(providerId)
                .orElse(EventPromotion.builder()
                        .providerId(providerId)
                        .shopId(shopId)
                        .createdAt(LocalDateTime.now())
                        .build());
        
        // Update configuration
        eventPromotion.setHolidayEnabled(request.getHolidayEnabled());
        eventPromotion.setHolidayDiscountPercentage(request.getHolidayDiscountPercentage());
        eventPromotion.setHolidayMinOrderAmount(request.getHolidayMinOrderAmount());
        eventPromotion.setHolidayMaxDiscount(request.getHolidayMaxDiscount());
        
        eventPromotion.setBirthdayEnabled(request.getBirthdayEnabled());
        eventPromotion.setBirthdayDiscountPercentage(request.getBirthdayDiscountPercentage());
        eventPromotion.setBirthdayMinOrderAmount(request.getBirthdayMinOrderAmount());
        eventPromotion.setBirthdayMaxDiscount(request.getBirthdayMaxDiscount());
        
        eventPromotion.setUpdatedAt(LocalDateTime.now());
        
        EventPromotion saved = eventPromotionRepository.save(eventPromotion);
        log.info("Event promotion configured successfully for provider {}", providerId.toHexString());
        
        return toResponse(saved);
    }

    @Override
    public EventPromotionResponse getProviderEventPromotion(ObjectId providerId) {
        log.info("Fetching event promotion for provider: {}", providerId.toHexString());
        
        EventPromotion eventPromotion = eventPromotionRepository.findByProviderId(providerId)
                .orElse(createDefaultEventPromotion(providerId));
        
        return toResponse(eventPromotion);
    }

    @Override
    public EventPromotionResponse getShopEventPromotion(ObjectId shopId) {
        log.info("Fetching event promotion for shop: {}", shopId.toHexString());
        
        return eventPromotionRepository.findByShopId(shopId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    public AppliedPromotionDTO calculateBestEventDiscount(ObjectId shopId, ObjectId customerId, 
                                                          Double orderAmount, LocalDate orderDate) {
        log.info("Calculating best event discount for shop {} and customer {} with order amount {}", 
                shopId.toHexString(), customerId != null ? customerId.toHexString() : "guest", orderAmount);
        
        // Get shop's event promotion configuration
        EventPromotion eventPromotion = eventPromotionRepository.findByShopId(shopId)
                .orElse(null);
        
        if (eventPromotion == null) {
            log.info("No event promotion configuration found for shop {}", shopId.toHexString());
            return null;
        }
        
        Double holidayDiscount = 0.0;
        Double birthdayDiscount = 0.0;
        
        // Check holiday promotion
        if (TunisianHoliday.isHoliday(orderDate) && eventPromotion.isHolidayApplicable(orderAmount)) {
            holidayDiscount = eventPromotion.calculateHolidayDiscount(orderAmount);
            log.info("Holiday discount applicable: {} TND", holidayDiscount);
        }
        
        // Check birthday promotion
        if (customerId != null && isBirthdayOnDate(customerId, orderDate) && 
            eventPromotion.isBirthdayApplicable(orderAmount)) {
            birthdayDiscount = eventPromotion.calculateBirthdayDiscount(orderAmount);
            log.info("Birthday discount applicable: {} TND", birthdayDiscount);
        }
        
        // Apply BEST discount only
        if (holidayDiscount > 0 || birthdayDiscount > 0) {
            if (birthdayDiscount >= holidayDiscount) {
                log.info("Applying birthday discount: {} TND", birthdayDiscount);
                return AppliedPromotionDTO.builder()
                        .promotionType("BIRTHDAY")
                        .discountAmount(birthdayDiscount)
                        .discountPercentage(eventPromotion.getBirthdayDiscountPercentage())
                        .description(String.format("🎂 Birthday Special (-%s%%)", 
                                eventPromotion.getBirthdayDiscountPercentage().intValue()))
                        .promotionId(eventPromotion.getId().toHexString())
                        .promotionName("Birthday Promotion")
                        .build();
            } else {
                TunisianHoliday holiday = TunisianHoliday.getTodayHoliday();
                String holidayName = holiday != null ? holiday.getDisplayName() : "Holiday";
                log.info("Applying holiday discount: {} TND", holidayDiscount);
                return AppliedPromotionDTO.builder()
                        .promotionType("HOLIDAY")
                        .discountAmount(holidayDiscount)
                        .discountPercentage(eventPromotion.getHolidayDiscountPercentage())
                        .description(String.format("🎉 %s Discount (-%s%%)", 
                                holidayName, eventPromotion.getHolidayDiscountPercentage().intValue()))
                        .promotionId(eventPromotion.getId().toHexString())
                        .promotionName("Holiday Promotion")
                        .build();
            }
        }
        
        log.info("No event promotion applicable");
        return null;
    }

    @Override
    public boolean isTodayHoliday() {
        return TunisianHoliday.isTodayHoliday();
    }

    @Override
    public boolean isTodayCustomerBirthday(ObjectId customerId) {
        return isBirthdayOnDate(customerId, LocalDate.now());
    }
    
    // ==================== HELPER METHODS ====================
    
    private boolean isBirthdayOnDate(ObjectId customerId, LocalDate date) {
        User customer = userRepository.findById(customerId).orElse(null);
        
        if (customer == null || customer.getBirthDate() == null) {
            return false;
        }
        
        LocalDate birthDate = customer.getBirthDate();
        return birthDate.getMonth() == date.getMonth() && 
               birthDate.getDayOfMonth() == date.getDayOfMonth();
    }
    
    private EventPromotion createDefaultEventPromotion(ObjectId providerId) {
        return EventPromotion.builder()
                .providerId(providerId)
                .holidayEnabled(false)
                .birthdayEnabled(false)
                .build();
    }
    
    private EventPromotionResponse toResponse(EventPromotion eventPromotion) {
        String holidayDesc = formatHolidayDescription(eventPromotion);
        String birthdayDesc = formatBirthdayDescription(eventPromotion);
        
        return EventPromotionResponse.builder()
                .id(eventPromotion.getId() != null ? eventPromotion.getId().toHexString() : null)
                .providerId(eventPromotion.getProviderId().toHexString())
                .shopId(eventPromotion.getShopId() != null ? eventPromotion.getShopId().toHexString() : null)
                .holidayEnabled(eventPromotion.getHolidayEnabled())
                .holidayDiscountPercentage(eventPromotion.getHolidayDiscountPercentage())
                .holidayMinOrderAmount(eventPromotion.getHolidayMinOrderAmount())
                .holidayMaxDiscount(eventPromotion.getHolidayMaxDiscount())
                .holidayDescription(holidayDesc)
                .birthdayEnabled(eventPromotion.getBirthdayEnabled())
                .birthdayDiscountPercentage(eventPromotion.getBirthdayDiscountPercentage())
                .birthdayMinOrderAmount(eventPromotion.getBirthdayMinOrderAmount())
                .birthdayMaxDiscount(eventPromotion.getBirthdayMaxDiscount())
                .birthdayDescription(birthdayDesc)
                .createdAt(eventPromotion.getCreatedAt())
                .updatedAt(eventPromotion.getUpdatedAt())
                .build();
    }
    
    private String formatHolidayDescription(EventPromotion promo) {
        if (!Boolean.TRUE.equals(promo.getHolidayEnabled()) || promo.getHolidayDiscountPercentage() == null) {
            return "Not configured";
        }
        
        StringBuilder desc = new StringBuilder();
        desc.append(String.format("%s%% off on holidays", promo.getHolidayDiscountPercentage().intValue()));
        
        if (promo.getHolidayMinOrderAmount() != null) {
            desc.append(String.format(" (min order: %.0f TND)", promo.getHolidayMinOrderAmount()));
        }
        
        if (promo.getHolidayMaxDiscount() != null) {
            desc.append(String.format(" (max: %.0f TND)", promo.getHolidayMaxDiscount()));
        }
        
        return desc.toString();
    }
    
    private String formatBirthdayDescription(EventPromotion promo) {
        if (!Boolean.TRUE.equals(promo.getBirthdayEnabled()) || promo.getBirthdayDiscountPercentage() == null) {
            return "Not configured";
        }
        
        StringBuilder desc = new StringBuilder();
        desc.append(String.format("%s%% off on customer birthday", promo.getBirthdayDiscountPercentage().intValue()));
        
        if (promo.getBirthdayMinOrderAmount() != null) {
            desc.append(String.format(" (min order: %.0f TND)", promo.getBirthdayMinOrderAmount()));
        }
        
        if (promo.getBirthdayMaxDiscount() != null) {
            desc.append(String.format(" (max: %.0f TND)", promo.getBirthdayMaxDiscount()));
        }
        
        return desc.toString();
    }
}
