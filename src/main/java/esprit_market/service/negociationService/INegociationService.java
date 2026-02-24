package esprit_market.service.negociationService;

import esprit_market.dto.negociation.NegociationDTO;
import esprit_market.dto.negociation.ProposalDTO;
import esprit_market.Enum.negociationEnum.NegociationStatuts;
import org.bson.types.ObjectId;

import java.util.List;

public interface INegociationService {

    NegociationDTO createNegociation(NegociationDTO dto, ObjectId clientId);

    NegociationDTO getNegociationById(ObjectId id);

    List<NegociationDTO> getAllNegociations();

    List<NegociationDTO> getMyNegociations(ObjectId clientId);

    List<NegociationDTO> getNegociationsByServiceId(ObjectId serviceId);

    List<NegociationDTO> getNegociationsByStatuts(NegociationStatuts statuts);

    NegociationDTO updateStatuts(ObjectId id, NegociationStatuts statuts, ObjectId userId);

    NegociationDTO addProposal(ObjectId negociationId, ProposalDTO proposalDTO, ObjectId senderId);

    void deleteNegociation(ObjectId id, ObjectId clientId);
}