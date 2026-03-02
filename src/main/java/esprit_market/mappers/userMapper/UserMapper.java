package esprit_market.mappers.userMapper;

import esprit_market.dto.userDto.UserDTO;
import esprit_market.entity.user.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }

        return UserDTO.builder()
                .id(user.getId() != null ? user.getId().toHexString() : null)
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .roles(user.getRoles() != null 
                        ? user.getRoles().stream().map(Enum::name).collect(Collectors.toList())
                        : null)
                .enabled(user.isEnabled())
                .build();
    }
}
