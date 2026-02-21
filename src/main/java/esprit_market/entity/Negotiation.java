package esprit_market.entity;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "negotiations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Negotiation {
    @Id
    private ObjectId id;

    // OneToOne UNIDIRECTIONAL from Negotiation to User
    private ObjectId clientId;
    private ObjectId providerId;

    private String status;
    private List<NegotiationMessage> messages;
}
