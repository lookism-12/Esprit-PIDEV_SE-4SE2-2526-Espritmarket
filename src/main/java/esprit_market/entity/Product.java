package esprit_market.entity;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

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
    
    // Shop — Product (OneToMany BIDIRECTIONAL)
    private ObjectId shopId;

    // Product — ProductImage (OneToMany UNIDIRECTIONAL)
    private List<ProductImage> images = new ArrayList<>();

    // Product — Category (ManyToMany BIDIRECTIONAL)
    private List<ObjectId> categoryIds = new ArrayList<>();
    
    private double price;
    private int stock;
}
