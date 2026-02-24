package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Favoris;
import esprit_market.entity.user.User;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.repository.marketplaceRepository.FavorisRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FavorisService implements IFavorisService {
    private final FavorisRepository repository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ServiceRepository serviceRepository;

    @Override
    public List<Favoris> findAll() {
        return repository.findAll();
    }

    @Override
    public Favoris create(Favoris favoris) {
        // Validate User
        if (favoris.getUserId() == null || !userRepository.existsById(favoris.getUserId())) {
            throw new ResourceNotFoundException("User not found with id: " + favoris.getUserId());
        }

        // Validate XOR Product/Service
        boolean hasProduct = favoris.getProductId() != null;
        boolean hasService = favoris.getServiceId() != null;

        if (hasProduct && hasService) {
            throw new IllegalArgumentException("A favorite cannot have both a product and a service");
        }
        if (!hasProduct && !hasService) {
            throw new IllegalArgumentException("A favorite must have either a product or a service");
        }

        // Validate existence
        if (hasProduct && !productRepository.existsById(favoris.getProductId())) {
            throw new ResourceNotFoundException("Product not found with id: " + favoris.getProductId());
        }
        if (hasService && !serviceRepository.existsById(favoris.getServiceId())) {
            throw new ResourceNotFoundException("Service not found with id: " + favoris.getServiceId());
        }

        favoris.setCreatedAt(LocalDateTime.now());
        Favoris saved = repository.save(favoris);

        // Maintain bidirectionality
        User user = userRepository.findById(favoris.getUserId()).get();
        if (!user.getFavorisIds().contains(saved.getId())) {
            user.getFavorisIds().add(saved.getId());
            userRepository.save(user);
        }

        return saved;
    }

    @Override
    public List<Favoris> getByUserId(ObjectId userId) {
        return repository.findByUserId(userId);
    }

    @Override
    public Favoris update(ObjectId id, Favoris favoris) {
        Favoris existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Favoris not found with id: " + id));

        // Logical check: User cannot be changed (requirement)
        if (!existing.getUserId().equals(favoris.getUserId()) && favoris.getUserId() != null) {
            throw new IllegalArgumentException("Changing the user of a favorite is not allowed");
        }

        // Update XOR Product/Service (if provided)
        if (favoris.getProductId() != null && favoris.getServiceId() != null) {
            throw new IllegalArgumentException("A favorite cannot have both a product and a service");
        }

        if (favoris.getProductId() != null) {
            if (!productRepository.existsById(favoris.getProductId())) {
                throw new ResourceNotFoundException("Product not found with id: " + favoris.getProductId());
            }
            existing.setProductId(favoris.getProductId());
            existing.setServiceId(null);
        } else if (favoris.getServiceId() != null) {
            if (!serviceRepository.existsById(favoris.getServiceId())) {
                throw new ResourceNotFoundException("Service not found with id: " + favoris.getServiceId());
            }
            existing.setServiceId(favoris.getServiceId());
            existing.setProductId(null);
        }

        // Potential "note" or "order" fields could be added here if they were in the
        // entity

        return repository.save(existing);
    }

    @Override
    public void delete(ObjectId id) {
        Favoris existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Favoris not found with id: " + id));

        // Maintain bidirectionality
        userRepository.findById(existing.getUserId()).ifPresent(user -> {
            user.getFavorisIds().remove(id);
            userRepository.save(user);
        });

        repository.deleteById(id);
    }

    @Override
    public Favoris findById(ObjectId id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Favoris not found with id: " + id));
    }
}
