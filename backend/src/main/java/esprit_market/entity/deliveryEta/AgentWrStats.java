package esprit_market.entity.deliveryEta;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "agent_wr_stats")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentWrStats {

    @Id
    private ObjectId id;

    @Indexed(unique = true)
    private String agentId;

    private String agentName;
    private String agentEmail;

    @Builder.Default
    private int warningCount = 0;

    @Builder.Default
    private int rewardCount = 0;

    /** true when warningCount >= 3 and admin has not yet cleared the flag */
    private boolean flagged;

    /** true when rewardCount >= 3 — auto-promotion to Elite tier */
    private boolean elite;

    @Builder.Default
    private List<WrEntry> history = new ArrayList<>();

    private LocalDateTime lastUpdated;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WrEntry {
        private String type;       // "WARNING" | "REWARD"
        private String message;
        private String issuedByAdminId;
        private LocalDateTime issuedAt;
    }
}
