package esprit_market.entity.carpooling;

import esprit_market.Enum.carpoolingEnum.PaymentStatus;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "ride_payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RidePayment {
    @Id
    private ObjectId id;

    @Indexed
    private ObjectId bookingId;

    private Float amount;

    @Indexed
    private PaymentStatus status;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
