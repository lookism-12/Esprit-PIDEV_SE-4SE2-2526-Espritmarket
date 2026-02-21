package esprit_market.controller;

import esprit_market.entity.Booking;
import esprit_market.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService service;

    @GetMapping
    public List<Booking> findAll() { return service.findAll(); }

    @PostMapping
    public Booking save(@RequestBody Booking booking) { return service.save(booking); }

    @GetMapping("/{id}")
    public Booking findById(@PathVariable String id) { return service.findById(new ObjectId(id)); }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable String id) { service.deleteById(new ObjectId(id)); }
}
