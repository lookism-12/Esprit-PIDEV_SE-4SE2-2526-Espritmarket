package esprit_market.config;

import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

        private final UserRepository userRepository;

        /**
         * Spring Security calls this with the "username" — we use email as the
         * identifier.
         */
        @Override
        public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new UsernameNotFoundException(
                                                "User not found with email: " + email));

                return org.springframework.security.core.userdetails.User.builder()
                                .username(user.getEmail())
                                .password(user.getPassword())
                                .disabled(!user.isEnabled())
                                .authorities(
                                                user.getRoles().stream()
                                                                .map(role -> new SimpleGrantedAuthority(
                                                                                "ROLE_" + role.name()))
                                                                .collect(Collectors.toList()))
                                .build();
        }
}
