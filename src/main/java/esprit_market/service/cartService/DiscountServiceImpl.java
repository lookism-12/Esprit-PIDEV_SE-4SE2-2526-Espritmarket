package esprit_market.service.cartService;

import esprit_market.dto.DiscountCreateRequest;
import esprit_market.dto.DiscountResponse;
import esprit_market.dto.DiscountUpdateRequest;
import esprit_market.entity.cart.Discount;
import esprit_market.mappers.DiscountMapper;
import esprit_market.repository.cartRepository.DiscountRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscountServiceImpl implements IDiscountService {
    private final DiscountRepository repository;
    private final DiscountMapper mapper;

    // ==================== CREATE/UPDATE ====================

    @Override
    @Transactional
    public DiscountResponse save(DiscountCreateRequest request) {
        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getEndDate().isBefore(request.getStartDate())) {
                throw new IllegalArgumentException("End date must be after start date");
            }
        }
        
        Discount discount = mapper.toEntity(request);
        Discount saved = repository.save(discount);
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public DiscountResponse update(ObjectId id, DiscountUpdateRequest request) {
        Discount existing = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Discount not found"));
        
        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getEndDate().isBefore(request.getStartDate())) {
                throw new IllegalArgumentException("End date must be after start date");
            }
        }
        
        mapper.updateEntity(existing, request);
        Discount updated = repository.save(existing);
        return mapper.toResponse(updated);
    }

    // ==================== READ ====================

    @Override
    public List<DiscountResponse> findAll() {
        return repository.findAll().stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }

    @Override
    public DiscountResponse findById(ObjectId id) {
        Discount discount = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Discount not found"));
        return mapper.toResponse(discount);
    }
    
    @Override
    public List<DiscountResponse> findActiveDiscounts() {
        LocalDate today = LocalDate.now();
        return repository.findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today)
            .stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }

    // ==================== DELETE ====================

    @Override
    @Transactional
    public void deleteById(ObjectId id) {
        repository.deleteById(id);
    }
    
    @Override
    @Transactional
    public void deactivateExpiredDiscounts() {
        LocalDate today = LocalDate.now();
        List<Discount> allDiscounts = repository.findByActiveTrue();
        
        for (Discount discount : allDiscounts) {
            if (discount.getEndDate() != null && discount.getEndDate().isBefore(today)) {
                discount.setActive(false);
                repository.save(discount);
            }
        }
    }
}

