package esprit_market.entity.marketplace;

import esprit_market.Enum.marketplaceEnum.ProductStatus;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    @Id
    private ObjectId id;
    private String name;
    private String description;

    private ObjectId shopId;

    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @Builder.Default
    private List<ObjectId> categoryIds = new ArrayList<>();

    private double price;
    private int stock;
    
    // ✅ Added missing fields
    private int quantity; // For compatibility with existing code
    
    @Builder.Default
    private ProductStatus status = ProductStatus.PENDING;
    
    // Approval workflow fields
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private ObjectId approvedBy;
    private String rejectionReason;
}
