package esprit_market.utils;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Utility that replaces offensive words with asterisks before content is persisted.
 *
 * Design decisions:
 *  - Static utility (same pattern as HtmlSanitizer) — no Spring bean needed.
 *  - Word list is hardcoded but isolated in one constant so it can be moved to
 *    a config file / database later without touching call sites.
 *  - Uses \b word-boundary regex → "dumb" is filtered, "dumbbell" is not.
 *  - Case-insensitive via Pattern.CASE_INSENSITIVE.
 *  - Replacement length matches the original word length.
 *  - Null-safe: returns input unchanged if null or blank.
 */
public final class BadWordFilter {

    private BadWordFilter() {}

    // ── Bad-word list ─────────────────────────────────────────────────────────
    // To externalise: load this list from application.properties or a DB table.
    private static final List<String> BAD_WORDS = List.of(
            "stupid", "dumb", "idiot", "moron"
    );

    // Pre-compile one pattern per word at class-load time (cheap, reused on every call)
    private static final List<Pattern> PATTERNS = BAD_WORDS.stream()
            .map(word -> Pattern.compile(
                    "\\b" + Pattern.quote(word) + "\\b",
                    Pattern.CASE_INSENSITIVE))
            .toList();

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Replace every bad word in {@code input} with a same-length asterisk string.
     *
     * <pre>
     *   "You are stupid"  →  "You are ******"
     *   "Dumb idea"       →  "**** idea"
     *   "dUmB"            →  "****"
     *   "dumbbell"        →  "dumbbell"   (word boundary protects it)
     *   null / ""         →  returned as-is
     * </pre>
     */
    public static String filter(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }

        String result = input;
        for (Pattern pattern : PATTERNS) {
            result = pattern.matcher(result).replaceAll(match ->
                    "*".repeat(match.group().length())
            );
        }
        return result;
    }
}
