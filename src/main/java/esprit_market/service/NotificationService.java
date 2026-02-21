package esprit_market.service;

import esprit_market.entity.InternalNotification;
import esprit_market.entity.ExternalNotification;
import esprit_market.repository.InternalNotificationRepository;
import esprit_market.repository.ExternalNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final InternalNotificationRepository internalRepo;
    private final ExternalNotificationRepository externalRepo;

    public List<InternalNotification> findAllInternal() { return internalRepo.findAll(); }
    public List<ExternalNotification> findAllExternal() { return externalRepo.findAll(); }
}
