package esprit_market.dto.deliveryEta;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentWrStatsDTO {
    private String agentId;
    private String agentName;
    private String agentEmail;
    private int warningCount;
    private int rewardCount;
    private boolean flagged;
    private boolean elite;
    private List<WrEntryDTO> history;
    private LocalDateTime lastUpdated;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WrEntryDTO {
        private String type;
        private String message;
        private String issuedByAdminId;
        private LocalDateTime issuedAt;
    }
}
