package esprit_market.controller.cartController;

import esprit_market.dto.ConvertPointsRequest;
import esprit_market.dto.LoyaltyCardResponse;
import esprit_market.service.cartService.AuthHelperService;
import esprit_market.service.cartService.ILoyaltyCardService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/loyalty")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('CLIENT', 'PROVIDER')")
public class LoyaltyCardController {
    private final ILoyaltyCardService loyaltyCardService;
    private final AuthHelperService authHelper;

    @GetMapping("/my-card")
    public ResponseEntity<LoyaltyCardResponse> getMyLoyaltyCard(Authentication authentication) {
        ObjectId userId = authHelper.getUserIdFromAuthentication(authentication);
        LoyaltyCardResponse card = loyaltyCardService.getOrCreateLoyaltyCard(userId);
        return ResponseEntity.ok(card);
    }

    @PostMapping("/convert-points")
    public ResponseEntity<LoyaltyCardResponse> convertPointsToDiscount(
            @Valid @RequestBody ConvertPointsRequest request,
            Authentication authentication) {
        ObjectId userId = authHelper.getUserIdFromAuthentication(authentication);
        LoyaltyCardResponse card = loyaltyCardService.convertPointsToDiscount(userId, request);
        return ResponseEntity.ok(card);
    }

    @PostMapping("/add-points")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LoyaltyCardResponse> addPoints(
            @RequestParam String userId,
            @RequestParam Integer points) {
        LoyaltyCardResponse card = loyaltyCardService.addPoints(new ObjectId(userId), points);
        return ResponseEntity.ok(card);
    }
}

