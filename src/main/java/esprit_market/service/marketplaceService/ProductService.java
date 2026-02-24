package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Category;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ProductCategory;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductCategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class ProductService implements IProductService {
    private final ProductRepository repository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final ProductCategoryRepository productCategoryRepository;

    @Override
    public List<Product> findAll() {
        return repository.findAll();
    }

    @Override
    public Product findById(ObjectId id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    @Override
    public Product create(Product product) {
        // FR-PS1: Validate Shop existence
        if (product.getShopId() == null) {
            throw new IllegalArgumentException("Shop ID is mandatory");
        }
        if (!shopRepository.existsById(product.getShopId())) {
            throw new ResourceNotFoundException("Shop not found with id: " + product.getShopId());
        }

        // FR-PS1: Validate Categories existence
        if (product.getCategoryIds() != null) {
            for (ObjectId catId : product.getCategoryIds()) {
                if (!categoryRepository.existsById(catId)) {
                    throw new ResourceNotFoundException("Category not found with id: " + catId);
                }
            }
        }

        // Save Product
        Product savedProduct = repository.save(product);

        // Maintain Bidirectionality: Category — Product & ProductCategory links
        if (savedProduct.getCategoryIds() != null) {
            for (ObjectId catId : savedProduct.getCategoryIds()) {
                Category category = categoryRepository.findById(catId).get();
                if (category.getProductIds() == null) {
                    category.setProductIds(new ArrayList<>());
                }
                category.getProductIds().add(savedProduct.getId());
                categoryRepository.save(category);

                // Create ProductCategory link explicitly as requested
                productCategoryRepository.save(ProductCategory.builder()
                        .productId(savedProduct.getId())
                        .categoryId(catId)
                        .build());
            }
        }

        return savedProduct;
    }

    @Override
    public Product update(ObjectId id, Product productDetails) {
        Product existingProduct = findById(id);

        // Update fields
        existingProduct.setName(productDetails.getName());
        existingProduct.setDescription(productDetails.getDescription());
        existingProduct.setPrice(productDetails.getPrice());
        existingProduct.setStock(productDetails.getStock());
        existingProduct.setImages(productDetails.getImages());

        // Handle Category changes (simplified: replace all)
        // In a real scenario, we would need to handle old/new relations more carefully
        // for bidirectionality. Here we do a full refresh for simplicity unless complex
        // behavior is specified.

        // Remove old links
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

        // Add new links
        existingProduct.setCategoryIds(productDetails.getCategoryIds());
        if (existingProduct.getCategoryIds() != null) {
            for (ObjectId newCatId : existingProduct.getCategoryIds()) {
                if (!categoryRepository.existsById(newCatId)) {
                    throw new ResourceNotFoundException("Category not found with id: " + newCatId);
                }
                Category category = categoryRepository.findById(newCatId).get();
                if (category.getProductIds() == null) {
                    category.setProductIds(new ArrayList<>());
                }
                category.getProductIds().add(id);
                categoryRepository.save(category);

                productCategoryRepository.save(ProductCategory.builder()
                        .productId(id)
                        .categoryId(newCatId)
                        .build());
            }
        }

        return repository.save(existingProduct);
    }

    @Override
    public void deleteById(ObjectId id) {
        Product product = findById(id);

        // Maintain Bidirectionality: Remove from Categories
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

        // Remove ProductCategory links
        productCategoryRepository.deleteByProductId(id);

        repository.deleteById(id);
    }
}
