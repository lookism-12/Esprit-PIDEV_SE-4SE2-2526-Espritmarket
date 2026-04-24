package esprit_market.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import esprit_market.config.Exceptions.BadRequestException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Centralised Cloudinary upload/delete service.
 * Every module that needs to store an image calls this service.
 * Only the returned secure_url is persisted in MongoDB — never binary data.
 */
@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key",    apiKey,
                "api_secret", apiSecret,
                "secure",     true
        ));
        log.info("Cloudinary initialised for cloud: {}", cloudName);
    }

    /**
     * Upload a file to Cloudinary under the given folder.
     * Images are auto-compressed (quality:auto) and format-optimised (f_auto).
     *
     * @param file   the multipart file to upload
     * @param folder logical folder inside Cloudinary (e.g. "avatars", "products")
     * @return the secure HTTPS URL of the uploaded image
     */
    public String upload(MultipartFile file, String folder) {
        validate(file);
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder",          "esprit_market/" + folder,
                            "resource_type",   "image",
                            "quality",         "auto",
                            "fetch_format",    "auto"
                    )
            );
            String url = (String) result.get("secure_url");
            log.info("Uploaded to Cloudinary: {}", url);
            return url;
        } catch (IOException e) {
            log.error("Cloudinary upload failed", e);
            throw new RuntimeException("Image upload failed: " + e.getMessage(), e);
        }
    }

    /**
     * Delete an image from Cloudinary by its public_id.
     * The public_id is the path without extension, e.g. "esprit_market/avatars/abc123".
     * If the URL is passed instead, the public_id is extracted automatically.
     *
     * @param publicIdOrUrl Cloudinary public_id or full secure_url
     */
    public void delete(String publicIdOrUrl) {
        if (publicIdOrUrl == null || publicIdOrUrl.isBlank()) return;
        try {
            String publicId = extractPublicId(publicIdOrUrl);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted from Cloudinary: {}", publicId);
        } catch (IOException e) {
            // Non-fatal — log and continue
            log.warn("Could not delete Cloudinary asset {}: {}", publicIdOrUrl, e.getMessage());
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        String ct = file.getContentType();
        if (ct == null || !ct.startsWith("image/")) {
            throw new BadRequestException("Invalid file format. Only images are allowed.");
        }
        if (file.getSize() > 10L * 1024 * 1024) {
            throw new BadRequestException("File size exceeds 10MB limit");
        }
    }

    /**
     * Extract Cloudinary public_id from a full secure_url.
     * e.g. https://res.cloudinary.com/dixy33pd6/image/upload/v123/esprit_market/avatars/abc.jpg
     *   → esprit_market/avatars/abc
     */
    private String extractPublicId(String url) {
        if (!url.startsWith("http")) return url; // already a public_id
        // Strip everything up to and including "/upload/vXXXXXX/"
        int uploadIdx = url.indexOf("/upload/");
        if (uploadIdx == -1) return url;
        String afterUpload = url.substring(uploadIdx + "/upload/".length());
        // Remove version segment if present (v1234567890/)
        if (afterUpload.startsWith("v") && afterUpload.contains("/")) {
            afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
        }
        // Remove file extension
        int dotIdx = afterUpload.lastIndexOf('.');
        return dotIdx != -1 ? afterUpload.substring(0, dotIdx) : afterUpload;
    }
}
