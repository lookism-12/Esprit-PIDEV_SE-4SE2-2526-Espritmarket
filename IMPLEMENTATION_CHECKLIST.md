# IMPLEMENTATION CHECKLIST
## For Development Team - Ongoing Use
**Project Principal - EspritMarket - Carpooling Module**

---

## 📋 BEFORE STARTING NEW FEATURES

### Design Phase

- [ ] **Feature requires User data?**
  - If YES → Use UserRepository
  - If NO → Continue

- [ ] **Feature creates new entity?**
  - If YES → Add userId ObjectId field
  - If NO → Continue

- [ ] **Feature modifies roles?**
  - If YES → Plan User.roles update
  - If NO → Continue

- [ ] **Feature requires authentication?**
  - If YES → Use @AuthenticationPrincipal
  - If NO → Admin endpoint likely

### Architecture Review

- [ ] Does not create new User entity
- [ ] Does not duplicate UserRepository
- [ ] Does not override UserService
- [ ] Uses ObjectId for all references
- [ ] Maintains bi-directional linking (if applicable)
- [ ] Has clear transactional boundaries

---

## 🛠️ DURING DEVELOPMENT

### Service Implementation

- [ ] Inject UserRepository
- [ ] Accept email parameter from controller
- [ ] Use `userRepository.findByEmail(email)` for context
- [ ] Link entities via `userId(user.getId())`
- [ ] Update User roles if needed
- [ ] Make operation @Transactional
- [ ] Implement cascade delete if applicable
- [ ] Handle null User gracefully
- [ ] Log operations with SLF4J

### Controller Implementation

- [ ] Use @AuthenticationPrincipal UserDetails user
- [ ] Extract email via user.getUsername()
- [ ] Pass email to service method
- [ ] Apply @PreAuthorize for roles
- [ ] Add Swagger @Operation annotation
- [ ] Document response codes
- [ ] Handle exceptions properly

### Mapper Implementation

- [ ] Inject UserRepository
- [ ] Look up User for enrichment
- [ ] Extract firstName, lastName, email
- [ ] Handle null User gracefully
- [ ] Convert ObjectId to String
- [ ] Return null-safe DTOs

### Repository Implementation

- [ ] Extend MongoRepository<Entity, ObjectId>
- [ ] Add `findByUserId()` method
- [ ] Add `existsByUserId()` method
- [ ] Add @Indexed(unique = true) on userId
- [ ] Add other necessary queries

### Entity Implementation

- [ ] Primary key: ObjectId id
- [ ] Link field: ObjectId userId
- [ ] No User fields duplicated
- [ ] @CreatedDate and @LastModifiedDate
- [ ] @Indexed on foreign keys
- [ ] Proper Lombok annotations

---

## ✅ TESTING

### Unit Tests

- [ ] Test User lookup
- [ ] Test profile creation
- [ ] Test User entity update
- [ ] Test role assignment
- [ ] Test error cases
- [ ] Test null handling

### Integration Tests

- [ ] Test complete workflow
- [ ] Test User integration
- [ ] Test cascade operations
- [ ] Test authorization checks
- [ ] Test role-based access

### Test Execution

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=DriverProfileServiceTest

# Run with coverage
mvn test jacoco:report

# Run integration tests only
mvn test -Dgroups=integration
```

---

## 📝 CODE REVIEW CHECKLIST

### Before Submitting PR

- [ ] No new User entity created
- [ ] UserRepository properly injected
- [ ] UserService not overridden
- [ ] Email parameter passed correctly
- [ ] User.roles updated properly
- [ ] ObjectId references used
- [ ] @Transactional on complex ops
- [ ] Error handling present
- [ ] Null safety checks added
- [ ] Swagger annotations present
- [ ] Tests written and passing
- [ ] No debug logging left
- [ ] No commented code
- [ ] No magic numbers
- [ ] Variable names clear

### During Code Review

- [ ] User integration verified
- [ ] Role management correct
- [ ] Cascade operations defined
- [ ] Transactional boundaries clear
- [ ] Security checks in place
- [ ] Error messages helpful
- [ ] Tests comprehensive
- [ ] Documentation clear

---

## 🐛 DEBUGGING GUIDE

### "User not found" Exception

```java
// Check:
1. Email extracted correctly from JWT?
   → user.getUsername() returns email?
   
2. User exists in database?
   → Check users collection in MongoDB
   
3. Typo in email?
   → Case sensitivity?
   
Solution:
User user = userRepository.findByEmail(email)
    .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
```

### "Profile already exists" Exception

```java
// Check:
1. Is userId unique index working?
   → Check MongoDB index: driver_profiles → userId
   
2. Previous delete incomplete?
   → Check cascade delete logic
   
3. Same user registered twice?
   → Check controller logic
   
Solution:
if (profileRepository.existsByUserId(user.getId())) {
    throw new IllegalStateException("Profile already exists");
}
```

### "Driver not verified" Exception

```java
// Check:
1. Admin verified the driver?
   → Check isVerified field in database
   
2. Verification endpoint working?
   → Test admin endpoint
   
3. User has DRIVER role?
   → Check User.roles contains DRIVER
   
Solution:
if (!driverProfile.getIsVerified()) {
    throw new IllegalStateException("Driver not verified by admin");
}
```

### Role Not Updated

```java
// Check:
1. User.roles is null?
   → Initialize if null first
   
2. Role added but not saved?
   → Must call userRepository.save(user)
   
3. Role removed but not saved?
   → Must call userRepository.save(user)
   
Solution:
if (user.getRoles() == null) {
    user.setRoles(new ArrayList<>());
}
user.getRoles().add(Role.DRIVER);
userRepository.save(user);  // Don't forget!
```

### Null Pointer in Mapper

```java
// Check:
1. userId is null in entity?
   → Check entity creation
   
2. User lookup returns empty Optional?
   → Check null before using
   
Solution:
if (profile.getUserId() != null) {
    User user = userRepository.findById(profile.getUserId()).orElse(null);
    if (user != null) {
        fullName = user.getFirstName() + " " + user.getLastName();
    }
}
```

---

## 📈 PERFORMANCE CHECKLIST

### Query Optimization

- [ ] Is email lookup using unique index?
  - Check: `users` collection → email index

- [ ] Is userId lookup using unique index?
  - Check: `driver_profiles` → userId index

- [ ] Are foreign key lookups indexed?
  - Check: `rides.driverProfileId`, `bookings.rideId`, etc.

- [ ] Are status filters indexed?
  - Check: `rides.status`, `bookings.status`, etc.

### Memory Optimization

- [ ] Are large lists paginated?
  - Use Pageable for findAll() results

- [ ] Is lazy loading used for circular deps?
  - Use @Lazy annotation

- [ ] Are unnecessary objects created?
  - Avoid in loops

### Database Optimization

- [ ] Are collections properly sized?
  - Check collection statistics

- [ ] Are indexes being used?
  - Check MongoDB query execution plan

- [ ] Are queries returning only needed fields?
  - Use projections if possible

---

## 🔒 SECURITY CHECKLIST

### Authentication

- [ ] JWT token validated on all protected endpoints
- [ ] Email extracted from JWT claims
- [ ] @AuthenticationPrincipal used
- [ ] Authentication error handling present

### Authorization

- [ ] @PreAuthorize applied for admin operations
- [ ] Role checks before sensitive operations
- [ ] Ownership verification implemented
- [ ] No privilege escalation possible

### Data Protection

- [ ] Password never exposed in logs
- [ ] @JsonIgnore on sensitive fields
- [ ] No hardcoded secrets
- [ ] MongoDB credentials secure

### Input Validation

- [ ] @Valid on all request DTOs
- [ ] Email format validated
- [ ] ObjectId parsing handles invalid input
- [ ] String lengths limited

---

## 📚 DOCUMENTATION CHECKLIST

### Code Comments

- [ ] Complex logic explained
- [ ] Non-obvious decisions documented
- [ ] TODO comments follow convention: `// TODO: description`
- [ ] No redundant comments

### Swagger Documentation

- [ ] @Tag on controller
- [ ] @Operation on endpoint
- [ ] @Parameter on parameters
- [ ] @ApiResponse on response codes

### README/Wiki

- [ ] API endpoints documented
- [ ] Authentication explained
- [ ] Error codes listed
- [ ] Example requests provided

### Architecture Documentation

- [ ] Data model documented
- [ ] Integration points clear
- [ ] Workflow diagrams present
- [ ] Decision rationale explained

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Security review passed
- [ ] Performance tested

### During Deployment

- [ ] Backup database
- [ ] Monitor error logs
- [ ] Watch API response times
- [ ] Check user registrations
- [ ] Verify payments processed

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Monitor application
- [ ] Check MongoDB collections
- [ ] Review error logs
- [ ] Confirm feature working

---

## 📊 MONITORING CHECKLIST

### Application Metrics

- [ ] Monitor API response times (target: <100ms)
- [ ] Track error rates (target: <1%)
- [ ] Watch database query times
- [ ] Monitor memory usage
- [ ] Track CPU usage

### Business Metrics

- [ ] Driver registration rate
- [ ] Passenger registration rate
- [ ] Ride creation rate
- [ ] Booking completion rate
- [ ] Payment success rate

### Database Health

- [ ] Check collection sizes
- [ ] Verify index usage
- [ ] Monitor query performance
- [ ] Check disk space
- [ ] Review lock contention

---

## ✨ BEST PRACTICES REMINDER

### DO ✅

- ✅ Use UserRepository for all User lookups
- ✅ Pass email parameter from controllers
- ✅ Update User.roles on role changes
- ✅ Link entities via ObjectId
- ✅ Make complex operations @Transactional
- ✅ Enrich DTOs from User data
- ✅ Write integration tests
- ✅ Use @AuthenticationPrincipal
- ✅ Apply @PreAuthorize
- ✅ Handle null gracefully

### DON'T ❌

- ❌ Create new User entity
- ❌ Duplicate UserRepository
- ❌ Override UserService
- ❌ Embed User data in profiles
- ❌ Forget User updates
- ❌ Skip role management
- ❌ Make operations non-transactional
- ❌ Hardcode user context
- ❌ Skip authorization checks
- ❌ Ignore null pointers

---

## 🆘 QUICK HELP

### Common Questions

**Q: How do I get the current user?**
```java
@AuthenticationPrincipal UserDetails user
String email = user.getUsername();
User u = userRepository.findByEmail(email);
```

**Q: How do I add a role?**
```java
if (user.getRoles() == null) user.setRoles(new ArrayList<>());
if (!user.getRoles().contains(Role.DRIVER)) {
    user.getRoles().add(Role.DRIVER);
}
userRepository.save(user);
```

**Q: How do I link to User?**
```java
@Indexed(unique = true)
private ObjectId userId;  // Reference to User.id
```

**Q: How do I enrich a DTO?**
```java
User user = userRepository.findById(profile.getUserId()).orElse(null);
if (user != null) {
    dto.setFullName(user.getFirstName() + " " + user.getLastName());
}
```

**Q: How do I verify User exists?**
```java
User user = userRepository.findByEmail(email)
    .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
```

### Contact Points

For questions about:
- **Integration:** See INTEGRATION_ANALYSIS.md
- **Development:** See DEVELOPMENT_GUIDELINES.md
- **Architecture:** See EXECUTIVE_SUMMARY.md

---

## 📅 MAINTENANCE SCHEDULE

### Daily

- [ ] Review error logs
- [ ] Monitor API performance
- [ ] Check payment processing

### Weekly

- [ ] Review user registrations
- [ ] Check database size
- [ ] Monitor query performance
- [ ] Code quality metrics

### Monthly

- [ ] Archive completed rides
- [ ] Review unverified drivers
- [ ] Analyze ride statistics
- [ ] Performance report

### Quarterly

- [ ] Security audit
- [ ] Performance optimization
- [ ] Dependency updates
- [ ] Architecture review

---

## ✅ SIGN-OFF

This checklist should be used for:
- ✅ Feature development
- ✅ Code reviews
- ✅ Testing
- ✅ Deployment
- ✅ Monitoring
- ✅ Maintenance

**Print this checklist and keep it handy!**

---

**Last Updated:** March 2, 2026  
**Version:** 1.0  
**Status:** Active
