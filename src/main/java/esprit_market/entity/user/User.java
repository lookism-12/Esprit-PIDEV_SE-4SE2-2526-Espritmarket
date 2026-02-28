package esprit_market.entity.user;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import esprit_market.Enum.userEnum.Role;

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
    private String email;
    private String password;
    private List<Role> roles;
    @Builder.Default
    private boolean enabled = true;

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
