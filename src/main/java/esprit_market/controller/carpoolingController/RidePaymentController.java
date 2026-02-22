package esprit_market.controller.carpoolingController;

import esprit_market.entity.carpooling.RidePayment;
import esprit_market.service.carpoolingService.RidePaymentService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ride-payments")
@RequiredArgsConstructor
public class RidePaymentController {
    private final RidePaymentService service;

    @GetMapping
    public List<RidePayment> findAll() { return service.findAll(); }

    @PostMapping
    public RidePayment save(@RequestBody RidePayment payment) { return service.save(payment); }

    @GetMapping("/{id}")
    public RidePayment findById(@PathVariable String id) { return service.findById(new ObjectId(id)); }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable String id) { service.deleteById(new ObjectId(id)); }
}
