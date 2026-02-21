package esprit_market.controller;

import esprit_market.entity.DriverProfile;
import esprit_market.service.DriverProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/driver-profiles")
@RequiredArgsConstructor
public class DriverProfileController {
    private final DriverProfileService service;

    @GetMapping
    public List<DriverProfile> getAll() { return service.findAll(); }
}
