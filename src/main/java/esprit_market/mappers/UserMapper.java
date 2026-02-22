package esprit_market.mappers;

import esprit_market.dto.UserDTO;
import esprit_market.entity.user.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {
    public UserDTO toDTO(User user) {
        if (user == null)
            return null;
        UserDTO dto = new UserDTO();
        dto.setId(user.getId().toHexString());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setRoles(user.getRoles().stream().map(Enum::name).collect(Collectors.toList()));
        return dto;
    }
}
