package esprit_market.controller;

import esprit_market.entity.carpooling.RideReview;
import esprit_market.service.carpoolingService.RideReviewService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ride-reviews")
@RequiredArgsConstructor
public class RideReviewController {
    private final RideReviewService service;

    @GetMapping
    public List<RideReview> findAll() { return service.findAll(); }

    @PostMapping
    public RideReview save(@RequestBody RideReview review) { return service.save(review); }

    @GetMapping("/{id}")
    public RideReview findById(@PathVariable String id) { return service.findById(new ObjectId(id)); }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable String id) { service.deleteById(new ObjectId(id)); }
}
