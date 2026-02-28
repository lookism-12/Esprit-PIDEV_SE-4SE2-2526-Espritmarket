package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ShopRequestDTO;
import esprit_market.dto.marketplace.ShopResponseDTO;
import esprit_market.entity.marketplace.Shop;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.mappers.marketplace.ShopMapper;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopService implements IShopService {
    private final ShopRepository repository;
    private final UserRepository userRepository;
    private final ShopMapper mapper;

    @Override
    public List<ShopResponseDTO> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ShopResponseDTO findById(ObjectId id) {
        Shop shop = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));
        return mapper.toDTO(shop);
    }

    @Override
    public ShopResponseDTO create(ShopRequestDTO dto) {
        // Validate Owner (User) existence
        if (dto.getOwnerId() != null) {
            ObjectId ownerId = new ObjectId(dto.getOwnerId());
            userRepository.findById(ownerId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("User (owner) not found with id: " + dto.getOwnerId()));
        }
        Shop shop = mapper.toEntity(dto);
        return mapper.toDTO(repository.save(shop));
    }

    @Override
    public ShopResponseDTO update(ObjectId id, ShopRequestDTO dto) {
        Shop existingShop = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));

        // Affectation Owner: validate and assign
        if (dto.getOwnerId() != null) {
            ObjectId ownerId = new ObjectId(dto.getOwnerId());
            userRepository.findById(ownerId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("User (owner) not found with id: " + dto.getOwnerId()));
            existingShop.setOwnerId(ownerId);
        } else {
            existingShop.setOwnerId(null);
        }

        return mapper.toDTO(repository.save(existingShop));
    }

    @Override
    public void deleteById(ObjectId id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Shop not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
