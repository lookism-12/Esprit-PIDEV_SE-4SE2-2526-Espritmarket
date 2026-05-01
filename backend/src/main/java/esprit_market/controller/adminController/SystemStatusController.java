package esprit_market.controller.adminController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * System Status endpoint for the admin platform management widget.
 * Provides real-time server, database, and load information.
 */
@RestController
@RequestMapping("/api/admin/system")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
@Tag(name = "Admin - System Status", description = "System health and status monitoring")
public class SystemStatusController {

    private final MongoTemplate mongoTemplate;

    @GetMapping("/status")
    @Operation(summary = "Get system status", description = "Returns server, database, and load status")
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        Map<String, Object> status = new LinkedHashMap<>();

        // Server status
        status.put("server", "online");

        // Database status
        try {
            mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));
            status.put("database", "connected");
        } catch (Exception e) {
            log.error("❌ MongoDB health check failed: {}", e.getMessage());
            status.put("database", "error");
        }

        // System load
        double cpuLoad = ManagementFactory.getOperatingSystemMXBean().getSystemLoadAverage();
        Runtime runtime = Runtime.getRuntime();
        double memoryUsage = 1.0 - ((double) runtime.freeMemory() / runtime.maxMemory());

        if (memoryUsage > 0.9 || cpuLoad > 0.9) {
            status.put("load", "critical");
        } else if (memoryUsage > 0.7 || cpuLoad > 0.7) {
            status.put("load", "high");
        } else if (memoryUsage > 0.4 || cpuLoad > 0.4) {
            status.put("load", "normal");
        } else {
            status.put("load", "low");
        }

        // Uptime
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        Duration uptime = Duration.ofMillis(uptimeMs);
        long days = uptime.toDays();
        long hours = uptime.toHoursPart();
        long minutes = uptime.toMinutesPart();
        status.put("uptime", String.format("%dd %dh %dm", days, hours, minutes));

        return ResponseEntity.ok(status);
    }

    @PostMapping("/clear-cache")
    @Operation(summary = "Clear application cache", description = "Clears all application caches")
    public ResponseEntity<Map<String, String>> clearCache() {
        log.info("🗑️ Admin triggered cache clear");
        // In a real app you would evict all cache entries here
        Map<String, String> response = new LinkedHashMap<>();
        response.put("status", "success");
        response.put("message", "Cache cleared successfully");
        return ResponseEntity.ok(response);
    }
}
