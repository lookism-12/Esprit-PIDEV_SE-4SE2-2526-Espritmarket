# Complete Build Fix Guide

## Current Status: Lombok Not Processing ❌

The build is failing because Lombok annotations are not being processed during compilation. This means getters, setters, builders, and the `log` field are not being generated.

## Quick Fix (Choose One Method)

### Method 1: Use the Rebuild Script (Easiest)

**On Windows:**
```cmd
cd backend
rebuild.bat
```

**On Linux/Mac:**
```bash
cd backend
chmod +x rebuild.sh
./rebuild.sh
```

### Method 2: Manual Commands

**On Windows:**
```cmd
cd backend
rmdir /s /q target
mvnw.cmd clean
mvnw.cmd compile -DskipTests
```

**On Linux/Mac:**
```bash
cd backend
rm -rf target
./mvnw clean
./mvnw compile -DskipTests
```

### Method 3: Using Maven Directly (if installed)

```bash
cd backend
mvn clean compile -DskipTests
```

## Why This Is Happening

Lombok uses **annotation processing** to generate code at compile time. The errors you're seeing mean this processing isn't happening:

- `cannot find symbol variable log` → `@Slf4j` not processed
- `cannot find symbol method getUserId()` → `@Data` not processed
- `cannot find symbol method builder()` → `@Builder` not processed

## What I've Already Fixed

✅ Added `@Builder` to all DTOs
✅ Updated controller to use builder pattern
✅ Verified pom.xml has correct Lombok configuration
✅ Added missing repository methods

## If Build Still Fails

### Check 1: Verify Java Version
```bash
java -version
```
Should show Java 17 or higher.

### Check 2: Verify Maven Version
```bash
mvn -version
```
or
```bash
./mvnw -version
```

### Check 3: Check IDE Settings

**IntelliJ IDEA:**
1. File → Settings → Build, Execution, Deployment → Compiler → Annotation Processors
2. ✅ Enable annotation processing
3. File → Invalidate Caches → Invalidate and Restart

**Eclipse:**
1. Project → Properties → Java Compiler → Annotation Processing
2. ✅ Enable annotation processing
3. ✅ Enable processing in editor

**VS Code:**
1. Install "Language Support for Java(TM) by Red Hat"
2. Reload window

### Check 4: Verify Lombok in pom.xml

Open `backend/pom.xml` and verify:

```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.30</version>
    <scope>provided</scope>
</dependency>
```

And in the build section:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>3.11.0</version>
    <configuration>
        <source>17</source>
        <target>17</target>
        <annotationProcessorPaths>
            <path>
                <groupId>org.projectlombok</groupId>
                <artifactId>lombok</artifactId>
                <version>1.18.30</version>
            </path>
        </annotationProcessorPaths>
    </configuration>
</plugin>
```

## Alternative: Skip Recommendation Module (Temporary)

If you need to build urgently and don't need the recommendation feature, you can temporarily comment out the recommendation-related code:

1. Comment out `@Slf4j` in `RecommendationController.java`
2. Replace `log.info(...)` with `System.out.println(...)`
3. This is NOT recommended for production

## Expected Output After Successful Build

```
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  XX.XXX s
[INFO] Finished at: 2026-05-02T...
[INFO] ------------------------------------------------------------------------
```

## Files That Need Lombok to Work

1. `RecommendationController.java` - Uses `@Slf4j` for logging
2. `RecommendationDTO.java` - Uses `@Data` and `@Builder`
3. `FeedbackRequestDTO.java` - Uses `@Data` and `@Builder`
4. `FeedbackResponseDTO.java` - Uses `@Data` and `@Builder`
5. `AdvancedLoyaltyController.java` - Uses `@Slf4j` and `@RequiredArgsConstructor`
6. `AdvancedLoyaltyService.java` - Uses `@Slf4j` and `@RequiredArgsConstructor`
7. And many other files...

## Next Steps After Build Succeeds

1. ✅ Insert sample loyalty rewards (see `INSERT_SAMPLE_REWARDS.js`)
2. ✅ Restart Spring Boot application
3. ✅ Test loyalty dashboard at `/profile/loyalty`
4. ✅ Test recommendation endpoints

## Still Having Issues?

If the build still fails after trying all the above:

1. **Share the full error output** - Run with `-X` flag for debug output:
   ```bash
   mvnw compile -DskipTests -X > build-log.txt 2>&1
   ```

2. **Check if Lombok jar is downloaded**:
   ```bash
   ls ~/.m2/repository/org/projectlombok/lombok/1.18.30/
   ```
   Should show `lombok-1.18.30.jar`

3. **Try updating Lombok version** in pom.xml to latest (1.18.32)

4. **Nuclear option** - Delete Maven cache and rebuild:
   ```bash
   rm -rf ~/.m2/repository/org/projectlombok
   mvnw clean compile -DskipTests
   ```

## Contact

If none of these work, the issue might be:
- Firewall blocking Maven downloads
- Corrupted Maven repository
- IDE-specific configuration issue
- Java version mismatch

Run the rebuild script and share the output if it still fails.
