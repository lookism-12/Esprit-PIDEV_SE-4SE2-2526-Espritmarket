package esprit_market.service.emailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send a plain-text email.
     *
     * @param to      recipient address
     * @param subject email subject
     * @param body    email body
     */
    public void sendEmail(String to, String subject, String body) {
        try {
            System.out.println("[EmailService] Sending email to: " + to);
            System.out.println("[EmailService] Subject: " + subject);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);

            System.out.println("[EmailService] Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send email to: " + to);
            e.printStackTrace();
        }
    }

    /**
     * Alias kept for backward compatibility with NotificationService.
     */
    public void sendNotificationEmail(String to, String subject, String message) {
        sendEmail(to, subject, message);
    }
}
