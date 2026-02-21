package esprit_market.controller;

import esprit_market.entity.InternalNotification;
import esprit_market.entity.ExternalNotification;
import esprit_market.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService service;

    @GetMapping("/internal")
    public List<InternalNotification> getAllInternal() { return service.findAllInternal(); }

    @GetMapping("/external")
    public List<ExternalNotification> getAllExternal() { return service.findAllExternal(); }
}
