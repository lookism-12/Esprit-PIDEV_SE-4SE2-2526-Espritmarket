package esprit_market.utils;

public class HtmlSanitizer {
    private HtmlSanitizer() {}

    public static String sanitize(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }

        // Escape HTML special characters to prevent XSS
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
