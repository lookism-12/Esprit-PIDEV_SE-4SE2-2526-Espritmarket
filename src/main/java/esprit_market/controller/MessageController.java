package esprit_market.controller;

import esprit_market.entity.Message;
import esprit_market.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService service;

    @GetMapping
    public List<Message> getAll() { return service.findAll(); }
}
