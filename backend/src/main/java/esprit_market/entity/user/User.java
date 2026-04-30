package esprit_market.entity.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import esprit_market.Enum.userEnum.Role;
import esprit_market.entity.notification.NotificationSettings;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;
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

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    private String firstName;
    private String lastName;
    private String phone;
    
    @Indexed(unique = true)
    private String email;
    
    /**
     * User's birth date (for birthday promotions)
     */
    private LocalDate birthDate;
    
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
    private Double currentLatitude;
    private Double currentLongitude;
    private LocalDateTime lastLocationUpdatedAt;

    @Builder.Default
    private boolean notificationsEnabled = true;
    @Builder.Default
    private boolean internalNotificationsEnabled = true;
    @Builder.Default
    private boolean externalNotificationsEnabled = true;

    /** Granular notification preferences including focus mode */
    private NotificationSettings notificationSettings;

    /**
     * Legacy fields — kept as @Transient so Spring Data ignores them.
     * Old documents may have these stored as DBRef arrays which would cause
     * deserialization errors if mapped.
     */
    @Transient
    private List<ObjectId> notificationIds;
    @Transient
    private List<ObjectId> externalNotificationIds;

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
    
    // ========================================
    // TRUST & REPUTATION SYSTEM FIELDS
    // ========================================
    
    /**
     * Dynamic trust score calculated based on seller performance
     * Range: 0-100
     * Formula: (averageRating * 40) + (totalSales * 30) + (approvalRate * 20) - (rejectionRate * 10)
     */
    @Builder.Default
    private double trustScore = 0.0;
    
    /**
     * Total number of completed sales (DELIVERED orders)
     */
    @Builder.Default
    private int totalSales = 0;
    
    /**
     * Total number of products approved by admin
     */
    @Builder.Default
    private int approvedProducts = 0;
    
    /**
     * Total number of products rejected by admin
     */
    @Builder.Default
    private int rejectedProducts = 0;
    
    /**
     * Average rating across all seller's products
     * Range: 0-5
     */
    @Builder.Default
    private double averageRating = 0.0;
    
    /**
     * Total number of ratings received
     */
    @Builder.Default
    private int totalRatings = 0;
}
