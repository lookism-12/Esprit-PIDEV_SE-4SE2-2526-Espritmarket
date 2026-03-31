package esprit_market.modules.market.service;

import esprit_market.config.Exceptions;
import esprit_market.modules.market.enums.UserRole;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CurrentActorService {

    public UUID parseUserId(String userIdHeader) {
        if (userIdHeader == null || userIdHeader.isBlank()) {
            throw new Exceptions.AccessDeniedException("Missing X-User-Id header");
        }
        return UUID.fromString(userIdHeader);
    }

    public UserRole parseRole(String roleHeader) {
        if (roleHeader == null || roleHeader.isBlank()) {
            throw new Exceptions.AccessDeniedException("Missing X-User-Role header");
        }
        return UserRole.valueOf(roleHeader.trim().toUpperCase());
    }
}
