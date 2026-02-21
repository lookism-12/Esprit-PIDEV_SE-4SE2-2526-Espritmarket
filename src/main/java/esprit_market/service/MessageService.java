package esprit_market.service;

import esprit_market.entity.Message;
import esprit_market.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository repository;

    public List<Message> findAll() { return repository.findAll(); }
}
