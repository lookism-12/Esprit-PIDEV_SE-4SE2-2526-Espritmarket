package esprit_market.service.negociationService;

import esprit_market.Enum.negociationEnum.NegociationStatuts;
import esprit_market.dto.negociation.NegociationRequest;
import esprit_market.dto.negociation.NegociationResponse;
import esprit_market.dto.negociation.ProposalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface INegociationService {

    NegociationResponse createNegociation(NegociationRequest request, String clientId);

    NegociationResponse getNegociationById(String id);

    Page<NegociationResponse> getAllNegociations(Pageable pageable);

    List<NegociationResponse> getAllNegociationsList();

    NegociationResponse updateStatusDirect(String id, NegociationStatuts status);

    NegociationResponse addProposalDirect(String negociationId, ProposalRequest request, String senderId);

    List<NegociationResponse> getMyNegociations(String clientId);
    
    List<NegociationResponse> getIncomingNegociations(String userId);

    List<NegociationResponse> getNegociationsByServiceId(String serviceId);

    List<NegociationResponse> getNegociationsByStatus(NegociationStatuts status);

    NegociationResponse updateStatus(String id, NegociationStatuts status, String userId);

    NegociationResponse addProposal(String negociationId, ProposalRequest request, String senderId);

    void deleteNegociation(String id, String clientId);
}