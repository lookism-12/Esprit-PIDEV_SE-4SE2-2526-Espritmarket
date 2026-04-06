package esprit_market.controller.uploadController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
@Tag(name = "Uploads", description = "File upload management APIs")
public class UploadController {
    
    private static final Logger log = LoggerFactory.getLogger(UploadController.class);
    
    // Allowed file types
    private static final List<String> ALLOWED_TYPES = List.of(
        "image/jpeg", "image/jpg", "image/png", "image/gif"
    );
    
    // Max file size (5MB)
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    @GetMapping("/test")
    @Operation(summary = "Test upload controller is working")
    public ResponseEntity<?> testUpload() {
        log.info("Upload controller test endpoint called");
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Upload controller is working");
        response.put("timestamp", System.currentTimeMillis());
        response.put("allowedTypes", ALLOWED_TYPES);
        response.put("maxFileSize", MAX_FILE_SIZE);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/temp-images")
    @Operation(summary = "Upload temporary images for product creation")
    public ResponseEntity<?> uploadTempImages(
        @RequestParam(value = "files", required = false) MultipartFile[] files,
        HttpServletRequest request) {
        
        log.info("=== UPLOAD REQUEST STARTED ===");
        log.info("Request received at /api/uploads/temp-images");
        log.info("Request method: {}", request.getMethod());
        log.info("Content-Type: {}", request.getContentType());
        log.info("Content-Length: {}", request.getContentLength());
        
        // Log all headers
        log.info("Request Headers:");
        java.util.Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            log.info("  {}: {}", headerName, request.getHeader(headerName));
        }
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate input
            if (files == null) {
                log.warn("Files parameter is null");
                response.put("error", "No files parameter provided");
                response.put("hint", "Make sure to send files as 'files' parameter in multipart/form-data");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (files.length == 0) {
                log.warn("Files array is empty");
                response.put("error", "No files provided");
                response.put("filesLength", 0);
                return ResponseEntity.badRequest().body(response);
            }

            log.info("Processing {} files", files.length);
            
            // Validate each file
            for (int i = 0; i < files.length; i++) {
                MultipartFile file = files[i];
                log.info("File {}: name='{}', type='{}', size={}, empty={}", 
                    i, file.getOriginalFilename(), file.getContentType(), file.getSize(), file.isEmpty());
                
                if (file.isEmpty()) {
                    log.warn("File {} is empty", i);
                    response.put("error", "File " + (i + 1) + " is empty");
                    return ResponseEntity.badRequest().body(response);
                }
                
                String contentType = file.getContentType();
                if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
                    log.warn("File {} has invalid content type: {}", i, contentType);
                    response.put("error", "File " + (i + 1) + " has invalid type: " + contentType);
                    response.put("allowedTypes", ALLOWED_TYPES);
                    return ResponseEntity.badRequest().body(response);
                }
                
                if (file.getSize() > MAX_FILE_SIZE) {
                    log.warn("File {} is too large: {} bytes", i, file.getSize());
                    response.put("error", "File " + (i + 1) + " is too large: " + file.getSize() + " bytes (max: " + MAX_FILE_SIZE + ")");
                    return ResponseEntity.badRequest().body(response);
                }
            }
            
            // Setup upload directory
            Path uploadPath = createUploadDirectory();
            log.info("Upload directory: {}", uploadPath);
            
            // Process files
            List<String> imageUrls = new ArrayList<>();
            
            for (int i = 0; i < files.length; i++) {
                MultipartFile file = files[i];
                String savedUrl = saveFile(file, uploadPath);
                imageUrls.add(savedUrl);
                log.info("File {} saved: {} -> {}", i, file.getOriginalFilename(), savedUrl);
            }
            
            log.info("Successfully uploaded {} images", imageUrls.size());
            
            response.put("message", "Images uploaded successfully");
            response.put("urls", imageUrls);
            response.put("count", imageUrls.size());
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            log.error("IO error during file upload", e);
            response.put("error", "File system error: " + e.getMessage());
            response.put("type", "IOException");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            
        } catch (SecurityException e) {
            log.error("Security error during file upload", e);
            response.put("error", "Access denied: " + e.getMessage());
            response.put("type", "SecurityException");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            
        } catch (Exception e) {
            log.error("UNEXPECTED ERROR during file upload", e);
            response.put("error", "Unexpected error: " + e.getMessage());
            response.put("type", e.getClass().getSimpleName());
            if (e.getCause() != null) {
                response.put("cause", e.getCause().getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    private Path createUploadDirectory() throws IOException {
        String uploadDir = System.getProperty("esprit.uploads.dir");
        Path uploadPath;
        
        if (uploadDir != null && !uploadDir.trim().isEmpty()) {
            uploadPath = Paths.get(uploadDir, "temp").toAbsolutePath();
        } else {
            uploadPath = Paths.get(System.getProperty("user.dir"))
                    .resolve("uploads")
                    .resolve("temp")
                    .toAbsolutePath();
        }
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            log.info("Created upload directory: {}", uploadPath);
        }
        
        return uploadPath;
    }
    
    private String saveFile(MultipartFile file, Path uploadPath) throws IOException {
        // Generate unique filename
        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        } else {
            // Default extension based on content type
            String contentType = file.getContentType();
            if ("image/png".equals(contentType)) {
                extension = ".png";
            } else if ("image/gif".equals(contentType)) {
                extension = ".gif";
            } else {
                extension = ".jpg";
            }
        }
        
        String filename = "temp_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
        
        // Save file
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Return URL
        return "/uploads/temp/" + filename;
    }
}