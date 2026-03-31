package esprit_market.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityDTO {
    private String activityId;
    private String type; // BOOKING_REQUEST, RIDE_COMPLETED, REVIEW_RECEIVED, PAYMENT_RECEIVED
    private String message;
    private String passengerName;
    private String passengerAvatar;
    private Long timestamp;
    private String status; // PENDING, ACCEPTED, DECLINED, COMPLETED
}
