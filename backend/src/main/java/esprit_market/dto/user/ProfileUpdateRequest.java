package esprit_market.dto.user;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {

    // Size validator only applies if string is not null/empty
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    // Pattern allows empty string or valid phone
    @Pattern(regexp = "^[0-9]{8,15}$|^$", message = "Phone must be 8-15 digits or empty")
    private String phone;
}
