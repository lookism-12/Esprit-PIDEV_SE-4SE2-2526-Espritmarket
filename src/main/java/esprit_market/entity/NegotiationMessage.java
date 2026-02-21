package esprit_market.entity;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NegotiationMessage {
    private String sender;
    private String text;
}
