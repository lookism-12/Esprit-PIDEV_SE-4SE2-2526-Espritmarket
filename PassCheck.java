import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PassCheck {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = "$2a$10$w5qTeiC3yhG12droSUqrnu2q1FqUy0Skrl464d7xxJ2Hq2FdQc5AK";

        System.out.println("Matches 'admin'? " + encoder.matches("admin", hash));
        System.out.println("Matches 'Admin@1234'? " + encoder.matches("Admin@1234", hash));
    }
}
