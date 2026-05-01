package esprit_market.controller.cartController;

import esprit_market.config.Exceptions;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.cartService.InvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Invoice Controller
 * 
 * Handles PDF invoice generation and download for paid orders.
 * 
 * Security: Requires authentication
 * Only order owner can download their invoice
 */
@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Invoices", description = "Invoice generation and download endpoints")
@SecurityRequirement(name = "Bearer Authentication")
@Slf4j
public class InvoiceController {
    
    private final InvoiceService invoiceService;
    private final UserRepository userRepository;
    
    /**
     * Download invoice PDF for a paid order
     * 
     * @param orderId Order ID
     * @param authentication User authentication
     * @return PDF file download
     */
    @GetMapping("/{orderId}/download")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN', 'PROVIDER')")
    @Operation(summary = "Download invoice PDF", 
               description = "Generate and download invoice PDF for a paid order")
    public ResponseEntity<byte[]> downloadInvoice(
            @PathVariable String orderId,
            Authentication authentication) {
        
        try {
            User user = getAuthenticatedUser(authentication);
            ObjectId orderObjectId = new ObjectId(orderId);
            
            log.info("User {} requesting invoice for order {}", 
                    user.getEmail(), orderId);
            
            // Generate PDF
            byte[] pdfBytes = invoiceService.generateInvoicePDF(orderObjectId, user.getId());
            
            // Set headers for PDF download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "invoice-" + orderId + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            
            log.info("Invoice generated successfully for order {}", orderId);
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (Exceptions.ResourceNotFoundException e) {
            log.error("Order not found: {}", orderId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exceptions.AccessDeniedException e) {
            log.error("Access denied for invoice: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalStateException e) {
            log.error("Invalid order state: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Error generating invoice: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // ==================== HELPER METHODS ====================
    
    private User getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
