package esprit_market.controller.negociationController;

import esprit_market.dto.negociation.NegociationResponse;
import esprit_market.service.negociationService.INegociationService;
import esprit_market.service.negociationService.NegociationPdfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoint for downloading a negotiation as a PDF report.
 * GET /api/negociations/{id}/pdf
 */
@RestController
@RequestMapping("/api/negociations")
@RequiredArgsConstructor
@Tag(name = "Negociation PDF", description = "Export negotiation reports as PDF")
public class NegociationPdfController {

    private final INegociationService negociationService;
    private final NegociationPdfService pdfService;

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Download negotiation report as PDF")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable String id) {
        // Fetch negotiation — throws 404 if not found
        NegociationResponse neg = negociationService.getNegociationById(id);

        // Generate PDF bytes
        byte[] pdf = pdfService.generateNegociationPdf(neg);

        // Build safe filename
        String filename = "negotiation-" + id.substring(0, 8) + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentLength(pdf.length);

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}
