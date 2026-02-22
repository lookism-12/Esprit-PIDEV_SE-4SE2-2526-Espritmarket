package esprit_market.controller.SAVController;

import esprit_market.entity.SAV.SavFeedback;
import esprit_market.service.SAVService.SavFeedbackService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sav-feedback")
@RequiredArgsConstructor
public class SavFeedbackController {
    private final SavFeedbackService service;

    @GetMapping
    public List<SavFeedback> findAll() { return service.findAll(); }

    @PostMapping
    public SavFeedback save(@RequestBody SavFeedback feedback) { return service.save(feedback); }

    @GetMapping("/{id}")
    public SavFeedback findById(@PathVariable String id) { return service.findById(new ObjectId(id)); }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable String id) { service.deleteById(new ObjectId(id)); }
}
