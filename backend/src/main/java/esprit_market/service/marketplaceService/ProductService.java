package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ProductImageDTO;
import esprit_market.dto.marketplace.ProductRequestDTO;
import esprit_market.dto.marketplace.ProductResponseDTO;
import esprit_market.entity.marketplace.Category;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ProductCategory;
import esprit_market.entity.marketplace.ProductImage;
import esprit_market.entity.marketplace.Shop;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.mappers.marketplace.ProductMapper;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductCategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService implements IProductService {
    private final ProductRepository repository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ProductMapper mapper;

    @Override
    public List<ProductResponseDTO> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProductResponseDTO findById(ObjectId id) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapper.toDTO(product);
    }

    public Product findEntityById(ObjectId id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public ProductResponseDTO saveAndMap(Product product) {
        return mapper.toDTO(repository.save(product));
    }

    @Override
    public ProductResponseDTO create(ProductRequestDTO dto) {
        if (dto.getShopId() == null) {
            throw new IllegalArgumentException("Shop ID is mandatory");
        }
        ObjectId shopObjectId = new ObjectId(dto.getShopId());

        // 1️⃣ ALWAYS fetch linked entity via findById().orElseThrow()
        Shop shop = shopRepository.findById(shopObjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + dto.getShopId()));

        List<Category> categories = new ArrayList<>();
        if (dto.getCategoryIds() != null) {
            for (String catId : dto.getCategoryIds()) {
                ObjectId oid = new ObjectId(catId);
                // 1️⃣ ALWAYS fetch linked entity via findById().orElseThrow()
                Category category = categoryRepository.findById(oid)
                        .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + catId));
                categories.add(category);
            }
        }

        Product product = mapper.toEntity(dto);
        Product savedProduct = repository.save(product);

        // Maintain bidirectionality: update Category.productIds + create
        // ProductCategory links
        for (Category category : categories) {
            if (category.getProductIds() == null) {
                category.setProductIds(new ArrayList<>());
            }
            if (!category.getProductIds().contains(savedProduct.getId())) {
                category.getProductIds().add(savedProduct.getId());
                categoryRepository.save(category);
            }

            productCategoryRepository.save(ProductCategory.builder()
                    .productId(savedProduct.getId())
                    .categoryId(category.getId())
                    .build());
        }

        return mapper.toDTO(savedProduct);
    }

    @Override
    public ProductResponseDTO update(ObjectId id, ProductRequestDTO dto) {
        Product existingProduct = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        existingProduct.setName(dto.getName());
        existingProduct.setDescription(dto.getDescription());
        existingProduct.setPrice(dto.getPrice());
        existingProduct.setStock(dto.getStock());

        // Validate Shop if changed
        if (dto.getShopId() != null) {
            ObjectId shopObjectId = new ObjectId(dto.getShopId());
            shopRepository.findById(shopObjectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + dto.getShopId()));
            existingProduct.setShopId(shopObjectId);
        }

        if (dto.getImages() != null) {
            existingProduct.setImages(dto.getImages().stream()
                    .map(imgDto -> new ProductImage(imgDto.getUrl(), imgDto.getAltText()))
                    .collect(Collectors.toList()));
        }

        // Maintain bidirectionality: remove old category links
        if (existingProduct.getCategoryIds() != null) {
            for (ObjectId oldCatId : existingProduct.getCategoryIds()) {
                categoryRepository.findById(oldCatId).ifPresent(cat -> {
                    if (cat.getProductIds() != null) {
                        cat.getProductIds().remove(id);
                        categoryRepository.save(cat);
                    }
                });
            }
            productCategoryRepository.deleteByProductId(id);
        }

        // Add new category links
        List<Category> newCategories = new ArrayList<>();
        if (dto.getCategoryIds() != null) {
            for (String catId : dto.getCategoryIds()) {
                ObjectId oid = new ObjectId(catId);
                Category category = categoryRepository.findById(oid)
                        .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + catId));
                newCategories.add(category);
            }
        }

        List<ObjectId> newCategoryIds = newCategories.stream().map(Category::getId).collect(Collectors.toList());
        existingProduct.setCategoryIds(newCategoryIds);

        for (Category category : newCategories) {
            if (category.getProductIds() == null) {
                category.setProductIds(new ArrayList<>());
            }
            if (!category.getProductIds().contains(id)) {
                category.getProductIds().add(id);
                categoryRepository.save(category);
            }

            productCategoryRepository.save(ProductCategory.builder()
                    .productId(id)
                    .categoryId(category.getId())
                    .build());
        }

        return mapper.toDTO(repository.save(existingProduct));
    }

    @Override
    public void deleteById(ObjectId id) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (product.getCategoryIds() != null) {
            for (ObjectId catId : product.getCategoryIds()) {
                categoryRepository.findById(catId).ifPresent(cat -> {
                    if (cat.getProductIds() != null) {
                        cat.getProductIds().remove(id);
                        categoryRepository.save(cat);
                    }
                });
            }
        }

        productCategoryRepository.deleteByProductId(id);
        repository.deleteById(id);
    }

    @Override
    public List<ProductResponseDTO> findByOwnerId(String ownerId) {
        ObjectId ownerObjectId = new ObjectId(ownerId);
        List<Shop> userShops = shopRepository.findByOwnerId(ownerObjectId);
        List<ObjectId> shopIds = userShops.stream()
                .map(Shop::getId)
                .collect(Collectors.toList());

        if (shopIds.isEmpty()) {
            return new ArrayList<>();
        }

        return repository.findByShopIdIn(shopIds).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }
}
