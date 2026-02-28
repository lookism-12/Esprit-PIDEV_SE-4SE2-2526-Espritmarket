package esprit_market.entity.user;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import esprit_market.Enum.userEnum.Role;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "users")
public class User {
    @Id
    private ObjectId id;
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private List<Role> roles;
    private boolean enabled = true;

    private List<ObjectId> notificationIds = new ArrayList<>();
    private List<ObjectId> externalNotificationIds = new ArrayList<>();
    private ObjectId driverProfileId;
    private ObjectId passengerProfileId;
    private ObjectId loyaltyCardId;
    private ObjectId cartId;
    private List<ObjectId> couponIds = new ArrayList<>();
    private List<ObjectId> favorisIds = new ArrayList<>();
    private List<ObjectId> postIds = new ArrayList<>();
    private List<ObjectId> groupIds = new ArrayList<>();
    private List<ObjectId> messageIds = new ArrayList<>();
    private List<ObjectId> reactionIds = new ArrayList<>();
    private List<ObjectId> commentIds = new ArrayList<>();

    public User() {}

    public User(ObjectId id, String firstName, String lastName, String email, String password, List<Role> roles, boolean enabled) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.roles = roles;
        this.enabled = enabled;
    }

    // Getters and Setters
    public ObjectId getId() { return id; }
    public void setId(ObjectId id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public List<Role> getRoles() { return roles; }
    public void setRoles(List<Role> roles) { this.roles = roles; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public List<ObjectId> getNotificationIds() { return notificationIds; }
    public void setNotificationIds(List<ObjectId> ids) { this.notificationIds = ids; }
    
    public List<ObjectId> getExternalNotificationIds() { return externalNotificationIds; }
    public void setExternalNotificationIds(List<ObjectId> ids) { this.externalNotificationIds = ids; }
    
    public ObjectId getDriverProfileId() { return driverProfileId; }
    public void setDriverProfileId(ObjectId id) { this.driverProfileId = id; }
    
    public ObjectId getPassengerProfileId() { return passengerProfileId; }
    public void setPassengerProfileId(ObjectId id) { this.passengerProfileId = id; }
    
    public ObjectId getLoyaltyCardId() { return loyaltyCardId; }
    public void setLoyaltyCardId(ObjectId id) { this.loyaltyCardId = id; }
    
    public ObjectId getCartId() { return cartId; }
    public void setCartId(ObjectId id) { this.cartId = id; }
    
    public List<ObjectId> getCouponIds() { return couponIds; }
    public void setCouponIds(List<ObjectId> ids) { this.couponIds = ids; }
    
    public List<ObjectId> getFavorisIds() { return favorisIds; }
    public void setFavorisIds(List<ObjectId> ids) { this.favorisIds = ids; }
    
    public List<ObjectId> getPostIds() { return postIds; }
    public void setPostIds(List<ObjectId> ids) { this.postIds = ids; }
    
    public List<ObjectId> getGroupIds() { return groupIds; }
    public void setGroupIds(List<ObjectId> ids) { this.groupIds = ids; }
    
    public List<ObjectId> getMessageIds() { return messageIds; }
    public void setMessageIds(List<ObjectId> ids) { this.messageIds = ids; }
    
    public List<ObjectId> getReactionIds() { return reactionIds; }
    public void setReactionIds(List<ObjectId> ids) { this.reactionIds = ids; }
    
    public List<ObjectId> getCommentIds() { return commentIds; }
    public void setCommentIds(List<ObjectId> ids) { this.commentIds = ids; }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private String firstName;
        private String lastName;
        private String email;
        private String password;
        private List<Role> roles;
        private boolean enabled = true;

        public UserBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public UserBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder password(String password) { this.password = password; return this; }
        public UserBuilder roles(List<Role> roles) { this.roles = roles; return this; }
        public UserBuilder enabled(boolean enabled) { this.enabled = enabled; return this; }

        public User build() {
            User user = new User();
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEmail(email);
            user.setPassword(password);
            user.setRoles(roles);
            user.setEnabled(enabled);
            return user;
        }
    }
}
