package esprit_market;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EspritMarketApplication {

    public static void main(String[] args) {
        SpringApplication.run(EspritMarketApplication.class, args);
    }

}
