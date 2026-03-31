package esprit_market.modules.market.entity;

import esprit_market.modules.market.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "market_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketUser {
    @Id
    @UuidGenerator
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;
}
