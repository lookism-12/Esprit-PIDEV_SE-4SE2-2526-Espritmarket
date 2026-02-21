package esprit_market.controller;

import esprit_market.entity.Negotiation;
import esprit_market.service.NegotiationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/negotiations")
@RequiredArgsConstructor
public class NegotiationController {
    private final NegotiationService service;

    @GetMapping
    public List<Negotiation> getAll() { return service.findAll(); }
}
