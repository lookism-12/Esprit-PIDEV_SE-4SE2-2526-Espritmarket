# Carpooling Module - Best Practices Implementation Guide

**Project:** Project Principal - EspritMarket  
**Module:** Carpooling  
**Version:** 1.0 Final  
**Date:** March 2, 2026

---

## Overview

This document outlines how the Carpooling module successfully integrates with Project Principal's User module while maintaining enterprise-grade architecture principles.

---

## Part 1: Core Integration Principles

### 1.1 Single User Entity Pattern ✅

**Implementation:**
```java
// User entity holds references to profiles
@Document(collection = "users")
public class User {
    @Id
    private ObjectId id;
    private ObjectId driverProfileId;      // Links to DriverProfile
    private ObjectId passengerProfileId;   // Links to PassengerProfile
    private List<Role> roles;              // DRIVER, PASSENGER roles
}
```

**Benefits:**
- No data duplication
- Single source of truth for user information
- Consistent authentication context
- Simplified user management

### 1.2 Dual Profile Pattern ✅

**Implementation:**
```java
// Separate profiles for different roles
@Document(collection = "driver_profiles")
public class DriverProfile {
    @Id
    private ObjectId id;
    @Indexed(unique = true)
    private ObjectId userId;  // Reference back to User
    // Driver-specific fields
}

@Document(collection = "passenger_profiles")
public class PassengerProfile {
    @Id
    private ObjectId id;
    @Indexed(unique = true)
    private ObjectId userId;  // Reference back to User
    // Passenger-specific fields
}
```

**Rationale:**
- User can be both driver and passenger
- Separation of concerns - driver stats separate from passenger stats
- Allows independent verification of driver license/credentials
- Maintains user privacy (driver info not exposed in passenger context)

### 1.3 Bi-directional Linking Pattern ✅

**Forward Reference (User → Profile):**
```java
User user = userRepository.findByEmail(email);
DriverProfile driver = driverProfileRepository.findById(user.getDriverProfileId());
```

**Reverse Reference (Profile → User):**
```java
DriverProfile driver = driverProfileRepository.findByUserId(user.getId());
User user = userRepository.findById(driver.getUserId());
```

**Implementation:**
- Forward: Via `ObjectId` field in User entity
- Reverse: Via repository `findByUserId()` method
- Ensures efficient lookups in both directions

---

## Part 2: Service Layer Best Practices

### 2.1 Dependency Injection Pattern ✅

**Example: DriverProfileService**
```java
@Service
@RequiredArgsConstructor
public class DriverProfileService implements IDriverProfileService {
    private final DriverProfileRepository driverProfileRepository;
    private final UserRepository userRepository;              // Project Principal
    private final RideRepository rideRepository;
    private final @Lazy IRideService rideService;           // Lazy to avoid circular deps
}
```

**Key Principles:**
- Required constructor injection with Lombok `@RequiredArgsConstructor`
- UserRepository explicitly injected - shows explicit dependency
- `@Lazy` used for circular dependency prevention
- Interface-based injection for flexibility

### 2.2 Email-Based Context Pattern ✅

**Usage:**
```java
public DriverProfileResponseDTO registerDriver(DriverProfileRequestDTO dto, String userEmail) {
    // Extract user from email (authenticated context)
    User user = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
    
    // Create profile linked to user
    DriverProfile profile = DriverProfile.builder()
        .userId(user.getId())  // Link to User
        .build();
}
```

**Benefits:**
- Email comes from JWT authentication principal
- No additional parameters needed
- User identity always validated
- Secure - can only operate on authenticated user's data

### 2.3 Transactional Consistency ✅

**Pattern:**
```java
@Transactional
public RideResponseDTO createRide(RideRequestDTO dto, String driverEmail) {
    // 1. Get user context
    User user = userRepository.findByEmail(driverEmail);
    
    // 2. Get profile
    DriverProfile driverProfile = driverProfileRepository.findByUserId(user.getId());
    
    // 3. Create ride
    Ride ride = rideRepository.save(ride);
    
    // 4. Update profile
    driverProfile.getRideIds().add(ride.getId());
    driverProfileRepository.save(driverProfile);
    
    // All saved atomically
}
```

**Guarantees:**
- Either all operations succeed or all fail
- No orphaned records
- Maintains referential integrity
- MongoDB transaction support for critical operations

### 2.4 Cascade Delete Pattern ✅

**Implementation:**
```java
@Transactional
public void delete(ObjectId id) {
    DriverProfile profile = driverProfileRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
    
    // 1. Find all associated rides
    List<Ride> rides = rideRepository.findByDriverProfileId(id);
    
    // 2. Cancel rides (cascades to bookings)
    for (Ride ride : rides) {
        if (!ride.getStatus().isTerminal()) {
            rideService.cancelRide(ride.getId().toHexString(), driverEmail);
        }
    }
    
    // 3. Remove role from User
    userRepository.findById(profile.getUserId()).ifPresent(user -> {
        user.getRoles().remove(Role.DRIVER);
        userRepository.save(user);
    });
    
    // 4. Delete profile
    driverProfileRepository.deleteById(id);
}
```

**Principles:**
- Explicit cascade logic (no database cascade)
- Maintains data integrity
- Prevents orphaned records
- Proper notification/cleanup possible

---

## Part 3: Repository Best Practices

### 3.1 Query Methods Pattern ✅

**Standard Methods:**
```java
@Repository
public interface DriverProfileRepository extends MongoRepository<DriverProfile, ObjectId> {
    // Lookup by user
    Optional<DriverProfile> findByUserId(ObjectId userId);
    
    // Existence check
    boolean existsByUserId(ObjectId userId);
}
```

**Rationale:**
- Spring Data MongoDB auto-implements query methods
- Naming convention: `findBy{Field}`, `existsBy{Field}`
- Type-safe queries
- No query language needed for simple cases

### 3.2 Complex Query Pattern ✅

**Example from RideRepository:**
```java
@Repository
public interface RideRepository extends MongoRepository<Ride, ObjectId> {
    
    // Simple queries
    List<Ride> findByDriverProfileId(ObjectId driverProfileId);
    List<Ride> findByStatus(RideStatus status);
    
    // Complex query with custom annotation
    @Query("{$and: [...]}")
    List<Ride> findByFilters(String departure, String destination, 
                             LocalDateTime time, Integer seats, RideStatus status);
}
```

**Options:**
- Method names (for simple queries)
- @Query annotation (for complex filtering)
- Pageable support for large result sets

---

## Part 4: DTO and Mapper Best Practices

### 4.1 Response DTO Pattern ✅

**Example: DriverProfileResponseDTO**
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfileResponseDTO {
    private String id;
    private String userId;
    private String fullName;           // Enriched from User
    private String email;               // Enriched from User
    private String licenseNumber;
    private Boolean isVerified;
    // ... other fields
}
```

**Key Features:**
- String IDs (converted from ObjectId.toHexString())
- Enriched data (fullName, email from User)
- Flattened structure (easier for API consumers)
- Builder pattern for flexibility

### 4.2 Mapper Implementation Pattern ✅

**Example: DriverProfileMapper**
```java
@Component
@RequiredArgsConstructor
public class DriverProfileMapper {
    private final UserRepository userRepository;
    
    public DriverProfileResponseDTO toResponseDTO(DriverProfile profile) {
        if (profile == null) return null;
        
        String fullName = "";
        String email = "";
        
        // Enrich with User data
        if (profile.getUserId() != null) {
            User user = userRepository.findById(profile.getUserId()).orElse(null);
            if (user != null) {
                fullName = user.getFirstName() + " " + user.getLastName();
                email = user.getEmail();
            }
        }
        
        return DriverProfileResponseDTO.builder()
            .id(profile.getId() != null ? profile.getId().toHexString() : null)
            .userId(profile.getUserId() != null ? profile.getUserId().toHexString() : null)
            .fullName(fullName)
            .email(email)
            // ... map other fields
            .build();
    }
}
```

**Principles:**
- Mappers are Spring Components (dependency injection)
- Enrichment during mapping (User lookup)
- Null safety checks
- ObjectId to String conversion

---

## Part 5: Controller Best Practices

### 5.1 Security Context Pattern ✅

**Implementation:**
```java
@RestController
@RequestMapping("/api/rides")
public class RideController {
    
    @PostMapping
    public RideResponseDTO create(
        @Valid @RequestBody RideRequestDTO dto,
        @AuthenticationPrincipal UserDetails user  // Get authenticated user
    ) {
        // user.getUsername() returns the email
        return rideService.createRide(dto, user.getUsername());
    }
    
    @PatchMapping("/{id}")
    public RideResponseDTO update(
        @PathVariable String id,
        @Valid @RequestBody RideRequestDTO dto,
        @AuthenticationPrincipal UserDetails user
    ) {
        return rideService.updateRide(id, dto, user.getUsername());
    }
}
```

**Benefits:**
- No need for additional authentication checks
- User context always available
- Secure - can't impersonate another user
- Clean, readable code

### 5.2 Authorization Pattern ✅

**Role-Based:**
```java
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public void delete(@PathVariable String id) {
    service.delete(new ObjectId(id));
}
```

**Ownership-Based:**
```java
@PatchMapping("/{id}")
public RideResponseDTO update(@PathVariable String id, ..., @AuthenticationPrincipal UserDetails user) {
    ObjectId profileId = new ObjectId(id);
    RideResponseDTO existing = service.findById(profileId);
    
    User u = userRepository.findByEmail(user.getUsername()).orElseThrow();
    
    // Check ownership
    if (!existing.getDriverProfileId().equals(u.getId().toHexString())) {
        throw new AccessDeniedException("Only the owner can update");
    }
    
    return service.update(profileId, profile);
}
```

### 5.3 API Documentation Pattern ✅

**Swagger Annotations:**
```java
@Operation(summary = "Create a new ride", 
           description = "Creates a new carpool ride for the authenticated driver")
@ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "Ride created successfully"),
    @ApiResponse(responseCode = "400", description = "Invalid input data"),
    @ApiResponse(responseCode = "401", description = "Unauthorized - valid JWT token required"),
    @ApiResponse(responseCode = "403", description = "Forbidden - driver role required")
})
public RideResponseDTO create(@Valid @RequestBody RideRequestDTO dto,
                              @AuthenticationPrincipal UserDetails user) {
    return rideService.createRide(dto, user.getUsername());
}
```

---

## Part 6: MongoDB Best Practices

### 6.1 Collection Design ✅

**Collections:**
```
users                  - User entity (Project Principal)
driver_profiles        - DriverProfile (Carpooling)
passenger_profiles     - PassengerProfile (Carpooling)
vehicles              - Vehicle (Carpooling)
rides                 - Ride (Carpooling)
bookings              - Booking (Carpooling)
ride_payments         - RidePayment (Carpooling)
ride_reviews          - RideReview (Carpooling)
```

**Rationale:**
- Separate collections prevent data mixing
- Each entity has clear responsibility
- Reduces document size (no embedding of large arrays)
- Facilitates querying and indexing

### 6.2 Indexing Strategy ✅

**Primary Indexes:**
```java
// users
@Indexed(unique = true)
private String email;

// driver_profiles
@Indexed(unique = true)
private ObjectId userId;  // No user can be driver twice

// passenger_profiles
@Indexed(unique = true)
private ObjectId userId;  // No user can be passenger twice
```

**Lookup Indexes:**
```java
@Indexed
private ObjectId driverProfileId;  // Fast lookups for driver's rides

@Indexed
private ObjectId passengerProfileId;  // Fast lookups for passenger's bookings

@Indexed
private RideStatus status;  // Filter rides by status
```

**Auto-Index Creation:**
```properties
spring.data.mongodb.auto-index-creation=true
```

---

## Part 7: Transaction Flow Examples

### 7.1 Complete Booking Workflow

**Step 1: Passenger Registration**
```
POST /api/passenger-profiles
{
  "preferences": "Non-smoker preferred"
}
Headers: Authorization: Bearer {JWT}
```

**Service Flow:**
```
1. Extract email from JWT -> "passenger@email.com"
2. Find User by email
3. Check no existing PassengerProfile for this user
4. Create PassengerProfile(userId = user.getId())
5. Update User:
   - passengerProfileId = profile.getId()
   - roles.add(PASSENGER)
6. Save User
7. Return ProfileResponseDTO
```

**Step 2: Search Rides**
```
GET /api/rides?from=Tunis&to=Sfax&date=2026-03-03T10:00:00
```

**Service Flow:**
```
1. Query Ride collection with filters
2. Filter: status = CONFIRMED, departureTime > now
3. Return RideResponseDTO[] with enriched driver names
```

**Step 3: Create Booking**
```
POST /api/bookings
{
  "rideId": "507f1f77bcf86cd799439011",
  "numberOfSeats": 2,
  "pickupLocation": "Tunis Central",
  "dropoffLocation": "Sfax Station"
}
Headers: Authorization: Bearer {JWT}
```

**Service Flow:**
```
1. Extract email from JWT
2. Find User by email
3. Find PassengerProfile by userId
4. Get Ride by ID
5. Validate:
   - Ride status = CONFIRMED
   - Enough seats available
   - Not driver's own ride
6. Calculate price = numberOfSeats * pricePerSeat
7. Create Booking(status = PENDING)
8. Add booking ID to PassengerProfile.bookingIds
9. Decrease available seats on Ride
10. Create RidePayment(status = PENDING)
11. Return BookingResponseDTO
```

### 7.2 Driver's Ride Creation Workflow

**Step 1: Register as Driver**
```
POST /api/driver-profiles
{
  "licenseNumber": "DL123456",
  "licenseDocument": "URL_to_license"
}
```

**Step 2: Add Vehicle**
```
POST /api/vehicles
{
  "make": "Toyota",
  "model": "Camry",
  "licensePlate": "1234ABC",
  "numberOfSeats": 4
}
```

**Step 3: Create Ride**
```
POST /api/rides
{
  "vehicleId": "507f1f77bcf86cd799439012",
  "departureLocation": "Tunis",
  "destinationLocation": "Sfax",
  "departureTime": "2026-03-03T10:00:00",
  "availableSeats": 3,
  "pricePerSeat": 25.0
}
```

**Validation:**
```
1. Driver profile must exist
2. Driver profile must be verified (admin check)
3. Vehicle must belong to this driver
4. Departure time must be in future
5. Price must be positive
```

---

## Part 8: Error Handling

### 8.1 Exception Hierarchy ✅

```
RuntimeException
├── IllegalArgumentException
│   └── "User not found", "Ride not found"
├── IllegalStateException
│   └── "Driver not verified", "Not enough seats"
├── AccessDeniedException (Spring Security)
│   └── "Only owner can update"
└── ResourceNotFoundException (Project Principal)
    └── "User with id not found"
```

### 8.2 HTTP Status Mapping

| Exception | HTTP Status | Message |
|-----------|------------|---------|
| IllegalArgumentException | 400 | Invalid input or resource not found |
| IllegalStateException | 400 | Invalid state transition |
| AccessDeniedException | 403 | Forbidden - no permission |
| ResourceNotFoundException | 404 | Resource not found |
| RuntimeException (other) | 500 | Internal server error |

---

## Part 9: Performance Optimization

### 9.1 Lazy Loading Pattern ✅

**Prevent Circular Dependencies:**
```java
@Service
public class DriverProfileService {
    private final @Lazy IRideService rideService;  // Lazy initialized
}

@Service
public class RideService {
    private final @Lazy IPassengerProfileService passengerProfileService;
}
```

**Benefits:**
- Prevents circular dependency on startup
- Services loaded only when needed
- Improves startup time

### 9.2 Pagination Pattern ✅

**Controller:**
```java
@GetMapping
public List<RideResponseDTO> getAll(
    @RequestParam(required = false) String departureLocation,
    Pageable pageable  // Spring provides pagination
) {
    return rideService.findByFilters(departureLocation, pageable);
}
```

**Usage:**
```
GET /api/rides?departureLocation=Tunis&page=0&size=20&sort=departureTime,desc
```

---

## Part 10: Testing Recommendations

### 10.1 Unit Test Example

```java
@Test
public void testDriverRegistration() {
    // Given
    User testUser = createTestUser("driver@test.com");
    userRepository.save(testUser);
    
    // When
    DriverProfileResponseDTO result = driverProfileService.registerDriver(
        new DriverProfileRequestDTO("DL123", "doc_url"),
        "driver@test.com"
    );
    
    // Then
    assertNotNull(result);
    assertEquals("DL123", result.getLicenseNumber());
    
    // Verify User updated
    User updatedUser = userRepository.findByEmail("driver@test.com").orElseThrow();
    assertNotNull(updatedUser.getDriverProfileId());
    assertTrue(updatedUser.getRoles().contains(Role.DRIVER));
}
```

### 10.2 Integration Test Example

```java
@SpringBootTest
public class CarpoolingIntegrationTest {
    
    @Test
    public void testCompleteBookingFlow() {
        // 1. Create users
        User driver = createUser("driver@test.com");
        User passenger = createUser("passenger@test.com");
        
        // 2. Register as driver and passenger
        DriverProfile dProfile = registerDriver(driver);
        PassengerProfile pProfile = registerPassenger(passenger);
        
        // 3. Create vehicle
        Vehicle vehicle = createVehicle(dProfile);
        
        // 4. Create ride
        Ride ride = createRide(dProfile, vehicle);
        
        // 5. Create booking
        Booking booking = createBooking(pProfile, ride);
        
        // 6. Verify
        assertNotNull(booking.getId());
        assertEquals(BookingStatus.PENDING, booking.getStatus());
    }
}
```

---

## Part 11: Deployment Checklist

- [ ] Update JWT secret (minimum 32 characters)
- [ ] Configure MongoDB connection string for production
- [ ] Set admin password via environment variable
- [ ] Enable HTTPS for API endpoints
- [ ] Configure CORS for frontend domain
- [ ] Set logging levels (INFO for production)
- [ ] Enable request/response logging (optional)
- [ ] Test cascade delete operations
- [ ] Verify role-based authorization
- [ ] Load test ride search functionality
- [ ] Test payment flow with test credentials
- [ ] Review API documentation (/swagger-ui.html)

---

## Part 12: Maintenance Guidelines

### Regular Tasks
- Monitor User/DriverProfile/PassengerProfile ratio
- Archive completed rides monthly
- Review unverified drivers regularly
- Check for orphaned bookings/payments
- Monitor ride search performance

### Code Updates
- Keep Spring Boot updated
- Update MongoDB driver version
- Review security vulnerabilities
- Refactor based on usage patterns

---

## Conclusion

The Carpooling module follows enterprise best practices:
- ✅ Single responsibility principle
- ✅ Dependency injection throughout
- ✅ Transactional consistency
- ✅ Secure authentication/authorization
- ✅ Comprehensive API documentation
- ✅ Proper error handling
- ✅ Performance optimization
- ✅ Testability

**Ready for production deployment.**

---

**Document Version:** 1.0  
**Last Updated:** March 2, 2026  
**Maintained By:** Full Stack Spring Boot Development Team
