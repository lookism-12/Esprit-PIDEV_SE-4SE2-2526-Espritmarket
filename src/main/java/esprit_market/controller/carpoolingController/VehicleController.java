package esprit_market.controller.carpoolingController;

import esprit_market.entity.carpooling.Vehicle;
import esprit_market.service.carpoolingService.VehicleService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {
    private final VehicleService service;

    @GetMapping
    public List<Vehicle> findAll() { return service.findAll(); }

    @PostMapping
    public Vehicle save(@RequestBody Vehicle vehicle) { return service.save(vehicle); }

    @GetMapping("/{id}")
    public Vehicle findById(@PathVariable String id) { return service.findById(new ObjectId(id)); }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable String id) { service.deleteById(new ObjectId(id)); }
}
