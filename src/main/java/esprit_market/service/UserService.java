package esprit_market.service;

import esprit_market.entity.User;
import esprit_market.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public List<User> findAll() { return userRepository.findAll(); }
    public User save(User user) { return userRepository.save(user); }
    public User findById(ObjectId id) { return userRepository.findById(id).orElse(null); }
    public void deleteById(ObjectId id) { userRepository.deleteById(id); }
}
