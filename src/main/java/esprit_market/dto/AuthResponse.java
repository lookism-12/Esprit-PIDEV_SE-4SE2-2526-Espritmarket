package esprit_market.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private String email;
    private List<String> roles;

    public AuthResponse(String token) {
        this.token = token;
        this.type = "Bearer";
    }
}
