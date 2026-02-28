package esprit_market.controller.cartController;

import esprit_market.dto.DiscountCreateRequest;
import esprit_market.dto.DiscountResponse;
import esprit_market.dto.DiscountUpdateRequest;
import esprit_market.service.cartService.IDiscountService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/discounts")
@RequiredArgsConstructor
public class DiscountController {
    private final IDiscountService service;

    @GetMapping
    public ResponseEntity<List<DiscountResponse>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVIDER')")
    public ResponseEntity<DiscountResponse> create(@Valid @RequestBody DiscountCreateRequest request) {
        DiscountResponse created = service.save(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiscountResponse> getById(@PathVariable String id) {
        DiscountResponse discount = service.findById(new ObjectId(id));
        return ResponseEntity.ok(discount);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVIDER')")
    public ResponseEntity<DiscountResponse> update(
            @PathVariable String id,
            @Valid @RequestBody DiscountUpdateRequest request) {
        DiscountResponse updated = service.update(new ObjectId(id), request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<DiscountResponse>> getActiveDiscounts() {
        List<DiscountResponse> discounts = service.findActiveDiscounts();
        return ResponseEntity.ok(discounts);
    }
    
    @PostMapping("/deactivate-expired")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateExpired() {
        service.deactivateExpiredDiscounts();
        return ResponseEntity.ok().build();
    }
}

