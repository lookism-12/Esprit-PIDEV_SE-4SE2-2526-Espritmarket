package esprit_market.service.chat;

import esprit_market.entity.chat.ChatConversation;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class FlameService {
  public void updateFlame(ChatConversation conv,
                          String senderId,
                          LocalDateTime messageTime) {
    LocalDate today = messageTime.toLocalDate();

    if (senderId.equals(conv.getUser1Id())) {
      conv.setUser1SentToday(true);
    } else {
      conv.setUser2SentToday(true);
    }

    if (!conv.isUser1SentToday() || !conv.isUser2SentToday()) return;

    LocalDate last = conv.getLastFlameDate();

    if (last == null) {
      conv.setFlameLevel(1);
      conv.setLastFlameDate(today);
    } else if (last.equals(today)) {
      return;
    } else if (last.equals(today.minusDays(1))) {
      conv.setFlameLevel(conv.getFlameLevel() + 1);
      conv.setLastFlameDate(today);
    } else {
      conv.setFlameLevel(1);
      conv.setLastFlameDate(today);
    }

    conv.setUser1SentToday(false);
    conv.setUser2SentToday(false);
  }
}
