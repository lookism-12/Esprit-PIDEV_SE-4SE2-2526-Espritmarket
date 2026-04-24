package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutingResponseDTO {
    private List<List<Double>> coordinates; // [[lng, lat], ...]
    private double distance; // in meters
    private double duration; // in seconds
    private String polyline; // Optional encoded polyline
}
