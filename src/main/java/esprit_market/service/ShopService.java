package esprit_market.service;

import esprit_market.entity.Shop;
import esprit_market.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopService {
    private final ShopRepository repository;

    public List<Shop> findAll() { return repository.findAll(); }
}
