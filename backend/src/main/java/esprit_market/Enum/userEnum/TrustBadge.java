package esprit_market.Enum.userEnum;

/**
 * Trust Badge levels for seller reputation system
 * 
 * Badge assignment based on trust score:
 * - NEW_SELLER: 0-29 (Just starting, building reputation)
 * - GROWING_SELLER: 30-59 (Gaining trust, moderate performance)
 * - TRUSTED_SELLER: 60-79 (Reliable seller, good track record)
 * - TOP_SELLER: 80-100 (Excellent reputation, top performer)
 */
public enum TrustBadge {
    NEW_SELLER("New Seller", "#9CA3AF", 0, 29),
    GROWING_SELLER("Growing Seller", "#3B82F6", 30, 59),
    TRUSTED_SELLER("Trusted Seller", "#10B981", 60, 79),
    TOP_SELLER("Top Seller", "#F59E0B", 80, 100);
    
    private final String displayName;
    private final String color;
    private final int minScore;
    private final int maxScore;
    
    TrustBadge(String displayName, String color, int minScore, int maxScore) {
        this.displayName = displayName;
        this.color = color;
        this.minScore = minScore;
        this.maxScore = maxScore;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getColor() {
        return color;
    }
    
    public int getMinScore() {
        return minScore;
    }
    
    public int getMaxScore() {
        return maxScore;
    }
    
    /**
     * Get badge based on trust score
     */
    public static TrustBadge fromScore(double score) {
        if (score < 30) return NEW_SELLER;
        if (score < 60) return GROWING_SELLER;
        if (score < 80) return TRUSTED_SELLER;
        return TOP_SELLER;
    }
}
