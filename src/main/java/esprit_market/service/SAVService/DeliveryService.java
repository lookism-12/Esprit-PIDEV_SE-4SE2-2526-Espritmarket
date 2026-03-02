package esprit_market.service.SAVService;

import esprit_market.dto.SAV.DeliveryRequestDTO;
import esprit_market.dto.SAV.DeliveryResponseDTO;
import esprit_market.entity.SAV.Delivery;
import esprit_market.mappers.SAVMapper;
import esprit_market.repository.SAVRepository.DeliveryRepository;
import esprit_market.repository.cartRepository.CartRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.entity.user.User;
import esprit_market.Enum.userEnum.Role;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryService implements IDeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final SAVMapper savMapper;

    @Override
    public DeliveryResponseDTO createDelivery(DeliveryRequestDTO request) {
        // Validate dependencies
        User assignedUser = userRepository.findById(new ObjectId(request.getUserId()))
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable avec l'ID: " + request.getUserId()));

        if (assignedUser.getRoles() == null || (!assignedUser.getRoles().contains(Role.DELIVERY)
                && !assignedUser.getRoles().contains(Role.ADMIN))) {
            throw new RuntimeException("L'utilisateur assigné doit obligatoirement avoir le rôle DELIVERY ou ADMIN.");
        }
        if (!cartRepository.existsById(new ObjectId(request.getCartId()))) {
            throw new RuntimeException("Panier (Cart) introuvable avec l'ID: " + request.getCartId());
        }

        Delivery delivery = savMapper.toDeliveryEntity(request);
        Delivery savedDelivery = deliveryRepository.save(delivery);
        return savMapper.toDeliveryResponse(savedDelivery);
    }

    @Override
    public DeliveryResponseDTO getDeliveryById(String id) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID: " + id));
        return savMapper.toDeliveryResponse(delivery);
    }

    @Override
    public List<DeliveryResponseDTO> getAllDeliveries() {
        return deliveryRepository.findAll().stream()
                .map(savMapper::toDeliveryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<DeliveryResponseDTO> getDeliveriesByUser(String userId) {
        return deliveryRepository.findByUserId(new ObjectId(userId)).stream()
                .map(savMapper::toDeliveryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<DeliveryResponseDTO> getDeliveriesByCart(String cartId) {
        return deliveryRepository.findByCartId(new ObjectId(cartId)).stream()
                .map(savMapper::toDeliveryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DeliveryResponseDTO updateDelivery(String id, DeliveryRequestDTO request) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID: " + id));

        // Validate dependencies
        User assignedUser = userRepository.findById(new ObjectId(request.getUserId()))
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable avec l'ID: " + request.getUserId()));

        if (assignedUser.getRoles() == null || (!assignedUser.getRoles().contains(Role.DELIVERY)
                && !assignedUser.getRoles().contains(Role.ADMIN))) {
            throw new RuntimeException("L'utilisateur assigné doit obligatoirement avoir le rôle DELIVERY ou ADMIN.");
        }
        if (!cartRepository.existsById(new ObjectId(request.getCartId()))) {
            throw new RuntimeException("Panier (Cart) introuvable avec l'ID: " + request.getCartId());
        }

        delivery.setAddress(request.getAddress());
        delivery.setDeliveryDate(request.getDeliveryDate());
        if (request.getStatus() != null) {
            delivery.setStatus(request.getStatus());
        }
        delivery.setUserId(new ObjectId(request.getUserId()));
        delivery.setCartId(new ObjectId(request.getCartId()));

        Delivery updated = deliveryRepository.save(delivery);
        return savMapper.toDeliveryResponse(updated);
    }

    @Override
    public DeliveryResponseDTO updateDeliveryStatus(String id, String status) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID: " + id));

        delivery.setStatus(status);
        Delivery updated = deliveryRepository.save(delivery);
        return savMapper.toDeliveryResponse(updated);
    }

    @Override
    public void deleteDelivery(String id) {
        if (!deliveryRepository.existsById(new ObjectId(id))) {
            throw new RuntimeException("Livraison introuvable avec l'ID: " + id);
        }
        deliveryRepository.deleteById(new ObjectId(id));
    }
}
