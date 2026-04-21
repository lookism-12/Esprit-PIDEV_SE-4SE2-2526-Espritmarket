package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.FavorisRequestDTO;
import esprit_market.dto.marketplace.FavorisResponseDTO;
import esprit_market.entity.marketplace.Favoris;
import esprit_market.entity.user.User;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.mappers.marketplace.FavorisMapper;
import esprit_market.repository.marketplaceRepository.FavorisRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavorisService implements IFavorisService {
    private final FavorisRepository repository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ServiceRepository serviceRepository;
    private final FavorisMapper mapper;

    @Override
    public List<FavorisResponseDTO> findAll() {
        try {
            log.info("📋 Fetching all favorites from database");
            
            List<Favoris> allFavoris = repository.findAll();
            
            if (allFavoris == null) {
                log.warn("⚠️ Repository returned null instead of empty list");
                return Collections.emptyList();
            }
            
            if (allFavoris.isEmpty()) {
                log.info("✅ No favorites found in database");
                return Collections.emptyList();
            }
            
            log.info("✅ Found {} favorites, mapping to DTOs", allFavoris.size());
            
            List<FavorisResponseDTO> result = allFavoris.stream()
                    .map(favoris -> {
                        try {
                            return mapper.toDTO(favoris);
                        } catch (Exception e) {
                            log.error("❌ Error mapping favoris to DTO: {}", favoris.getId(), e);
                            return null; // Skip this item
                        }
                    })
                    .filter(dto -> dto != null) // Remove null entries
                    .collect(Collectors.toList());
            
            log.info("✅ Successfully mapped {} favorites to DTOs", result.size());
            return result;
            
        } catch (Exception e) {
            log.error("❌ Unexpected error in findAll()", e);
            log.error("❌ Error type: {}", e.getClass().getSimpleName());
            log.error("❌ Error message: {}", e.getMessage());
            log.error("❌ Stack trace: ", e);
            
            // Return empty list instead of throwing exception
            return Collections.emptyList();
        }
    }

    @Override
    public FavorisResponseDTO create(FavorisRequestDTO dto) {
        // Validate User
        if (dto.getUserId() == null) {
            throw new ResourceNotFoundException("User ID is mandatory");
        }
        ObjectId userObjectId = new ObjectId(dto.getUserId());

        // 1️⃣ ALWAYS fetch linked entity via findById().orElseThrow()
        User user = userRepository.findById(userObjectId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getUserId()));

        boolean hasProduct = dto.getProductId() != null;
        boolean hasService = dto.getServiceId() != null;

        if (hasProduct && hasService) {
            throw new IllegalArgumentException("A favorite cannot have both a product and a service");
        }
        if (!hasProduct && !hasService) {
            throw new IllegalArgumentException("A favorite must have either a product or a service");
        }

        if (hasProduct) {
            ObjectId productObjectId = new ObjectId(dto.getProductId());
            // 1️⃣ Validate existence via lookup
            productRepository.findById(productObjectId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Product not found with id: " + dto.getProductId()));
        }
        if (hasService) {
            ObjectId serviceObjectId = new ObjectId(dto.getServiceId());
            // 1️⃣ Validate existence via lookup
            serviceRepository.findById(serviceObjectId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Service not found with id: " + dto.getServiceId()));
        }

        Favoris favoris = mapper.toEntity(dto);
        favoris.setCreatedAt(LocalDateTime.now());
        Favoris saved = repository.save(favoris);

        // Maintain bidirectionality: update User.favorisIds
        if (!user.getFavorisIds().contains(saved.getId())) {
            user.getFavorisIds().add(saved.getId());
            userRepository.save(user);
        }

        return mapper.toDTO(saved);
    }

    @Override
    public List<FavorisResponseDTO> getByUserId(ObjectId userId) {
        return repository.findByUserId(userId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public FavorisResponseDTO update(ObjectId id, FavorisRequestDTO dto) {
        Favoris existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Favoris not found with id: " + id));

        // User cannot be changed (but if allowed, would need lookup)
        if (dto.getUserId() != null && !existing.getUserId().equals(new ObjectId(dto.getUserId()))) {
            throw new IllegalArgumentException("Changing the user of a favorite is not allowed");
        }

        if (dto.getProductId() != null && dto.getServiceId() != null) {
            throw new IllegalArgumentException("A favorite cannot have both a product and a service");
        }

        if (dto.getProductId() != null) {
            ObjectId productObjectId = new ObjectId(dto.getProductId());
            productRepository.findById(productObjectId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Product not found with id: " + dto.getProductId()));
            existing.setProductId(productObjectId);
            existing.setServiceId(null);
        } else if (dto.getServiceId() != null) {
            ObjectId serviceObjectId = new ObjectId(dto.getServiceId());
            serviceRepository.findById(serviceObjectId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Service not found with id: " + dto.getServiceId()));
            existing.setServiceId(serviceObjectId);
            existing.setProductId(null);
        }

        return mapper.toDTO(repository.save(existing));
    }

    @Override
    public void delete(ObjectId id) {
        Favoris existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Favoris not found with id: " + id));

        // Maintain bidirectionality: remove from User.favorisIds
        userRepository.findById(existing.getUserId()).ifPresent(user -> {
            user.getFavorisIds().remove(id);
            userRepository.save(user);
        });

        repository.deleteById(id);
    }

    @Override
    public FavorisResponseDTO findById(ObjectId id) {
        Favoris favoris = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Favoris not found with id: " + id));
        return mapper.toDTO(favoris);
    }

    @Override
    public FavorisResponseDTO toggleProductFavorite(ObjectId productId) {
        // Get current user from security context
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Not authenticated");
        }
        
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Check if favorite already exists
        Optional<Favoris> existing = repository.findByUserIdAndProductId(user.getId(), productId);
        
        if (existing.isPresent()) {
            // Remove favorite
            Favoris fav = existing.get();
            delete(fav.getId());
            return null; // Indicate removal
        } else {
            // Add favorite
            FavorisRequestDTO dto = new FavorisRequestDTO();
            dto.setUserId(user.getId().toHexString());
            dto.setProductId(productId.toHexString());
            return create(dto);
        }
    }

    @Override
    public FavorisResponseDTO toggleServiceFavorite(ObjectId serviceId) {
        // Get current user from security context
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Not authenticated");
        }
        
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Check if favorite already exists
        Optional<Favoris> existing = repository.findByUserIdAndServiceId(user.getId(), serviceId);
        
        if (existing.isPresent()) {
            // Remove favorite
            Favoris fav = existing.get();
            delete(fav.getId());
            return null; // Indicate removal
        } else {
            // Add favorite
            FavorisRequestDTO dto = new FavorisRequestDTO();
            dto.setUserId(user.getId().toHexString());
            dto.setServiceId(serviceId.toHexString());
            return create(dto);
        }
    }

    @Override
    public List<FavorisResponseDTO> getMyFavorites() {
        // Get current user from security context
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Not authenticated");
        }
        
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        return getByUserId(user.getId());
    }

    @Override
    public boolean isProductFavorited(ObjectId productId) {
        // Get current user from security context
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || auth.getName() == null) {
            return false;
        }
        
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) {
            return false;
        }
        
        Optional<Favoris> existing = repository.findByUserIdAndProductId(user.getId(), productId);
        return existing.isPresent();
    }

    @Override
    public boolean isServiceFavorited(ObjectId serviceId) {
        // Get current user from security context
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || auth.getName() == null) {
            return false;
        }
        
        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) {
            return false;
        }
        
        Optional<Favoris> existing = repository.findByUserIdAndServiceId(user.getId(), serviceId);
        return existing.isPresent();
    }
}
