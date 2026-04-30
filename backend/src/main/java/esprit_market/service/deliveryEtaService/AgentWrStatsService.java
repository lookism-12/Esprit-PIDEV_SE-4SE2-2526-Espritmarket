package esprit_market.service.deliveryEtaService;

import esprit_market.dto.deliveryEta.AgentWrStatsDTO;
import esprit_market.entity.deliveryEta.AgentWrStats;
import esprit_market.repository.deliveryEtaRepository.AgentWrStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgentWrStatsService {

    private static final int THRESHOLD = 3;

    private final AgentWrStatsRepository repository;

    // ── Queries ───────────────────────────────────────────────────────────────

    public AgentWrStatsDTO getStats(String agentId) {
        return repository.findByAgentId(agentId)
                .map(this::toDTO)
                .orElseGet(() -> buildEmpty(agentId));
    }

    public List<AgentWrStatsDTO> getAllStats() {
        return repository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<AgentWrStatsDTO> getFlaggedAgents() {
        return repository.findAllByFlaggedTrue().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<AgentWrStatsDTO> getEliteAgents() {
        return repository.findAllByEliteTrue().stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    public AgentWrStatsDTO addWarning(String agentId, String agentName, String agentEmail,
                                      String message, String issuedByAdminId) {
        AgentWrStats stats = getOrCreate(agentId, agentName, agentEmail);

        AgentWrStats.WrEntry entry = AgentWrStats.WrEntry.builder()
                .type("WARNING")
                .message(message)
                .issuedByAdminId(issuedByAdminId)
                .issuedAt(LocalDateTime.now())
                .build();

        stats.getHistory().add(entry);
        stats.setWarningCount(stats.getWarningCount() + 1);
        stats.setFlagged(stats.getWarningCount() >= THRESHOLD);
        stats.setLastUpdated(LocalDateTime.now());

        return toDTO(repository.save(stats));
    }

    public AgentWrStatsDTO addReward(String agentId, String agentName, String agentEmail,
                                     String message, String issuedByAdminId) {
        AgentWrStats stats = getOrCreate(agentId, agentName, agentEmail);

        AgentWrStats.WrEntry entry = AgentWrStats.WrEntry.builder()
                .type("REWARD")
                .message(message)
                .issuedByAdminId(issuedByAdminId)
                .issuedAt(LocalDateTime.now())
                .build();

        stats.getHistory().add(entry);
        stats.setRewardCount(stats.getRewardCount() + 1);
        stats.setElite(stats.getRewardCount() >= THRESHOLD);
        stats.setLastUpdated(LocalDateTime.now());

        return toDTO(repository.save(stats));
    }

    /** Clears warnings and removes the FLAGGED status — rehabilitation action */
    public AgentWrStatsDTO rehabilitate(String agentId) {
        AgentWrStats stats = getOrCreate(agentId, null, null);
        stats.setWarningCount(0);
        stats.setFlagged(false);
        stats.setLastUpdated(LocalDateTime.now());
        return toDTO(repository.save(stats));
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private AgentWrStats getOrCreate(String agentId, String agentName, String agentEmail) {
        return repository.findByAgentId(agentId).orElseGet(() -> {
            AgentWrStats fresh = AgentWrStats.builder()
                    .agentId(agentId)
                    .agentName(agentName != null ? agentName : "Unknown")
                    .agentEmail(agentEmail != null ? agentEmail : "")
                    .warningCount(0)
                    .rewardCount(0)
                    .flagged(false)
                    .elite(false)
                    .build();
            return repository.save(fresh);
        });
    }

    private AgentWrStatsDTO toDTO(AgentWrStats stats) {
        List<AgentWrStatsDTO.WrEntryDTO> historyDTOs = stats.getHistory().stream()
                .map(e -> AgentWrStatsDTO.WrEntryDTO.builder()
                        .type(e.getType())
                        .message(e.getMessage())
                        .issuedByAdminId(e.getIssuedByAdminId())
                        .issuedAt(e.getIssuedAt())
                        .build())
                .collect(Collectors.toList());

        return AgentWrStatsDTO.builder()
                .agentId(stats.getAgentId())
                .agentName(stats.getAgentName())
                .agentEmail(stats.getAgentEmail())
                .warningCount(stats.getWarningCount())
                .rewardCount(stats.getRewardCount())
                .flagged(stats.isFlagged())
                .elite(stats.isElite())
                .history(historyDTOs)
                .lastUpdated(stats.getLastUpdated())
                .build();
    }

    private AgentWrStatsDTO buildEmpty(String agentId) {
        return AgentWrStatsDTO.builder()
                .agentId(agentId)
                .agentName("Unknown")
                .agentEmail("")
                .warningCount(0)
                .rewardCount(0)
                .flagged(false)
                .elite(false)
                .history(List.of())
                .build();
    }
}
