package esprit_market.service.SAVService;

import esprit_market.Enum.userEnum.Role;
import esprit_market.dto.SAV.DeliveryRequestDTO;
import esprit_market.dto.SAV.DeliveryResponseDTO;
import esprit_market.entity.SAV.Delivery;
import esprit_market.entity.user.User;
import esprit_market.mappers.SAVMapper;
import esprit_market.repository.SAVRepository.DeliveryRepository;
import esprit_market.repository.cartRepository.CartRepository;
import esprit_market.repository.userRepository.UserRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeliveryServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private SAVMapper savMapper;

    @InjectMocks
    private DeliveryService deliveryService;

    @Test
    void shouldCreateDelivery_whenRequestIsValidAndUserHasDeliveryRole() {
        ObjectId userId = new ObjectId();
        ObjectId cartId = new ObjectId();

        DeliveryRequestDTO request = buildRequest(userId.toHexString(), cartId.toHexString(), "PENDING");

        User assignedUser = User.builder().id(userId).roles(List.of(Role.DELIVERY)).build();
        Delivery toSave = Delivery.builder().address("addr").userId(userId).cartId(cartId).build();
        Delivery saved = Delivery.builder().id(new ObjectId()).address("addr").userId(userId).cartId(cartId).build();
        DeliveryResponseDTO response = DeliveryResponseDTO.builder().id(saved.getId().toHexString()).build();

        when(userRepository.findById(any(ObjectId.class))).thenReturn(Optional.of(assignedUser));
        when(cartRepository.existsById(any(ObjectId.class))).thenReturn(true);
        when(savMapper.toDeliveryEntity(request)).thenReturn(toSave);
        when(deliveryRepository.save(toSave)).thenReturn(saved);
        when(savMapper.toDeliveryResponse(saved)).thenReturn(response);

        DeliveryResponseDTO result = deliveryService.createDelivery(request);

        assertEquals(response, result);
        verify(deliveryRepository).save(toSave);
        verify(savMapper).toDeliveryEntity(request);
        verify(savMapper).toDeliveryResponse(saved);
    }

    @Test
    void shouldThrowException_whenCreateDeliveryAndUserNotFound() {
        DeliveryRequestDTO request = buildRequest(new ObjectId().toHexString(), new ObjectId().toHexString(), "PENDING");

        when(userRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> deliveryService.createDelivery(request));

        assertEquals("Utilisateur introuvable avec l'ID: " + request.getUserId(), ex.getMessage());
        verify(deliveryRepository, never()).save(any());
    }

    @Test
    void shouldThrowException_whenCreateDeliveryAndUserRoleIsInvalid() {
        ObjectId userId = new ObjectId();
        DeliveryRequestDTO request = buildRequest(userId.toHexString(), new ObjectId().toHexString(), "PENDING");

        User assignedUser = User.builder().id(userId).roles(List.of(Role.CLIENT)).build();
        when(userRepository.findById(any(ObjectId.class))).thenReturn(Optional.of(assignedUser));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> deliveryService.createDelivery(request));

        assertEquals("L'utilisateur assigné doit obligatoirement avoir le rôle DELIVERY ou ADMIN.", ex.getMessage());
        verify(deliveryRepository, never()).save(any());
    }

    @Test
    void shouldThrowException_whenCreateDeliveryAndCartNotFound() {
        ObjectId userId = new ObjectId();
        DeliveryRequestDTO request = buildRequest(userId.toHexString(), new ObjectId().toHexString(), "PENDING");

        User assignedUser = User.builder().id(userId).roles(List.of(Role.ADMIN)).build();
        when(userRepository.findById(any(ObjectId.class))).thenReturn(Optional.of(assignedUser));
        when(cartRepository.existsById(any(ObjectId.class))).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> deliveryService.createDelivery(request));

        assertEquals("Panier (Cart) introuvable avec l'ID: " + request.getCartId(), ex.getMessage());
        verify(deliveryRepository, never()).save(any());
    }

    @Test
    void shouldGetDeliveryById_whenFound() {
        ObjectId id = new ObjectId();
        Delivery delivery = Delivery.builder().id(id).build();
        DeliveryResponseDTO response = DeliveryResponseDTO.builder().id(id.toHexString()).build();

        when(deliveryRepository.findById(any(ObjectId.class))).thenReturn(Optional.of(delivery));
        when(savMapper.toDeliveryResponse(delivery)).thenReturn(response);

        DeliveryResponseDTO result = deliveryService.getDeliveryById(id.toHexString());

        assertEquals(response, result);
    }

    @Test
    void shouldDeleteDelivery_whenExists() {
        ObjectId id = new ObjectId();
        when(deliveryRepository.existsById(any(ObjectId.class))).thenReturn(true);

        deliveryService.deleteDelivery(id.toHexString());

        verify(deliveryRepository).deleteById(any(ObjectId.class));
    }

    private DeliveryRequestDTO buildRequest(String userId, String cartId, String status) {
        DeliveryRequestDTO request = new DeliveryRequestDTO();
        request.setAddress("Rue de test");
        request.setDeliveryDate(LocalDateTime.now().plusDays(1));
        request.setStatus(status);
        request.setUserId(userId);
        request.setCartId(cartId);
        return request;
    }
}
