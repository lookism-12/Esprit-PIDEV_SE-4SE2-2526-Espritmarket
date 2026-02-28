package esprit_market.controller.carpoolingController;

import esprit_market.Enum.carpoolingEnum.PaymentStatus;
import esprit_market.entity.carpooling.RidePayment;
import esprit_market.service.carpoolingService.RidePaymentService;
import esprit_market.entity.carpooling.RidePayment;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ride-payments")
@RequiredArgsConstructor
public class RidePaymentController {
    private final RidePaymentService service;

    @GetMapping("/{id}")

    public RidePayment getById(@PathVariable String id) {
        return service.findById(new ObjectId(id));
    }

    @GetMapping("/booking/{bookingId}")
    public RidePayment getByBookingId(@PathVariable String bookingId) {
        return service.findByBookingId(new ObjectId(bookingId))
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for booking"));
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public List<RidePayment> getByStatus(@RequestParam(required = false) PaymentStatus status) {
        if (status == null) {
            return service.findAll();
        }
        return service.findByStatus(status);
    }

    @PatchMapping("/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public RidePayment updateStatus(@PathVariable String id,
            @RequestParam PaymentStatus status) {
        return service.updateStatus(new ObjectId(id), status);
    }
}
