package esprit_market.service.cartService;

import esprit_market.dto.cartDto.TaxConfigDTO;
import esprit_market.entity.cart.TaxConfig;
import esprit_market.repository.cartRepository.TaxConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * TaxConfigService — manages TVA configuration for the platform.
 *
 * Fallback: if no active/default config exists in MongoDB,
 * getEffectiveRate() returns DEFAULT_TVA = 0.19 (19%).
 *
 * Business rules:
 *  - Only ONE config can be isDefault=true (enforced in setDefault)
 *  - Deactivating the default sets isDefault=false as well
 *  - At checkout: priceTTC = priceHT + (priceHT * getEffectiveRate())
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TaxConfigService {

    private static final double DEFAULT_TVA = 0.19;

    private final TaxConfigRepository taxConfigRepository;

    // ── Public API used at checkout ───────────────────────────────────────────

    /**
     * Returns the effective TVA rate.
     * Falls back to 19% if nothing is configured.
     */
    public double getEffectiveRate() {
        return taxConfigRepository.findByIsDefaultTrue()
                .filter(TaxConfig::isActive)
                .map(TaxConfig::getRate)
                .orElse(DEFAULT_TVA);
    }

    /**
     * Returns the active default TaxConfig as DTO (used by checkout endpoint).
     */
    public TaxConfigDTO getEffectiveTax() {
        return taxConfigRepository.findByIsDefaultTrue()
                .filter(TaxConfig::isActive)
                .map(this::toDTO)
                .orElse(TaxConfigDTO.builder()
                        .id(null)
                        .name("TVA Standard (default)")
                        .rate(DEFAULT_TVA)
                        .isDefault(true)
                        .active(true)
                        .description("Taux standard TVA Tunisie — valeur par défaut")
                        .build());
    }

    // ── Admin CRUD ────────────────────────────────────────────────────────────

    public List<TaxConfigDTO> getAll() {
        return taxConfigRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public TaxConfigDTO getById(String id) {
        return taxConfigRepository.findById(new ObjectId(id))
                .map(this::toDTO)
                .orElseThrow(() -> new IllegalArgumentException("TaxConfig not found: " + id));
    }

    public TaxConfigDTO create(TaxConfigDTO dto, String createdBy) {
        TaxConfig entity = TaxConfig.builder()
                .name(dto.getName())
                .rate(dto.getRate())
                .isDefault(false)      // must be explicitly set via setDefault
                .active(dto.isActive())
                .description(dto.getDescription())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();

        TaxConfig saved = taxConfigRepository.save(entity);

        // If this is the first ever config, auto-set it as default
        if (taxConfigRepository.count() == 1) {
            setDefault(saved.getId().toHexString());
            saved = taxConfigRepository.findById(saved.getId()).orElse(saved);
        }

        log.info("TaxConfig created: {} ({}%) by {}", saved.getName(), saved.getRate() * 100, createdBy);
        return toDTO(saved);
    }

    public TaxConfigDTO update(String id, TaxConfigDTO dto, String updatedBy) {
        TaxConfig existing = taxConfigRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new IllegalArgumentException("TaxConfig not found: " + id));

        existing.setName(dto.getName());
        existing.setRate(dto.getRate());
        existing.setActive(dto.isActive());
        existing.setDescription(dto.getDescription());
        existing.setUpdatedAt(LocalDateTime.now());

        // If deactivating the default, remove default flag
        if (!dto.isActive() && existing.isDefault()) {
            existing.setDefault(false);
            log.warn("Default TaxConfig '{}' was deactivated — no default TVA is set. Fallback 19% will apply.", existing.getName());
        }

        TaxConfig saved = taxConfigRepository.save(existing);
        log.info("TaxConfig updated: {} by {}", saved.getName(), updatedBy);
        return toDTO(saved);
    }

    public void delete(String id) {
        TaxConfig existing = taxConfigRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new IllegalArgumentException("TaxConfig not found: " + id));
        if (existing.isDefault()) {
            throw new IllegalStateException("Cannot delete the default TVA configuration. Set another as default first.");
        }
        taxConfigRepository.deleteById(new ObjectId(id));
        log.info("TaxConfig deleted: {}", id);
    }

    public TaxConfigDTO setDefault(String id) {
        // Clear previous default
        taxConfigRepository.findByIsDefaultTrue().ifPresent(old -> {
            old.setDefault(false);
            taxConfigRepository.save(old);
        });

        TaxConfig target = taxConfigRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new IllegalArgumentException("TaxConfig not found: " + id));
        target.setDefault(true);
        target.setActive(true); // default must always be active
        target.setUpdatedAt(LocalDateTime.now());
        TaxConfig saved = taxConfigRepository.save(target);
        log.info("TaxConfig '{}' set as default (rate={}%)", saved.getName(), saved.getRate() * 100);
        return toDTO(saved);
    }

    public TaxConfigDTO toggleActive(String id) {
        TaxConfig existing = taxConfigRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new IllegalArgumentException("TaxConfig not found: " + id));
        if (existing.isDefault() && existing.isActive()) {
            throw new IllegalStateException("Cannot deactivate the default TVA. Set another config as default first.");
        }
        existing.setActive(!existing.isActive());
        existing.setUpdatedAt(LocalDateTime.now());
        return toDTO(taxConfigRepository.save(existing));
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private TaxConfigDTO toDTO(TaxConfig e) {
        return TaxConfigDTO.builder()
                .id(e.getId() != null ? e.getId().toHexString() : null)
                .name(e.getName())
                .rate(e.getRate())
                .isDefault(e.isDefault())
                .active(e.isActive())
                .description(e.getDescription())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .createdBy(e.getCreatedBy())
                .build();
    }
}
