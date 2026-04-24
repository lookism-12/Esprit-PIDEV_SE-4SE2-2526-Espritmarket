package esprit_market.controller.uploadController;

import esprit_market.service.CloudinaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
@Tag(name = "Uploads", description = "Cloud image upload APIs (Cloudinary)")
public class UploadController {

    private static final Logger log = LoggerFactory.getLogger(UploadController.class);

    private final CloudinaryService cloudinaryService;

    @GetMapping("/test")
    @Operation(summary = "Test upload controller")
    public ResponseEntity<?> test() {
        return ResponseEntity.ok(Map.of("message", "Upload controller is working (Cloudinary)"));
    }

    /**
     * Upload one or more product images to Cloudinary.
     * Returns a list of secure URLs — no files are stored on the server.
     */
    @PostMapping("/temp-images")
    @Operation(summary = "Upload product images to Cloudinary")
    public ResponseEntity<?> uploadTempImages(
            @RequestParam(value = "files", required = false) MultipartFile[] files) {

        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "No files provided"));
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            String url = cloudinaryService.upload(file, "products");
            urls.add(url);
        }

        log.info("Uploaded {} product image(s) to Cloudinary", urls.size());
        return ResponseEntity.ok(Map.of("urls", urls, "count", urls.size()));
    }

    /**
     * Upload a single image (generic — used by shop logos, service images, etc.)
     */
    @PostMapping("/image")
    @Operation(summary = "Upload a single image to Cloudinary")
    public ResponseEntity<?> uploadSingle(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {

        String url = cloudinaryService.upload(file, folder);
        log.info("Uploaded image to Cloudinary folder '{}': {}", folder, url);
        return ResponseEntity.ok(Map.of("url", url));
    }

    /**
     * Delete an image from Cloudinary by its URL or public_id.
     */
    @DeleteMapping("/image")
    @Operation(summary = "Delete an image from Cloudinary")
    public ResponseEntity<?> deleteImage(@RequestParam("url") String url) {
        cloudinaryService.delete(url);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}
