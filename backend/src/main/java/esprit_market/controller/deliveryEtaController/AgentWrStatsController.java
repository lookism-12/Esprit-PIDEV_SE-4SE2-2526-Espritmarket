package esprit_market.controller.deliveryEtaController;

import esprit_market.dto.deliveryEta.AgentWrStatsDTO;
import esprit_market.service.deliveryEtaService.AgentWrStatsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/delivery-agents")
@RequiredArgsConstructor
@Tag(name = "Agent W&R Stats", description = "Warnings and Rewards tracking for delivery agents")
public class AgentWrStatsController {

    private final AgentWrStatsService wrStatsService;

    /** Get stats for a single agent — accessible by the agent themselves and admins */
    @GetMapping("/{agentId}/wr-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'DELIVERY')")
    public ResponseEntity<AgentWrStatsDTO> getStats(@PathVariable String agentId) {
        return ResponseEntity.ok(wrStatsService.getStats(agentId));
    }

    /** Get all agent stats — admin only */
    @GetMapping("/wr-stats/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AgentWrStatsDTO>> getAllStats() {
        return ResponseEntity.ok(wrStatsService.getAllStats());
    }

    /** Flagged agents (≥3 warnings) */
    @GetMapping("/wr-stats/flagged")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AgentWrStatsDTO>> getFlagged() {
        return ResponseEntity.ok(wrStatsService.getFlaggedAgents());
    }

    /** Elite agents (≥3 rewards) */
    @GetMapping("/wr-stats/elite")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AgentWrStatsDTO>> getElite() {
        return ResponseEntity.ok(wrStatsService.getEliteAgents());
    }

    /** Admin issues a WARNING to an agent */
    @PostMapping("/{agentId}/warning")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgentWrStatsDTO> addWarning(
            @PathVariable String agentId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(wrStatsService.addWarning(
                agentId,
                body.getOrDefault("agentName", ""),
                body.getOrDefault("agentEmail", ""),
                body.getOrDefault("message", "Performance warning issued."),
                body.getOrDefault("issuedByAdminId", "admin")
        ));
    }

    /** Admin issues a REWARD to an agent */
    @PostMapping("/{agentId}/reward")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgentWrStatsDTO> addReward(
            @PathVariable String agentId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(wrStatsService.addReward(
                agentId,
                body.getOrDefault("agentName", ""),
                body.getOrDefault("agentEmail", ""),
                body.getOrDefault("message", "Performance reward granted."),
                body.getOrDefault("issuedByAdminId", "admin")
        ));
    }

    /** Admin rehabilitates a flagged agent — clears warnings */
    @PostMapping("/{agentId}/rehabilitate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgentWrStatsDTO> rehabilitate(@PathVariable String agentId) {
        return ResponseEntity.ok(wrStatsService.rehabilitate(agentId));
    }
}
