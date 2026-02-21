package esprit_market.service;

import esprit_market.entity.Favoris;
import esprit_market.repository.FavorisRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavorisService {
    private final FavorisRepository repository;

    public List<Favoris> findAll() { return repository.findAll(); }
    public Favoris save(Favoris favoris) { return repository.save(favoris); }
    public Favoris findById(ObjectId id) { return repository.findById(id).orElse(null); }
    public void deleteById(ObjectId id) { repository.deleteById(id); }
}
