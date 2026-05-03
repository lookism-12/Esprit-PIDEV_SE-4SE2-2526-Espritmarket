package esprit_market.service.SAVService;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Computes a numeric priority score for SAV items based on keyword analysis.
 *
 * Two scoring modes:
 *
 * ── NEGATIVE (SAV claims) ─────────────────────────────────────────────────
 *   "urgent"            → +5
 *   "fraud" / "scam"    → +4 each
 *   "error" / "problem" → +3 each
 *   "bad"  / "terrible" → +2 each
 *
 *   Label thresholds:  score ≥ 5 → HIGH | score ≥ 2 → MEDIUM | else → LOW
 *
 * ── POSITIVE (FEEDBACK reviews) ──────────────────────────────────────────
 *   "excellent" / "amazing" / "perfect" → +5 each
 *   "great" / "love" / "fantastic"      → +4 each
 *   "good" / "nice" / "happy"           → +3 each
 *   "ok" / "fine" / "decent"            → +2 each
 *
 *   Label thresholds:  score ≥ 5 → HIGH (top review) | score ≥ 2 → MEDIUM | else → LOW
 *
 * Rules:
 *  - Null/blank fields are safely skipped (no NPE).
 *  - Multiple keyword hits accumulate.
 *  - Score is always ≥ 0.
 *  - No external APIs, no regex — simple toLowerCase + contains.
 */
@Component
public class ClaimPriorityScorer {

    /** Negative keywords for SAV claims (urgency / frustration signals). */
    private static final Map<String, Integer> NEGATIVE_SCORES = Map.of(
            "urgent",    5,
            "fraud",     4,
            "scam",      4,
            "error",     3,
            "problem",   3,
            "bad",       2,
            "terrible",  2
    );

    /** Positive keywords for FEEDBACK reviews (satisfaction signals). */
    private static final Map<String, Integer> POSITIVE_SCORES = Map.ofEntries(
            Map.entry("excellent",  5),
            Map.entry("amazing",    5),
            Map.entry("perfect",    5),
            Map.entry("great",      4),
            Map.entry("love",       4),
            Map.entry("fantastic",  4),
            Map.entry("good",       3),
            Map.entry("nice",       3),
            Map.entry("happy",      3),
            Map.entry("ok",         2),
            Map.entry("fine",       2),
            Map.entry("decent",     2)
    );

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Compute negative-keyword score (for SAV claims).
     * Higher score = more urgent / problematic.
     */
    public int compute(String... fields) {
        return scan(NEGATIVE_SCORES, fields);
    }

    /**
     * Compute positive-keyword score (for FEEDBACK reviews).
     * Higher score = more enthusiastic / positive.
     */
    public int computePositive(String... fields) {
        return scan(POSITIVE_SCORES, fields);
    }

    /**
     * Derive a human-readable priority label from a numeric score.
     *
     * Works for both claim and feedback scores:
     *   score ≥ 5  → HIGH
     *   score ≥ 2  → MEDIUM
     *   otherwise  → LOW
     */
    public String scoreToLabel(int score) {
        if (score >= 5) return "HIGH";
        if (score >= 2) return "MEDIUM";
        return "LOW";
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private int scan(Map<String, Integer> keywords, String... fields) {
        StringBuilder combined = new StringBuilder();
        for (String field : fields) {
            if (field != null && !field.isBlank()) {
                combined.append(' ').append(field.toLowerCase());
            }
        }
        String text = combined.toString();
        if (text.isBlank()) return 0;

        int score = 0;
        for (Map.Entry<String, Integer> entry : keywords.entrySet()) {
            if (text.contains(entry.getKey())) {
                score += entry.getValue();
            }
        }
        return score;
    }
}
