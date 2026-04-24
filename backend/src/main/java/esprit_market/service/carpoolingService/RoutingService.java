package esprit_market.service.carpoolingService;

import esprit_market.dto.carpooling.RoutingRequestDTO;
import esprit_market.dto.carpooling.RoutingResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class RoutingService {

    private final String API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImE0ZGRjY2FiNmU0NDQwN2NiZjU4ZWUyYjdmYzUwYWUzIiwiaCI6Im11cm11cjY0In0=";
    private final String ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car";

    private final RestTemplate restTemplate = new RestTemplate();

    public RoutingResponseDTO calculateRoute(RoutingRequestDTO request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", API_KEY);

            Map<String, Object> body = new HashMap<>();
            List<List<Double>> coords = new ArrayList<>();
            coords.add(List.of(request.getStartLng(), request.getStartLat()));
            coords.add(List.of(request.getEndLng(), request.getEndLat()));
            body.put("coordinates", coords);
            body.put("instructions", false);
            body.put("preference", "recommended");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            Map<String, Object> response = restTemplate.postForObject(ORS_URL, entity, Map.class);

            if (response != null && response.containsKey("routes")) {
                List<Map<String, Object>> routes = (List<Map<String, Object>>) response.get("routes");
                if (!routes.isEmpty()) {
                    Map<String, Object> route = routes.get(0);
                    Map<String, Object> summary = (Map<String, Object>) route.get("summary");
                    
                    RoutingResponseDTO.RoutingResponseDTOBuilder builder = RoutingResponseDTO.builder()
                            .distance((Double) summary.get("distance"))
                            .duration((Double) summary.get("duration"));

                    // Extract geometry (polyline or coordinates)
                    if (route.containsKey("geometry")) {
                        // By default ORS returns encoded polyline
                        builder.polyline((String) route.get("geometry"));
                    }

                    // If we want coordinates, we can decode polyline or use a different endpoint.
                    // Let's stick with polyline as it's efficient, and decode on frontend or just return the polyline.
                    // Actually, let's provide coordinates if we can.
                    
                    return builder.build();
                }
            }
        } catch (Exception e) {
            log.error("Error calculating route from OpenRouteService: {}", e.getMessage());
        }
        return null;
    }
}
