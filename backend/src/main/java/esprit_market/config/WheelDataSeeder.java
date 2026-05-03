package esprit_market.config;

import esprit_market.entity.gamification.Reward;
import esprit_market.entity.gamification.RewardType;
import esprit_market.entity.gamification.UserSegment;
import esprit_market.repository.gamification.RewardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.util.List;

/**
 * Wheel of Fortune reward seeder.
 *
 * Probability cheat-sheet (total weight = 200):
 *
 *  GOOD rewards  (weight 130 / 200 = 65 %)
 *  ─────────────────────────────────────────
 *  50% OFF          →  8   (4 %)   rare jackpot
 *  30% OFF          → 14   (7 %)
 *  20% OFF          → 22  (11 %)
 *  Free Shipping    → 26  (13 %)
 *  10% OFF          → 28  (14 %)
 *  100 Points       → 16   (8 %)
 *  50 Points        → 16   (8 %)
 *
 *  BAD rewards   (weight  70 / 200 = 35 %)
 *  ─────────────────────────────────────────
 *  Try Again        → 30  (15 %)   most common bad
 *  +5% Price        → 18   (9 %)   price bump troll
 *  Expired Coupon   → 12   (6 %)   useless coupon
 *  Nothing Today    → 10   (5 %)   hard no-luck
 *
 * The adjustWeight() method in WheelOfFortuneService further boosts
 * good rewards by 1.5× for NEW users and 1.3× for VIP users, so the
 * effective good-reward rate for new users is ~75 %.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class WheelDataSeeder {

    private final RewardRepository rewardRepository;

    @Bean
    @Order(2)
    public CommandLineRunner wheelRewardSeeder() {
        return args -> {
            // Always wipe and re-seed so changes here take effect on restart
            rewardRepository.deleteAll();
            log.info("Re-seeding Wheel of Fortune rewards...");

            List<Reward> rewards = List.of(

                // ── GOOD REWARDS ──────────────────────────────────────────────

                Reward.builder()
                        .label("50% OFF").type(RewardType.DISCOUNT).value(50.0)
                        .probability(8)          // jackpot — rare but real
                        .active(true).color("#FF4757").icon("🎁")
                        .description("Massive 50% off your next order! Min. spend 50 TND.")
                        .minOrderValue(50.0).expiryDays(5).targetSegment(UserSegment.NEW)
                        .build(),

                Reward.builder()
                        .label("30% OFF").type(RewardType.DISCOUNT).value(30.0)
                        .probability(14)
                        .active(true).color("#2ED573").icon("💎")
                        .description("30% discount on your next order! Min. spend 30 TND.")
                        .minOrderValue(30.0).expiryDays(14).targetSegment(UserSegment.ALL)
                        .build(),

                Reward.builder()
                        .label("20% OFF").type(RewardType.DISCOUNT).value(20.0)
                        .probability(22)
                        .active(true).color("#1E90FF").icon("🎉")
                        .description("20% off your next purchase! Min. spend 20 TND.")
                        .minOrderValue(20.0).expiryDays(30).targetSegment(UserSegment.ALL)
                        .build(),

                Reward.builder()
                        .label("Free Shipping").type(RewardType.FREE_SHIPPING).value(0.0)
                        .probability(26)         // most common good reward
                        .active(true).color("#FFD700").icon("🚚")
                        .description("Free delivery on your next order — no minimum!")
                        .minOrderValue(0.0).expiryDays(30).targetSegment(UserSegment.ALL)
                        .build(),

                Reward.builder()
                        .label("10% OFF").type(RewardType.DISCOUNT).value(10.0)
                        .probability(28)         // second most common good reward
                        .active(true).color("#7BED9F").icon("✨")
                        .description("10% off your next order! Min. spend 10 TND.")
                        .minOrderValue(10.0).expiryDays(30).targetSegment(UserSegment.ALL)
                        .build(),

                Reward.builder()
                        .label("100 Points").type(RewardType.POINTS).value(100.0)
                        .probability(16)
                        .active(true).color("#A29BFE").icon("⭐")
                        .description("100 loyalty points added to your account instantly!")
                        .expiryDays(0).targetSegment(UserSegment.RETURNING)
                        .build(),

                Reward.builder()
                        .label("50 Points").type(RewardType.POINTS).value(50.0)
                        .probability(16)
                        .active(true).color("#FD79A8").icon("🌟")
                        .description("50 loyalty points — every spin counts!")
                        .expiryDays(0).targetSegment(UserSegment.ALL)
                        .build(),

                // ── BAD REWARDS ───────────────────────────────────────────────

                Reward.builder()
                        .label("Try Again").type(RewardType.NO_LUCK).value(0.0)
                        .probability(30)         // most common bad — still feels fair
                        .active(true).color("#DFE6E9").icon("🍀")
                        .description("Not your day! Come back tomorrow for another spin.")
                        .expiryDays(0).targetSegment(UserSegment.ALL)
                        .build(),

                Reward.builder()
                        .label("+5% Price").type(RewardType.NO_LUCK).value(0.0)
                        .probability(18)         // troll reward — price bump
                        .active(true).color("#FF6348").icon("😈")
                        .description("Oops! Prices just went up 5% for you today. Better luck next time!")
                        .expiryDays(0).targetSegment(UserSegment.ALL)
                        .build(),

                Reward.builder()
                        .label("Expired Coupon").type(RewardType.NO_LUCK).value(0.0)
                        .probability(12)         // useless coupon troll
                        .active(true).color("#B2BEC3").icon("🗑️")
                        .description("You got a coupon... but it expired yesterday. Tough luck!")
                        .expiryDays(0).targetSegment(UserSegment.ALL)
                        .build(),

                Reward.builder()
                        .label("Nothing Today").type(RewardType.NO_LUCK).value(0.0)
                        .probability(10)         // hard no-luck
                        .active(true).color("#636E72").icon("💀")
                        .description("The wheel has spoken: absolutely nothing. See you tomorrow!")
                        .expiryDays(0).targetSegment(UserSegment.ALL)
                        .build()
            );

            rewardRepository.saveAll(rewards);
            log.info("✅ Seeded {} wheel rewards (good: 7, bad: 4). Good-reward rate: ~65%.", rewards.size());
        };
    }
}
