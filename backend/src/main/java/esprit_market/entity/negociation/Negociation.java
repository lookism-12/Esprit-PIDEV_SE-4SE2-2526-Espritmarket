package esprit_market.entity.negociation;

import esprit_market.Enum.negociationEnum.NegociationStatuts;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.user.User;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "negotiations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Negociation {

    @Id
    private ObjectId id;

    @DBRef
    private User client;

    @DBRef
    private ServiceEntity service;

    @DBRef
    private Product product;

    private NegociationStatuts statuts;

    @Builder.Default
    private List<Proposal> proposals = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
