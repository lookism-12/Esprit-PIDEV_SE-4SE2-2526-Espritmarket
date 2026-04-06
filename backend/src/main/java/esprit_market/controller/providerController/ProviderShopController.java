package esprit_market.controller.providerController;

import esprit_market.dto.marketplace.ShopRequestDTO;
import esprit_market.dto.marketplace.ShopResponseDTO;
import esprit_market.service.marketplaceService.IShopService;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/provider/shop")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROVIDER')")
@Tag(name = "Provider Shop", description = "Provider shop management APIs")
public class ProviderShopController {
    
    private final IShopService shopService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Get my shop")
    public ResponseEntity<ShopResponseDTO> getMyShop(Authentication authentication) {
        try {
            ShopResponseDTO shop = shopService.findMyShop();
            return ResponseEntity.ok(shop);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @Operation(summary = "Create my shop")
    public ShopResponseDTO createMyShop(@RequestBody ShopRequestDTO dto, Authentication authentication) {
        // Get authenticated user
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Set the owner to the authenticated user
        dto.setOwnerId(user.getId().toHexString());
        
        return shopService.create(dto);
    }

    @PutMapping
    @Operation(summary = "Update my shop")
    public ShopResponseDTO updateMyShop(@RequestBody ShopRequestDTO dto, Authentication authentication) {
        // Get authenticated user's shop
        ShopResponseDTO existingShop = shopService.findMyShop();
        
        // Ensure the owner remains the authenticated user
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        dto.setOwnerId(user.getId().toHexString());
        
        return shopService.update(new org.bson.types.ObjectId(existingShop.getId()), dto);
    }

    @DeleteMapping
    @Operation(summary = "Delete my shop")
    public ResponseEntity<Void> deleteMyShop(Authentication authentication) {
        try {
            ShopResponseDTO shop = shopService.findMyShop();
            shopService.deleteById(new org.bson.types.ObjectId(shop.getId()));
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/exists")
    @Operation(summary = "Check if I have a shop")
    public ResponseEntity<Boolean> hasShop(Authentication authentication) {
        try {
            shopService.findMyShop();
            return ResponseEntity.ok(true);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.ok(false);
        }
    }
}