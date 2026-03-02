# Carpooling Module - Development Guidelines
**For the Development Team**  
**Project Principal - EspritMarket**  
**Version:** 1.0 Final

---

## Overview

This document provides guidelines for developing and maintaining the Carpooling module while ensuring proper integration with Project Principal's User module.

---

## Golden Rules

### 🚫 NEVER DO THIS

1. **DO NOT create a new User entity**
   ```java
   // ❌ WRONG
   @Document(collection = "users")
   public class CarPoolUser { }
   ```

2. **DO NOT duplicate UserRepository**
   ```java
   // ❌ WRONG
   @Repository
   public interface CarpoolingUserRepository extends MongoRepository<User, ObjectId> { }
   ```

3. **DO NOT override UserService**
   ```java
   // ❌ WRONG
   @Service
   public class CarpoolingUserService extends UserService { }
   ```

4. **DO NOT create separate authentication**
   ```java
   // ❌ WRONG
   private final CustomUserDetailsService carPoolingDetailsService;
   ```

5. **DO NOT embed User data in profiles**
   ```java
   // ❌ WRONG
   @Document(collection = "driver_profiles")
   public class DriverProfile {
       private String firstName;        // ❌ Duplicates User.firstName
       private String email;            // ❌ Duplicates User.email
   }
   ```

6. **DO NOT create duplicate Role enums**
   ```java
   // ❌ WRONG
   public enum CarpoolingRole {
       DRIVER, PASSENGER
   }
   ```

### ✅ ALWAYS DO THIS

1. **Use existing User entity**
   ```java
   // ✅ CORRECT
   User user = userRepository.findByEmail(email)
       .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
   ```

2. **Link via ObjectId only**
   ```java
   // ✅ CORRECT
   @Document(collection = "driver_profiles")
   public class DriverProfile {
       @Indexed(unique = true)
       private ObjectId userId;  // Link to User.id
   }
   ```

3. **Use UserRepository for lookups**
   ```java
   // ✅ CORRECT
   private final UserRepository userRepository;
   
   User user = userRepository.findByEmail(userEmail);
   ```

4. **Enrich DTOs from User**
   ```java
   // ✅ CORRECT
   public DriverProfileResponseDTO toResponseDTO(DriverProfile profile) {
       User user = userRepository.findById(profile.getUserId()).orElse(null);
       if (user != null) {
           dto.setFullName(user.getFirstName() + " " + user.getLastName());
           dto.setEmail(user.getEmail());
       }
   }
   ```

5. **Use existing Role enum**
   ```java
   // ✅ CORRECT
   user.getRoles().add(Role.DRIVER);
   userRepository.save(user);
   ```

6. **Manage roles via User updates**
   ```java
   // ✅ CORRECT
   User user = userRepository.findByEmail(email);
   user.getRoles().add(Role.PASSENGER);
   userRepository.save(user);
   ```

---

## Architecture Pattern

### Entity Relationship Model

```
User (Project Principal - Single Source of Truth)
  ├─ id: ObjectId (Primary Key)
  ├─ email: String (Authentication)
  ├─ firstName, lastName: String (Name)
  ├─ password: String (Secured)
  ├─ roles: List<Role> (DRIVER, PASSENGER)
  ├─ driverProfileId: ObjectId → DriverProfile.id
  └─ passengerProfileId: ObjectId → PassengerProfile.id

DriverProfile (Carpooling)
  ├─ id: ObjectId (Primary Key)
  ├─ userId: ObjectId (Unique Index) → User.id
  ├─ licenseNumber: String
  ├─ isVerified: Boolean
  ├─ rideIds: List<ObjectId> → Ride.id
  └─ vehicleIds: List<ObjectId> → Vehicle.id

PassengerProfile (Carpooling)
  ├─ id: ObjectId (Primary Key)
  ├─ userId: ObjectId (Unique Index) → User.id
  ├─ preferences: String
  ├─ averageRating: Float
  └─ bookingIds: List<ObjectId> → Booking.id
```

### Service Integration Flow

```
Controller
  ↓
@AuthenticationPrincipal UserDetails user
  ↓
user.getUsername() → "email@example.com"
  ↓
Service.method(dto, userEmail)
  ↓
userRepository.findByEmail(userEmail)  ← Project Principal lookup
  ↓
Create/Update DriverProfile/PassengerProfile with userId
  ↓
Update User.roles (add DRIVER or PASSENGER)
  ↓
Return enriched DTO with User data
```

---

## Service Layer Implementation

### Registration Service Pattern

```java
@Service
@RequiredArgsConstructor
public class DriverProfileService implements IDriverProfileService {
    
    private final UserRepository userRepository;              // ✅ Inject Project Principal
    private final DriverProfileRepository driverProfileRepository;
    private final DriverProfileMapper mapper;
    
    // Pattern 1: Registration
    @Transactional
    public DriverProfileResponseDTO registerDriver(DriverProfileRequestDTO dto, String userEmail) {
        // Step 1: Get User from Project Principal
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
        
        // Step 2: Check no duplicate profile
        if (driverProfileRepository.existsByUserId(user.getId())) {
            throw new IllegalStateException("Driver profile already exists for this user");
        }
        
        // Step 3: Create Carpooling Profile (linked to User)
        DriverProfile profile = DriverProfile.builder()
            .userId(user.getId())                             // ✅ Link to User
            .licenseNumber(dto.getLicenseNumber())
            .licenseDocument(dto.getLicenseDocument())
            .isVerified(false)
            .averageRating(0f)
            .totalRidesCompleted(0)
            .totalEarnings(0f)
            .build();
        
        profile = driverProfileRepository.save(profile);
        
        // Step 4: Update User entity (bi-directional link)
        user.setDriverProfileId(profile.getId());
        
        // Step 5: Add Role to User
        if (user.getRoles() != null && !user.getRoles().contains(Role.DRIVER)) {
            user.getRoles().add(Role.DRIVER);
        } else if (user.getRoles() == null) {
            user.setRoles(List.of(Role.DRIVER));
        }
        
        // Step 6: Persist User changes (atomic with profile)
        userRepository.save(user);
        
        // Step 7: Return enriched response
        return mapper.toResponseDTO(profile);
    }
    
    // Pattern 2: Lookup by User
    @Override
    public DriverProfileResponseDTO findByUserId(ObjectId userId) {
        return mapper.toResponseDTO(
            driverProfileRepository.findByUserId(userId).orElse(null)
        );
    }
    
    // Pattern 3: Cascade Delete
    @Transactional
    public void delete(ObjectId id) {
        DriverProfile profile = driverProfileRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        
        // Step 1: Get User to access email for cascading
        User user = userRepository.findById(profile.getUserId()).orElse(null);
        if (user == null) return;
        
        String userEmail = user.getEmail();
        
        // Step 2: Cancel all rides (cascade)
        List<Ride> rides = rideRepository.findByDriverProfileId(id);
        for (Ride ride : rides) {
            if (!ride.getStatus().isTerminal()) {
                rideService.cancelRide(ride.getId().toHexString(), userEmail);
            }
        }
        
        // Step 3: Remove role from User
        user.getRoles().remove(Role.DRIVER);
        user.setDriverProfileId(null);
        userRepository.save(user);
        
        // Step 4: Delete profile
        driverProfileRepository.deleteById(id);
    }
}
```

**Key Points:**
- ✅ Always inject UserRepository
- ✅ Always check User exists
- ✅ Always link via userId
- ✅ Always update User.roles
- ✅ Always make operations @Transactional
- ✅ Always handle cascading

---

## Controller Layer Implementation

### Authentication Pattern

```java
@RestController
@RequestMapping("/api/driver-profiles")
@RequiredArgsConstructor
@Tag(name = "Driver Profile")
public class DriverProfileController {
    
    private final IDriverProfileService service;
    
    // Pattern: Use @AuthenticationPrincipal for user context
    @PostMapping
    @Operation(summary = "Register as driver")
    public DriverProfileResponseDTO create(
        @Valid @RequestBody DriverProfileRequestDTO dto,
        @AuthenticationPrincipal UserDetails user              // ✅ JWT context
    ) {
        // user.getUsername() returns the email from JWT
        return service.registerDriver(dto, user.getUsername());
    }
    
    @GetMapping("/me")
    @Operation(summary = "Get my driver profile")
    public DriverProfileResponseDTO getMyProfile(
        @AuthenticationPrincipal UserDetails user              // ✅ Authenticated user
    ) {
        return service.getMyProfile(user.getUsername());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")                          // ✅ Role check
    @Operation(summary = "Delete driver profile (admin only)")
    public void delete(@PathVariable String id) {
        service.delete(new ObjectId(id));
    }
}
```

**Key Points:**
- ✅ Always use @AuthenticationPrincipal
- ✅ Always extract email from UserDetails
- ✅ Pass email to service methods
- ✅ Use @PreAuthorize for role checks
- ✅ Never create User in controller

---

## Mapper Layer Implementation

### DTO Enrichment Pattern

```java
@Component
@RequiredArgsConstructor
public class DriverProfileMapper {
    
    private final UserRepository userRepository;              // ✅ For enrichment
    
    public DriverProfileResponseDTO toResponseDTO(DriverProfile profile) {
        if (profile == null) return null;
        
        String fullName = "";
        String email = "";
        
        // Step 1: Lookup User for enrichment
        if (profile.getUserId() != null) {
            User user = userRepository.findById(profile.getUserId()).orElse(null);
            
            // Step 2: Extract User data (enrich response)
            if (user != null) {
                fullName = user.getFirstName() + " " + user.getLastName();
                email = user.getEmail();
            }
        }
        
        // Step 3: Build response with enriched data
        return DriverProfileResponseDTO.builder()
            .id(profile.getId() != null ? profile.getId().toHexString() : null)
            .userId(profile.getUserId() != null ? profile.getUserId().toHexString() : null)
            .fullName(fullName)                                 // ✅ From User
            .email(email)                                       // ✅ From User
            .licenseNumber(profile.getLicenseNumber())
            .licenseDocument(profile.getLicenseDocument())
            .isVerified(profile.getIsVerified())
            .averageRating(profile.getAverageRating())
            .totalRidesCompleted(profile.getTotalRidesCompleted())
            .totalEarnings(profile.getTotalEarnings())
            .rideIds(profile.getRideIds() != null
                ? profile.getRideIds().stream()
                    .map(ObjectId::toHexString)
                    .collect(Collectors.toList())
                : Collections.emptyList())
            .vehicleIds(profile.getVehicleIds() != null
                ? profile.getVehicleIds().stream()
                    .map(ObjectId::toHexString)
                    .collect(Collectors.toList())
                : Collections.emptyList())
            .createdAt(profile.getCreatedAt())
            .updatedAt(profile.getUpdatedAt())
            .build();
    }
}
```

**Key Points:**
- ✅ Inject UserRepository
- ✅ Lookup User by profile.getUserId()
- ✅ Extract firstName, lastName, email
- ✅ Handle null User gracefully
- ✅ Convert ObjectId to String for API

---

## Repository Implementation

### Query Methods Pattern

```java
@Repository
public interface DriverProfileRepository extends MongoRepository<DriverProfile, ObjectId> {
    
    // ✅ Essential: Lookup by userId (unique)
    Optional<DriverProfile> findByUserId(ObjectId userId);
    
    // ✅ Essential: Check existence
    boolean existsByUserId(ObjectId userId);
    
    // ✅ Optional: Additional queries if needed
    List<DriverProfile> findByIsVerified(Boolean isVerified);
    
    List<DriverProfile> findByIdIn(List<ObjectId> ids);
}
```

**Key Points:**
- ✅ Always have `findByUserId()`
- ✅ Always have `existsByUserId()`
- ✅ Use unique index on userId
- ✅ Follow Spring Data naming conventions
- ✅ Avoid custom @Query if possible

---

## Entity Design

### Proper Entity Structure

```java
@Document(collection = "driver_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfile {
    
    @Id
    private ObjectId id;                                      // ✅ MongoDB primary key
    
    @Indexed(unique = true)
    private ObjectId userId;                                  // ✅ Link to User
    
    private String licenseNumber;                             // ✅ Carpooling-specific
    private String licenseDocument;                           // ✅ Carpooling-specific
    private Boolean isVerified;                               // ✅ Carpooling-specific
    private Float averageRating;                              // ✅ Profile metric
    private Integer totalRidesCompleted;                      // ✅ Profile metric
    private Float totalEarnings;                              // ✅ Profile metric
    
    private List<ObjectId> rideIds;                           // ✅ References, not embedding
    private List<ObjectId> vehicleIds;                        // ✅ References, not embedding
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // ❌ DON'T ADD USER DATA
    // private String firstName;        // ❌ Use User.firstName
    // private String email;            // ❌ Use User.email
    // private String password;         // ❌ Never duplicate
}
```

**Key Points:**
- ✅ Use ObjectId for all IDs
- ✅ Use unique index on userId
- ✅ Use regular index on foreign keys
- ✅ Use List<ObjectId> for references
- ✅ Never embed User data

---

## Testing Guidelines

### Unit Test Pattern

```java
@SpringBootTest
class DriverProfileServiceTest {
    
    @Autowired
    private DriverProfileService service;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DriverProfileRepository driverProfileRepository;
    
    @BeforeEach
    void setup() {
        driverProfileRepository.deleteAll();
        userRepository.deleteAll();
    }
    
    // ✅ Pattern: Test User integration
    @Test
    void testRegisterDriver_CreatesProfileAndUpdatesUser() {
        // Given: A user exists
        User user = User.builder()
            .id(new ObjectId())
            .firstName("John")
            .lastName("Doe")
            .email("john@example.com")
            .password("hashed")
            .roles(new ArrayList<>(List.of(Role.USER)))
            .build();
        
        userRepository.save(user);
        
        // When: Register as driver
        DriverProfileRequestDTO dto = DriverProfileRequestDTO.builder()
            .licenseNumber("DL123456")
            .licenseDocument("url")
            .build();
        
        DriverProfileResponseDTO response = service.registerDriver(dto, "john@example.com");
        
        // Then: Verify User updated
        assertNotNull(response);
        assertEquals("DL123456", response.getLicenseNumber());
        assertEquals("John Doe", response.getFullName());
        
        // And: Verify User entity changed
        User updatedUser = userRepository.findByEmail("john@example.com").orElseThrow();
        assertNotNull(updatedUser.getDriverProfileId());
        assertTrue(updatedUser.getRoles().contains(Role.DRIVER));
    }
    
    // ✅ Pattern: Test cascade
    @Test
    void testDelete_RemovesRoleFromUser() {
        // Setup: Create driver with profile
        User user = createTestUser();
        DriverProfile profile = createTestProfile(user.getId());
        
        // When: Delete profile
        service.delete(profile.getId());
        
        // Then: Verify role removed from User
        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertFalse(updatedUser.getRoles().contains(Role.DRIVER));
        assertNull(updatedUser.getDriverProfileId());
    }
}
```

### Integration Test Pattern

```java
@SpringBootTest
class CarpoolingIntegrationTest {
    
    @Test
    void testCompleteRideBookingFlow() {
        // 1. Create driver user
        User driver = createUser("driver@example.com");
        userRepository.save(driver);
        
        // 2. Register as driver
        DriverProfileRequestDTO driverDto = DriverProfileRequestDTO.builder()
            .licenseNumber("DL123456")
            .licenseDocument("url")
            .build();
        
        DriverProfileResponseDTO driverProfile = driverProfileService.registerDriver(
            driverDto, 
            "driver@example.com"
        );
        
        // 3. Create passenger user
        User passenger = createUser("passenger@example.com");
        userRepository.save(passenger);
        
        // 4. Register as passenger
        PassengerProfileRequestDTO passengerDto = PassengerProfileRequestDTO.builder()
            .preferences("Non-smoker")
            .build();
        
        PassengerProfileResponseDTO passengerProfile = passengerProfileService
            .registerPassenger(passengerDto, "passenger@example.com");
        
        // 5. Create vehicle
        VehicleRequestDTO vehicleDto = VehicleRequestDTO.builder()
            .make("Toyota")
            .model("Camry")
            .numberOfSeats(4)
            .build();
        
        VehicleResponseDTO vehicle = vehicleService.createVehicle(
            vehicleDto, 
            "driver@example.com"
        );
        
        // 6. Create ride
        RideRequestDTO rideDto = RideRequestDTO.builder()
            .vehicleId(vehicle.getId())
            .departureLocation("Tunis")
            .destinationLocation("Sfax")
            .departureTime(LocalDateTime.now().plusHours(1))
            .availableSeats(3)
            .pricePerSeat(25f)
            .build();
        
        RideResponseDTO ride = rideService.createRide(rideDto, "driver@example.com");
        
        // 7. Create booking
        BookingRequestDTO bookingDto = BookingRequestDTO.builder()
            .rideId(ride.getId())
            .numberOfSeats(2)
            .pickupLocation("Tunis Central")
            .dropoffLocation("Sfax Station")
            .build();
        
        BookingResponseDTO booking = bookingService.createBooking(
            bookingDto, 
            "passenger@example.com"
        );
        
        // Verify complete flow
        assertNotNull(booking.getId());
        assertEquals(BookingStatus.PENDING, booking.getStatus());
        
        // Verify User integration
        User updatedDriver = userRepository.findByEmail("driver@example.com").orElseThrow();
        assertTrue(updatedDriver.getRoles().contains(Role.DRIVER));
        assertNotNull(updatedDriver.getDriverProfileId());
        
        User updatedPassenger = userRepository.findByEmail("passenger@example.com").orElseThrow();
        assertTrue(updatedPassenger.getRoles().contains(Role.PASSENGER));
        assertNotNull(updatedPassenger.getPassengerProfileId());
    }
}
```

---

## Common Patterns

### User Context Extraction

```java
// In Controller
@AuthenticationPrincipal UserDetails user
String userEmail = user.getUsername();  // ✅ Email from JWT

// In Service
User user = userRepository.findByEmail(userEmail)
    .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

// In Mapper
User user = userRepository.findById(profile.getUserId()).orElse(null);
```

### Role Management

```java
// Add role
if (user.getRoles() == null) {
    user.setRoles(new ArrayList<>());
}
if (!user.getRoles().contains(Role.DRIVER)) {
    user.getRoles().add(Role.DRIVER);
}
userRepository.save(user);

// Remove role
if (user.getRoles() != null) {
    user.getRoles().remove(Role.DRIVER);
    userRepository.save(user);
}

// Check role
if (user.getRoles().contains(Role.DRIVER)) {
    // User is a driver
}
```

### Transactional Operations

```java
@Transactional
public SomeDTO someOperation(String userEmail) {
    // 1. All database operations are atomic
    // 2. If any operation fails, all are rolled back
    // 3. User updates and profile updates happen together
    
    User user = userRepository.findByEmail(userEmail);
    Profile profile = profileRepository.save(...);
    user.setProfileId(profile.getId());
    userRepository.save(user);  // Atomic with profile save
    
    return mapper.toDTO(profile);
}
```

### Error Handling

```java
// Pattern 1: User not found
if (!userRepository.existsByEmail(email)) {
    throw new ResourceNotFoundException("User", "email", email);
}

// Pattern 2: Duplicate profile
if (profileRepository.existsByUserId(user.getId())) {
    throw new IllegalStateException("Profile already exists for this user");
}

// Pattern 3: Invalid state
if (!profile.getIsVerified()) {
    throw new IllegalStateException("Driver not verified");
}

// Pattern 4: Authorization
if (!profile.getId().equals(userProfile.getId())) {
    throw new AccessDeniedException("Not owner");
}
```

---

## Checklist for New Features

When adding new Carpooling features:

- [ ] Does it require User data? → Use UserRepository
- [ ] Does it need user context? → Use email from JWT
- [ ] Does it change roles? → Update User.roles
- [ ] Does it create entities? → Link via userId ObjectId
- [ ] Does it delete entities? → Cascade properly
- [ ] Does it update User? → Make it @Transactional
- [ ] Does it return DTOs? → Enrich from User
- [ ] Is it secure? → Use @PreAuthorize or access checks
- [ ] Is it tested? → Write integration test with User
- [ ] Is it documented? → Add Swagger annotations

---

## Code Review Points

When reviewing Carpooling code:

✅ **APPROVE if:**
- Uses UserRepository for lookups
- Links entities via ObjectId only
- Updates User.roles correctly
- Has @Transactional on complex operations
- Enriches DTOs from User data
- Tests include User entity verification
- Handles null User gracefully
- Uses proper exception types

❌ **REJECT if:**
- Creates new User entity or repository
- Duplicates User fields in profiles
- Forgets to update User entity
- Missing @Transactional on multi-step operations
- Doesn't enrich responses with User data
- Tests don't verify User integration
- Hardcodes user lookup logic
- Breaks existing User functionality

---

## Final Reminders

1. **User is the source of truth** - Always reference Project Principal
2. **No duplication** - One User entity, one repository, one service
3. **Link by ObjectId** - Never embed User data
4. **Update roles** - Always maintain User.roles
5. **Enrich responses** - Use User data in DTOs
6. **Transactional** - Multiple operations must be atomic
7. **Test integration** - Verify User entity changes
8. **Security first** - Use JWT and role checks
9. **Cascade properly** - Delete cascades through relationships
10. **Document well** - Help future developers understand

---

**Stay disciplined. Keep the architecture clean. Project Principal is the source of truth.**

**Last Updated:** March 2, 2026  
**Status:** ✅ READY FOR DEVELOPMENT
