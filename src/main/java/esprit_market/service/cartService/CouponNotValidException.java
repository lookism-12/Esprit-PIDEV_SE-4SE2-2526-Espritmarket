package esprit_market.service.cartService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class CouponNotValidException extends RuntimeException {
    public CouponNotValidException(String message) {
        super(message);
    }
}
