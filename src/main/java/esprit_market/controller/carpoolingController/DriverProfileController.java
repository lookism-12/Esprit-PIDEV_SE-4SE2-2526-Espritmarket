package esprit_market.controller.carpoolingController;

import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.service.carpoolingService.DriverProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/driver-profiles")
@RequiredArgsConstructor
public class DriverProfileController {
    private final DriverProfileService service;

    @GetMapping
    public List<DriverProfile> getAll() {
        return service.findAll();
    }
}
