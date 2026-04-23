package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ServiceRequestDTO;
import esprit_market.dto.marketplace.ServiceResponseDTO;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.mappers.marketplace.ServiceMapper;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceService implements IServiceService {
    private final ServiceRepository repository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final ServiceMapper mapper;
    private final esprit_market.repository.userRepository.UserRepository userRepository;

    @Override
    public List<ServiceResponseDTO> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ServiceResponseDTO> findForCurrentSeller() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Not authenticated");
        }
        esprit_market.entity.user.User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        esprit_market.entity.marketplace.Shop shop = shopRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No shop found for this seller"));
        return repository.findByShopId(shop.getId()).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ServiceResponseDTO findById(ObjectId id) {
        ServiceEntity service = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + id));
        return mapper.toDTO(service);
    }

    @Override
    public ServiceResponseDTO create(ServiceRequestDTO dto) {
        // Validate Shop existence
        if (dto.getShopId() == null) {
            throw new IllegalArgumentException("Shop ID is mandatory");
        }
        ObjectId shopId = new ObjectId(dto.getShopId());
        shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + dto.getShopId()));

        // Validate Category existence (if provided)
        if (dto.getCategoryId() != null) {
            ObjectId categoryId = new ObjectId(dto.getCategoryId());
            categoryRepository.findById(categoryId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Category not found with id: " + dto.getCategoryId()));
        }

        ServiceEntity service = mapper.toEntity(dto);
        return mapper.toDTO(repository.save(service));
    }

    @Override
    public ServiceResponseDTO update(ObjectId id, ServiceRequestDTO dto) {
        ServiceEntity existingService = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + id));

        existingService.setName(dto.getName());
        existingService.setDescription(dto.getDescription());
        existingService.setPrice(dto.getPrice());

        // Update duration if provided
        if (dto.getDurationMinutes() != null) {
            existingService.setDurationMinutes(dto.getDurationMinutes());
        }

        // Update availability if provided
        if (dto.getAvailability() != null) {
            existingService.setAvailability(mapper.toAvailabilityEntity(dto.getAvailability()));
        }

        // Affectation Shop: validate and assign if provided
        if (dto.getShopId() != null) {
            ObjectId shopId = new ObjectId(dto.getShopId());
            shopRepository.findById(shopId)
                    .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + dto.getShopId()));
            existingService.setShopId(shopId);
        }

        // Affectation / Désaffectation Category
        if (dto.getCategoryId() != null) {
            ObjectId categoryId = new ObjectId(dto.getCategoryId());
            categoryRepository.findById(categoryId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Category not found with id: " + dto.getCategoryId()));
            existingService.setCategoryId(categoryId);
        } else {
            // Désaffectation: if null is passed, remove the category link
            existingService.setCategoryId(null);
        }

        return mapper.toDTO(repository.save(existingService));
    }

    @Override
    public void deleteById(ObjectId id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Service not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
