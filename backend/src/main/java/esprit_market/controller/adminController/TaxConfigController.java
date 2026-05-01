package esprit_market.controller.adminController;

import esprit_market.dto.cartDto.TaxConfigDTO;
import esprit_market.service.cartService.TaxConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin REST controller for TVA (Tax Configuration) management.
 *
 * Routes:
 *   GET    /api/admin/tax-config          → list all
 *   GET    /api/admin/tax-config/effective → active default (used by checkout)
 *   POST   /api/admin/tax-config          → create
 *   PUT    /api/admin/tax-config/{id}     → update
 *   DELETE /api/admin/tax-config/{id}     → delete
 *   PATCH  /api/admin/tax-config/{id}/default → set as default
 *   PATCH  /api/admin/tax-config/{id}/toggle  → activate/deactivate
 */
@RestController
@RequestMapping("/api/admin/tax-config")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - TVA Configuration", description = "Manage TVA tax configuration")
@SecurityRequirement(name = "Bearer Authentication")
public class TaxConfigController {

    private final TaxConfigService taxConfigService;

    // ── Public checkout endpoint (no auth needed) ─────────────────────────────

    @GetMapping("/effective")
    @Operation(summary = "Get effective TVA", description = "Returns the active default TVA config used at checkout")
    public ResponseEntity<TaxConfigDTO> getEffective() {
        return ResponseEntity.ok(taxConfigService.getEffectiveTax());
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all TVA configs")
    public ResponseEntity<List<TaxConfigDTO>> getAll() {
        return ResponseEntity.ok(taxConfigService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get TVA config by ID")
    public ResponseEntity<TaxConfigDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(taxConfigService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create TVA config")
    public ResponseEntity<TaxConfigDTO> create(
            @Valid @RequestBody TaxConfigDTO dto,
            Authentication auth) {
        String createdBy = auth != null ? auth.getName() : "SYSTEM";
        log.info("Admin '{}' creating TaxConfig: {}", createdBy, dto.getName());
        return ResponseEntity.ok(taxConfigService.create(dto, createdBy));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update TVA config")
    public ResponseEntity<TaxConfigDTO> update(
            @PathVariable String id,
            @Valid @RequestBody TaxConfigDTO dto,
            Authentication auth) {
        String updatedBy = auth != null ? auth.getName() : "SYSTEM";
        return ResponseEntity.ok(taxConfigService.update(id, dto, updatedBy));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete TVA config")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        taxConfigService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/default")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Set TVA config as default")
    public ResponseEntity<TaxConfigDTO> setDefault(@PathVariable String id) {
        return ResponseEntity.ok(taxConfigService.setDefault(id));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle TVA config active/inactive")
    public ResponseEntity<TaxConfigDTO> toggle(@PathVariable String id) {
        return ResponseEntity.ok(taxConfigService.toggleActive(id));
    }
}
