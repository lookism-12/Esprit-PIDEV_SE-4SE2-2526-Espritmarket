package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.CategoryRequestDTO;
import esprit_market.dto.marketplace.CategoryResponseDTO;
import esprit_market.entity.marketplace.Category;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.mappers.marketplace.CategoryMapper;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService implements ICategoryService {
    private final CategoryRepository repository;
    private final CategoryMapper mapper;

    @Override
    public List<CategoryResponseDTO> findAll() {
        return repository.findAll().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponseDTO findById(ObjectId id) {
        Category category = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return mapper.toDTO(category);
    }

    @Override
    public CategoryResponseDTO create(CategoryRequestDTO dto) {
        Category category = mapper.toEntity(dto);
        return mapper.toDTO(repository.save(category));
    }

    @Override
    public CategoryResponseDTO update(ObjectId id, CategoryRequestDTO dto) {
        Category existingCategory = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        existingCategory.setName(dto.getName());
        return mapper.toDTO(repository.save(existingCategory));
    }

    @Override
    public void deleteById(ObjectId id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
