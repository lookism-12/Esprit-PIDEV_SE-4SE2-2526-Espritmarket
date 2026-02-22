package esprit_market.controller.carpoolingController;

import esprit_market.entity.carpooling.Ride;
import esprit_market.service.carpoolingService.RideService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
public class RideController {
    private final RideService service;

    @GetMapping
    public List<Ride> getAll() { return service.findAll(); }
}
