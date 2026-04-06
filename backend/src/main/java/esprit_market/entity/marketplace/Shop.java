package esprit_market.entity.marketplace;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Document(collection = "shops")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Shop {
    @Id
    private ObjectId id;
    private ObjectId ownerId;
    private String name;
    private String description;
    private String address;
    private String phone;
    private String email; // ✅ Added email field
    private String logo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // ✅ Social media links
    @Builder.Default
    private Map<String, String> socialLinks = new HashMap<>(); // facebook, instagram, twitter, website
    
    // ✅ Shop status and settings
    @Builder.Default
    private boolean isActive = true;
    
    @Builder.Default
    private List<ObjectId> productIds = new ArrayList<>();
    
    // ✅ Shop statistics (calculated fields)
    private int totalProducts;
    private int approvedProducts;
    private double averageRating;
    private int totalReviews;
}
