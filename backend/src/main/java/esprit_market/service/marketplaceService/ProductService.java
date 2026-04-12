package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ProductImageDTO;
import esprit_market.dto.marketplace.ProductRequestDTO;
import esprit_market.dto.marketplace.ProductResponseDTO;
import esprit_market.entity.marketplace.Category;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ProductCategory;
import esprit_market.entity.marketplace.ProductImage;
import esprit_market.Enum.marketplaceEnum.ProductStatus;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.mappers.marketplace.ProductMapper;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductCategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService implements IProductService {
    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository repository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final UserRepository userRepository;
    private final ProductMapper mapper;

    @Override
    public List<ProductResponseDTO> findAll() {
        List<Product> products = repository.findAll();
        log.info("findAll() - Found {} products in database", products.size());
        List<ProductResponseDTO> dtos = products.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
        log.info("findAll() - Returning {} DTOs", dtos.size());
        return dtos;
    }

    @Override
    public List<ProductResponseDTO> findAllApproved() {
        return repository.findByStatus(ProductStatus.APPROVED).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponseDTO> findForCurrentSeller() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Not authenticated");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Shop shop = shopRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No shop found for this seller"));
        return repository.findByShopId(shop.getId()).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponseDTO> findByShopId(String shopId) {
        log.info("Finding products for shop ID: {}", shopId);
        ObjectId shopObjectId = new ObjectId(shopId);
        List<Product> products = repository.findByShopId(shopObjectId);
        log.info("Found {} products for shop ID: {}", products.size(), shopId);
        return products.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Overloaded method to accept ObjectId directly
     */
    public List<ProductResponseDTO> findByShopId(ObjectId shopId) {
        log.info("Finding products for shop ID: {}", shopId);
        List<Product> products = repository.findByShopId(shopId);
        log.info("Found {} products for shop ID: {}", products.size(), shopId);
        return products.stream()
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
        try {
            log.info("create product: name={}, shopId={}, categoryIds={}",
                    dto.getName(), dto.getShopId(), dto.getCategoryIds());
            
            if (dto.getShopId() == null || dto.getShopId().isEmpty()) {
                throw new IllegalArgumentException("Shop ID is mandatory");
            }
            
            if (dto.getName() == null || dto.getName().trim().isEmpty()) {
                throw new IllegalArgumentException("Product name is mandatory");
            }
            
            if (dto.getPrice() <= 0) {
                throw new IllegalArgumentException("Product price must be greater than 0");
            }
            
            if (dto.getStock() < 0) {
                throw new IllegalArgumentException("Product stock cannot be negative");
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
            product.setStatus(ProductStatus.PENDING);
            log.info("Saving product to MongoDB: {}", product.getName());
            Product savedProduct = repository.save(product);
            log.info("Product saved successfully with ID: {}", savedProduct.getId());

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

            ProductResponseDTO result = mapper.toDTO(savedProduct);
            log.info("Returning ProductResponseDTO with ID: {}", result.getId());
            return result;
        } catch (IllegalArgumentException e) {
            log.error("❌ Validation error creating product: {}", e.getMessage());
            throw e;
        } catch (ResourceNotFoundException e) {
            log.error("❌ Resource not found creating product: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Unexpected error creating product: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create product: " + e.getMessage(), e);
        }
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
    public ProductResponseDTO approve(ObjectId id) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        product.setStatus(ProductStatus.APPROVED);
        return mapper.toDTO(repository.save(product));
    }

    @Override
    public ProductResponseDTO reject(ObjectId id) {
        Product product = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        product.setStatus(ProductStatus.REJECTED);
        return mapper.toDTO(repository.save(product));
    }
}
