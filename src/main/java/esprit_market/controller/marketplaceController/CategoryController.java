package esprit_market.controller.marketplaceController;

import esprit_market.entity.marketplace.Category;
import esprit_market.service.marketplaceService.CategoryService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService service;

    @GetMapping
    public List<Category> findAll() {
        return service.findAll();
    }

    @PostMapping
    public Category save(@RequestBody Category category) {
        return service.save(category);
    }

    @GetMapping("/{id}")
    public Category findById(@PathVariable String id) {
        return service.findById(new ObjectId(id));
    }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable String id) {
        service.deleteById(new ObjectId(id));
    }
}
