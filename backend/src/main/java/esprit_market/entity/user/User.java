package esprit_market.entity.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import esprit_market.Enum.userEnum.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private ObjectId id;
    
    private String firstName;
    private String lastName;
    private String phone;
    
    @Indexed(unique = true)
    private String email;
    
    @JsonIgnore
    private String password;
    
    private List<Role> roles;
    
    @Builder.Default
    private boolean enabled = true;

    @JsonIgnore
    private String resetToken;
    
    @JsonIgnore
    private LocalDateTime resetTokenExpiry;

    private String avatarUrl;

    // Client/Passenger fields
    private String address;

    // Provider fields
    private String businessName;
    private String businessType;
    private String taxId;
    private String description;

    // Driver fields
    private String drivingLicenseNumber;

    // Logistics fields (Driver & Delivery)
    private String vehicleType;

    // Delivery fields
    private String deliveryZone;

    @Builder.Default
    private List<ObjectId> notificationIds = new ArrayList<>();
    @Builder.Default
    private List<ObjectId> externalNotificationIds = new ArrayList<>();
    private ObjectId driverProfileId;
    private ObjectId passengerProfileId;
    @Builder.Default
    private List<ObjectId> favorisIds = new ArrayList<>();
    @Builder.Default
    private List<ObjectId> cartIds = new ArrayList<>();
    @Builder.Default
    private List<ObjectId> postIds = new ArrayList<>();
    @Builder.Default
    private List<ObjectId> groupIds = new ArrayList<>();
    @Builder.Default
    private List<ObjectId> messageIds = new ArrayList<>();
    @Builder.Default
    private List<ObjectId> reactionIds = new ArrayList<>();
    @Builder.Default
    private List<ObjectId> commentIds = new ArrayList<>();
}
