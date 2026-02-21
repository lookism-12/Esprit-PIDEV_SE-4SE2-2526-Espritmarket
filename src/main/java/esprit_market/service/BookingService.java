package esprit_market.service;

import esprit_market.entity.Booking;
import esprit_market.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository repository;

    public List<Booking> findAll() { return repository.findAll(); }
    public Booking save(Booking booking) { return repository.save(booking); }
    public Booking findById(ObjectId id) { return repository.findById(id).orElse(null); }
    public void deleteById(ObjectId id) { repository.deleteById(id); }
}
