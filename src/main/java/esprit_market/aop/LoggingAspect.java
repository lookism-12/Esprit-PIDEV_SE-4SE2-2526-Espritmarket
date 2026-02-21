package esprit_market.aop;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    @Before("execution(* esprit_market.service.*.*(..))")
    public void logBefore(JoinPoint joinPoint) {
        log.info("Executing service: {}", joinPoint.getSignature().toShortString());
    }
}
