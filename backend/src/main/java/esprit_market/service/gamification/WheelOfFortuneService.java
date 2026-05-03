package esprit_market.service.gamification;

import esprit_market.dto.gamification.*;
import esprit_market.entity.gamification.*;
import esprit_market.entity.user.User;
import esprit_market.repository.gamification.RewardRepository;
import esprit_market.repository.gamification.SpinHistoryRepository;
import esprit_market.repository.userRepository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WheelOfFortuneService {

    private final RewardRepository rewardRepository;
    private final SpinHistoryRepository spinHistoryRepository;
    private final UserRepository userRepository;
    private final Random random = new Random();

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /** Spin the wheel for a user — core business logic. */
    public SpinResultDTO spin(ObjectId userId, HttpServletRequest request) {
        log.info("User {} attempting to spin the wheel", userId);

        // 1. Daily limit check
        LocalDate today = LocalDate.now();
        if (spinHistoryRepository.findByUserIdAndSpinDate(userId, today).isPresent()) {
            throw new RuntimeException("You have already spun the wheel today. Come back tomorrow!");
        }

        // 2. Determine user segment
        UserSegment userSegment = determineUserSegment(userId);
        log.info("User {} segment: {}", userId, userSegment);

        // 3. Load eligible rewards
        List<UserSegment> eligibleSegments = Arrays.asList(userSegment, UserSegment.ALL);
        List<Reward> rewards = rewardRepository.findByActiveTrueAndTargetSegmentIn(eligibleSegments);

        if (rewards.isEmpty()) {
            // Fallback: load ALL active rewards so the wheel never fails
            rewards = rewardRepository.findByActiveTrue();
        }
        if (rewards.isEmpty()) {
            throw new RuntimeException("No rewards configured. Please contact support.");
        }

        // 4. Weighted random selection
        Reward selected = selectRewardByProbability(rewards, userSegment);
        log.info("Selected reward: {} ({})", selected.getLabel(), selected.getType());

        // 5. Persist spin history
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiryDate = (selected.getExpiryDays() != null && selected.getExpiryDays() > 0)
                ? now.plusDays(selected.getExpiryDays())
                : null;

        SpinHistory history = SpinHistory.builder()
                .userId(userId)
                .rewardId(selected.getId())
                .spinDate(today)
                .spinTimestamp(now)
                .claimed(false)
                .ipAddress(getClientIp(request))
                .userAgent(request.getHeader("User-Agent"))
                .rewardLabel(selected.getLabel())
                .rewardType(selected.getType())
                .rewardValue(selected.getValue())
                .expiryDate(expiryDate)
                .build();

        history = spinHistoryRepository.save(history);
        log.info("Spin history saved: {}", history.getId());

        // 6. Build response (segment index + rotation for frontend animation)
        int segmentIndex = rewards.indexOf(selected);
        double rotationDegrees = calculateRotation(segmentIndex, rewards.size());

        return SpinResultDTO.builder()
                .spinId(history.getId().toHexString())
                .reward(toRewardDTO(selected))
                .segmentIndex(segmentIndex)
                .rotationDegrees(rotationDegrees)
                .expiryDate(expiryDate)
                .message(buildWinMessage(selected))
                .success(true)
                .build();
    }

    /** Returns active rewards visible to this user (segment-aware). */
    public List<RewardDTO> getActiveRewards(ObjectId userId) {
        UserSegment segment = determineUserSegment(userId);
        List<UserSegment> eligible = Arrays.asList(segment, UserSegment.ALL);
        List<Reward> rewards = rewardRepository.findByActiveTrueAndTargetSegmentIn(eligible);

        // Fallback: if segment query returns nothing, show all active rewards
        if (rewards.isEmpty()) {
            rewards = rewardRepository.findByActiveTrue();
        }

        return rewards.stream().map(this::toRewardDTO).collect(Collectors.toList());
    }

    /** True when the user has NOT yet spun today. */
    public boolean canSpinToday(ObjectId userId) {
        return spinHistoryRepository.findByUserIdAndSpinDate(userId, LocalDate.now()).isEmpty();
    }

    /** Paginated spin history for the user. */
    public Page<SpinHistoryDTO> getUserSpinHistory(ObjectId userId, int page, int size) {
        return spinHistoryRepository
                .findByUserIdOrderBySpinTimestampDesc(userId, PageRequest.of(page, size))
                .map(this::toSpinHistoryDTO);
    }

    /** Unclaimed, non-expired rewards for the user. */
    public List<SpinHistoryDTO> getUnclaimedRewards(ObjectId userId) {
        return spinHistoryRepository
                .findByUserIdAndClaimedFalseAndExpiryDateAfter(userId, LocalDateTime.now())
                .stream()
                .map(this::toSpinHistoryDTO)
                .collect(Collectors.toList());
    }

    /** Mark a spin reward as claimed. */
    public void claimReward(ObjectId spinId, ObjectId userId) {
        SpinHistory spin = spinHistoryRepository.findById(spinId)
                .orElseThrow(() -> new RuntimeException("Spin not found"));

        if (!spin.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (Boolean.TRUE.equals(spin.getClaimed())) {
            throw new RuntimeException("Reward already claimed");
        }
        if (spin.getExpiryDate() != null && spin.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reward has expired");
        }

        spin.setClaimed(true);
        spin.setClaimedAt(LocalDateTime.now());
        spinHistoryRepository.save(spin);
        log.info("Reward claimed: spinId={} userId={}", spinId, userId);
    }

    /** Admin analytics. */
    public WheelStatsDTO getStatistics() {
        List<SpinHistory> all = spinHistoryRepository.findAll();
        LocalDate today = LocalDate.now();

        Map<String, Long> distribution = all.stream()
                .filter(s -> s.getRewardLabel() != null)
                .collect(Collectors.groupingBy(SpinHistory::getRewardLabel, Collectors.counting()));

        return WheelStatsDTO.builder()
                .totalSpins((long) all.size())
                .totalSpinsToday(spinHistoryRepository.countBySpinDate(today))
                .uniqueUsers(all.stream().map(SpinHistory::getUserId).distinct().count())
                .rewardDistribution(distribution)
                .conversionRate(0.0)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private UserSegment determineUserSegment(ObjectId userId) {
        List<SpinHistory> history = spinHistoryRepository.findByUserId(userId);
        if (history.isEmpty()) {
            return UserSegment.NEW;
        }
        // VIP: trust score ≥ 80
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getTrustScore() >= 80) {
            return UserSegment.VIP;
        }
        return UserSegment.RETURNING;
    }

    private Reward selectRewardByProbability(List<Reward> rewards, UserSegment segment) {
        List<Integer> weights = rewards.stream()
                .map(r -> adjustWeight(r, segment))
                .collect(Collectors.toList());

        int total = weights.stream().mapToInt(Integer::intValue).sum();
        int roll = random.nextInt(Math.max(total, 1));

        int cumulative = 0;
        for (int i = 0; i < rewards.size(); i++) {
            cumulative += weights.get(i);
            if (roll < cumulative) {
                return rewards.get(i);
            }
        }
        return rewards.get(0); // fallback
    }

    private int adjustWeight(Reward reward, UserSegment segment) {
        int base = reward.getProbability() != null ? reward.getProbability() : 10;

        // Bad rewards are never boosted — they stay at base weight regardless of segment
        if (reward.getType() == RewardType.NO_LUCK) {
            if (segment == UserSegment.NEW) return Math.max(1, base / 2); // halved for new users
            return base;
        }

        // Good rewards get a boost for new and VIP users
        if (segment == UserSegment.NEW) {
            if (reward.getType() == RewardType.DISCOUNT || reward.getType() == RewardType.FREE_SHIPPING)
                return (int) (base * 1.5);
            if (reward.getType() == RewardType.POINTS)
                return (int) (base * 1.2);
        } else if (segment == UserSegment.VIP) {
            if (reward.getValue() != null && reward.getValue() >= 20) return (int) (base * 1.4);
            if (reward.getType() == RewardType.FREE_SHIPPING)         return (int) (base * 1.2);
        }

        return base;
    }

    private double calculateRotation(int segmentIndex, int totalSegments) {
        double segmentAngle = 360.0 / totalSegments;
        double targetAngle = segmentIndex * segmentAngle + (segmentAngle / 2.0);
        int fullRotations = 5 + random.nextInt(3);
        double total = (fullRotations * 360.0) + targetAngle;
        total += (random.nextDouble() - 0.5) * (segmentAngle * 0.3); // small natural jitter
        return total;
    }

    private String buildWinMessage(Reward reward) {
        if (reward.getType() != RewardType.NO_LUCK) {
            return switch (reward.getType()) {
                case DISCOUNT -> String.format("🎉 Congratulations! You won %d%% OFF your next order!",
                        reward.getValue() != null ? reward.getValue().intValue() : 0);
                case FREE_SHIPPING -> "🚚 Awesome! You won FREE SHIPPING on your next order!";
                case POINTS -> String.format("⭐ Great! You earned %d loyalty points!",
                        reward.getValue() != null ? reward.getValue().intValue() : 0);
                case COUPON -> String.format("🎫 You won a special coupon: %s", reward.getCouponCode());
                default -> "🎁 You won a reward!";
            };
        }
        // Bad reward — use the label to pick a snarky message
        return switch (reward.getLabel()) {
            case "+5% Price"      -> "😈 Prices just went up 5% for you. The wheel has a dark side!";
            case "Expired Coupon" -> "🗑️ You got a coupon... it expired yesterday. Ouch!";
            case "Nothing Today"  -> "💀 The wheel has spoken: absolutely nothing. See you tomorrow!";
            default               -> "😊 Better luck next time! Come back tomorrow!";
        };
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        return (ip != null && !ip.isEmpty()) ? ip.split(",")[0].trim() : request.getRemoteAddr();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAPPERS
    // ─────────────────────────────────────────────────────────────────────────

    private RewardDTO toRewardDTO(Reward r) {
        return RewardDTO.builder()
                .id(r.getId().toHexString())
                .label(r.getLabel())
                .type(r.getType())
                .value(r.getValue())
                .probability(r.getProbability())
                .active(r.getActive())
                .color(r.getColor())
                .icon(r.getIcon())
                .description(r.getDescription())
                .couponCode(r.getCouponCode())
                .minOrderValue(r.getMinOrderValue())
                .expiryDays(r.getExpiryDays())
                .targetSegment(r.getTargetSegment())
                .build();
    }

    private SpinHistoryDTO toSpinHistoryDTO(SpinHistory h) {
        return SpinHistoryDTO.builder()
                .id(h.getId().toHexString())
                .userId(h.getUserId().toHexString())
                .rewardId(h.getRewardId() != null ? h.getRewardId().toHexString() : null)
                .rewardLabel(h.getRewardLabel())
                .rewardType(h.getRewardType())
                .rewardValue(h.getRewardValue())
                .spinTimestamp(h.getSpinTimestamp())
                .claimed(h.getClaimed())
                .claimedAt(h.getClaimedAt())
                .expiryDate(h.getExpiryDate())
                .build();
    }
}
