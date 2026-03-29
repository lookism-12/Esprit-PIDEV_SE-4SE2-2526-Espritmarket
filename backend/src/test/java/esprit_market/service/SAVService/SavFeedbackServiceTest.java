package esprit_market.service.SAVService;

import esprit_market.dto.SAV.SavFeedbackRequestDTO;
import esprit_market.dto.SAV.SavFeedbackResponseDTO;
import esprit_market.entity.SAV.SavFeedback;
import esprit_market.mappers.SAVMapper;
import esprit_market.repository.SAVRepository.SavFeedbackRepository;
import esprit_market.repository.cartRepository.CartItemRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SavFeedbackServiceTest {

    @Mock
    private SavFeedbackRepository savFeedbackRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private SAVMapper savMapper;

    @InjectMocks
    private SavFeedbackService savFeedbackService;

    @Test
    void shouldCreateFeedback_whenRequestIsValid() {
        ObjectId cartItemId = new ObjectId();
        SavFeedbackRequestDTO request = buildRequest(cartItemId.toHexString(), "PENDING");

        SavFeedback toSave = SavFeedback.builder().type("SAV").cartItemId(cartItemId).build();
        SavFeedback saved = SavFeedback.builder().id(new ObjectId()).type("SAV").cartItemId(cartItemId).build();
        SavFeedbackResponseDTO response = SavFeedbackResponseDTO.builder().id(saved.getId().toHexString()).build();

        when(cartItemRepository.existsById(any(ObjectId.class))).thenReturn(true);
        when(savMapper.toSavFeedbackEntity(request)).thenReturn(toSave);
        when(savFeedbackRepository.save(toSave)).thenReturn(saved);
        when(savMapper.toSavFeedbackResponse(saved)).thenReturn(response);

        SavFeedbackResponseDTO result = savFeedbackService.createFeedback(request);

        assertEquals(response, result);
        verify(savFeedbackRepository).save(toSave);
        verify(savMapper).toSavFeedbackEntity(request);
    }

    @Test
    void shouldThrowException_whenCreateFeedbackAndCartItemNotFound() {
        SavFeedbackRequestDTO request = buildRequest(new ObjectId().toHexString(), "PENDING");

        when(cartItemRepository.existsById(any(ObjectId.class))).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> savFeedbackService.createFeedback(request));

        assertEquals("Article du panier (CartItem) introuvable pour l'ID: " + request.getCartItemId(), ex.getMessage());
        verify(savFeedbackRepository, never()).save(any());
    }

    @Test
    void shouldGetFeedbackById_whenFound() {
        ObjectId feedbackId = new ObjectId();
        SavFeedback feedback = SavFeedback.builder().id(feedbackId).build();
        SavFeedbackResponseDTO response = SavFeedbackResponseDTO.builder().id(feedbackId.toHexString()).build();

        when(savFeedbackRepository.findById(any(ObjectId.class))).thenReturn(Optional.of(feedback));
        when(savMapper.toSavFeedbackResponse(feedback)).thenReturn(response);

        SavFeedbackResponseDTO result = savFeedbackService.getFeedbackById(feedbackId.toHexString());

        assertEquals(response, result);
    }

    @Test
    void shouldGetFeedbacksByType_whenTypeExists() {
        SavFeedback feedback = SavFeedback.builder().id(new ObjectId()).type("SAV").build();
        SavFeedbackResponseDTO response = SavFeedbackResponseDTO.builder().id(feedback.getId().toHexString()).build();

        when(savFeedbackRepository.findByType("SAV")).thenReturn(List.of(feedback));
        when(savMapper.toSavFeedbackResponse(feedback)).thenReturn(response);

        List<SavFeedbackResponseDTO> result = savFeedbackService.getFeedbacksByType("SAV");

        assertEquals(1, result.size());
        assertEquals(response, result.get(0));
    }

    @Test
    void shouldUpdateFeedbackStatus_whenFeedbackExists() {
        ObjectId feedbackId = new ObjectId();
        SavFeedback existing = SavFeedback.builder().id(feedbackId).status("PENDING").build();
        SavFeedback saved = SavFeedback.builder().id(feedbackId).status("RESOLVED").build();
        SavFeedbackResponseDTO response = SavFeedbackResponseDTO.builder()
                .id(feedbackId.toHexString())
                .status("RESOLVED")
                .build();

        when(savFeedbackRepository.findById(any(ObjectId.class))).thenReturn(Optional.of(existing));
        when(savFeedbackRepository.save(existing)).thenReturn(saved);
        when(savMapper.toSavFeedbackResponse(saved)).thenReturn(response);

        SavFeedbackResponseDTO result = savFeedbackService.updateFeedbackStatus(feedbackId.toHexString(), "RESOLVED");

        assertEquals("RESOLVED", result.getStatus());
        verify(savFeedbackRepository).save(existing);
    }

    @Test
    void shouldDeleteFeedback_whenExists() {
        when(savFeedbackRepository.existsById(any(ObjectId.class))).thenReturn(true);

        savFeedbackService.deleteFeedback(new ObjectId().toHexString());

        verify(savFeedbackRepository).deleteById(any(ObjectId.class));
    }

    private SavFeedbackRequestDTO buildRequest(String cartItemId, String status) {
        SavFeedbackRequestDTO request = new SavFeedbackRequestDTO();
        request.setType("SAV");
        request.setMessage("Produit defectueux");
        request.setRating(3);
        request.setReason("Defaut fabrication");
        request.setStatus(status);
        request.setCartItemId(cartItemId);
        return request;
    }
}
