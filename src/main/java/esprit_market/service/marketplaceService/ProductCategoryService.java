package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ProductCategoryRequestDTO;
import esprit_market.dto.marketplace.ProductCategoryResponseDTO;
import esprit_market.entity.marketplace.ProductCategory;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.mappers.marketplace.ProductCategoryMapper;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductCategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductCategoryService implements IProductCategoryService {
    private final ProductCategoryRepository repository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductCategoryMapper mapper;

    @Override
    public List<ProductCategoryResponseDTO> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProductCategoryResponseDTO findById(ObjectId id) {
        ProductCategory pc = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductCategory not found with id: " + id));
        return mapper.toDTO(pc);
    }

    @Override
    public ProductCategoryResponseDTO create(ProductCategoryRequestDTO dto) {
        // Validate Product existence
        if (dto.getProductId() == null) {
            throw new IllegalArgumentException("Product ID is mandatory");
        }
        ObjectId productId = new ObjectId(dto.getProductId());
        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + dto.getProductId()));

        // Validate Category existence
        if (dto.getCategoryId() == null) {
            throw new IllegalArgumentException("Category ID is mandatory");
        }
        ObjectId categoryId = new ObjectId(dto.getCategoryId());
        categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + dto.getCategoryId()));

        ProductCategory pc = mapper.toEntity(dto);
        return mapper.toDTO(repository.save(pc));
    }

    @Override
    public void deleteById(ObjectId id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("ProductCategory not found with id: " + id);
        }
        repository.deleteById(id);
    }

    @Override
    public List<ProductCategoryResponseDTO> findByProductId(ObjectId productId) {
        return repository.findByProductId(productId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductCategoryResponseDTO> findByCategoryId(ObjectId categoryId) {
        return repository.findByCategoryId(categoryId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }
}
