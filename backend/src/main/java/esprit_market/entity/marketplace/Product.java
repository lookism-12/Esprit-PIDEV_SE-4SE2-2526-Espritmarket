package esprit_market.entity.marketplace;

import esprit_market.Enum.marketplaceEnum.ProductCondition;
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
    private Double originalPrice;
    private int stock;
    
    private Double rating;
    private Integer reviewsCount;
    private ProductCondition condition;
    private boolean isNegotiable;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
