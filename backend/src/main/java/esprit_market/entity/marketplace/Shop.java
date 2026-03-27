package esprit_market.entity.marketplace;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

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
    private String logo;
    private String banner;
    
    private Double rating;
    private Integer reviewsCount;
    
    private LocalDateTime joinedAt;
}
