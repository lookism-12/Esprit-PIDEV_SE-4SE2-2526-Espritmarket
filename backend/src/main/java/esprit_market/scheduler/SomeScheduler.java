package esprit_market.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SomeScheduler {

    private static final Logger log = LoggerFactory.getLogger(SomeScheduler.class);

    @Scheduled(fixedRate = 60000) // Every minute
    public void reportCurrentTime() {
        log.info("The time is now {}", java.time.LocalDateTime.now());
    }
}
