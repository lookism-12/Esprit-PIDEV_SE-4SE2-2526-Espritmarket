package esprit_market.service.forumService;

import esprit_market.config.ForumAiConfig;
import esprit_market.dto.forum.ForumRecommendationRequest;
import esprit_market.dto.forum.ForumRecommendationResponse;
import esprit_market.dto.forum.RecommendedForumPost;
import esprit_market.entity.forum.CategoryForum;
import esprit_market.entity.forum.Post;
import esprit_market.repository.forumRepository.CategoryForumRepository;
import esprit_market.repository.forumRepository.PostRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Slf4j
public class ForumRecommendationService {
    private final WebClient webClient;
    private final ForumAiConfig config;
    private final PostRepository postRepository;
    private final CategoryForumRepository categoryRepository;

    public ForumRecommendationService(@Qualifier("forumAiWebClient") WebClient webClient,
                                      ForumAiConfig config,
                                      PostRepository postRepository,
                                      CategoryForumRepository categoryRepository) {
        this.webClient = webClient;
        this.config = config;
        this.postRepository = postRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<RecommendedForumPost> getRecommendations(Post post) {
        return getRecommendations(post, config.getDefaultTopK());
    }

    /**
     * Semantic search: finds posts semantically similar to a free-text query.
     * Uses the AI service (all-MiniLM-L6-v2 + FAISS) when available,
     * falls back to keyword-based matching from MongoDB.
     */
    public List<RecommendedForumPost> semanticSearch(String query, int topK) {
        if (query == null || query.isBlank()) return List.of();

        if (!config.isEnabled()) {
            return keywordFallbackSearch(query, topK);
        }

        try {
            ForumRecommendationRequest request = ForumRecommendationRequest.builder()
                    .content(query)
                    .topK(topK)
                    .build();

            ForumRecommendationResponse response = webClient.post()
                    .uri("/recommend")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(ForumRecommendationResponse.class)
                    .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                    .retryWhen(Retry.backoff(config.getMaxRetries(), Duration.ofMillis(300))
                            .filter(this::isRetryableException))
                    .block();

            if (response != null && response.getRecommendations() != null
                    && !response.getRecommendations().isEmpty()) {
                return response.getRecommendations();
            }
        } catch (Exception e) {
            log.warn("Forum AI semantic search unavailable, using keyword fallback: {}", e.getMessage());
        }

        return keywordFallbackSearch(query, topK);
    }

    /**
     * Simple keyword fallback when the AI service is down.
     * Scores posts by how many query words appear in their content.
     */
    private List<RecommendedForumPost> keywordFallbackSearch(String query, int topK) {
        String[] terms = query.toLowerCase().split("\\s+");
        return postRepository.findAll().stream()
                .filter(p -> p.getContent() != null && !p.getContent().isBlank())
                .map(p -> {
                    String text = p.getContent().toLowerCase();
                    long hits = java.util.Arrays.stream(terms).filter(text::contains).count();
                    return new Object[]{ p, hits };
                })
                .filter(pair -> (long) pair[1] > 0)
                .sorted((a, b) -> Long.compare((long) b[1], (long) a[1]))
                .limit(topK)
                .map(pair -> {
                    Post p = (Post) pair[0];
                    String[] tb = splitTitle(p.getContent());
                    double score = Math.min(1.0, (long) pair[1] * 0.15);
                    return RecommendedForumPost.builder()
                            .postId(toId(p.getId()))
                            .title(tb[0])
                            .content(tb[1])
                            .excerpt(excerpt(tb[1]))
                            .categoryId(toId(p.getCategoryId()))
                            .category(resolveCategoryName(p.getCategoryId()))
                            .score(score)
                            .source("keyword-fallback")
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
    }

    public List<RecommendedForumPost> getRecommendations(Post post, int topK) {
        if (post == null || post.getContent() == null || post.getContent().isBlank()) {
            return List.of();
        }

        if (!config.isEnabled()) {
            return fallbackRecommendations(post, topK);
        }

        try {
            ForumRecommendationRequest request = ForumRecommendationRequest.builder()
                    .postId(toId(post.getId()))
                    .content(post.getContent())
                    .categoryId(toId(post.getCategoryId()))
                    .topK(topK)
                    .build();

            ForumRecommendationResponse response = webClient.post()
                    .uri("/recommend")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(ForumRecommendationResponse.class)
                    .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                    .retryWhen(Retry.backoff(config.getMaxRetries(), Duration.ofMillis(300))
                            .filter(this::isRetryableException))
                    .block();

            if (response != null && response.getRecommendations() != null) {
                return response.getRecommendations();
            }
        } catch (Exception e) {
            log.warn("Forum AI recommendation service unavailable, using backend fallback: {}", e.getMessage());
        }

        return fallbackRecommendations(post, topK);
    }

    public boolean isServiceAvailable() {
        if (!config.isEnabled()) {
            return false;
        }

        try {
            webClient.get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(Math.min(config.getTimeoutSeconds(), 5)))
                    .block();
            return true;
        } catch (Exception e) {
            log.debug("Forum AI recommendation health check failed: {}", e.getMessage());
            return false;
        }
    }

    private List<RecommendedForumPost> fallbackRecommendations(Post source, int topK) {
        ObjectId sourceId = source.getId();
        ObjectId categoryId = source.getCategoryId();
        List<Post> candidates = postRepository.findAll().stream()
                .filter(candidate -> candidate.getId() != null && !candidate.getId().equals(sourceId))
                .filter(candidate -> candidate.getContent() != null && !candidate.getContent().isBlank())
                .sorted(Comparator.comparing((Post candidate) -> sameCategory(candidate, categoryId)).reversed()
                        .thenComparing(Post::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(topK)
                .toList();

        List<RecommendedForumPost> recommendations = new ArrayList<>();
        for (Post candidate : candidates) {
            String[] titleAndBody = splitTitle(candidate.getContent());
            recommendations.add(RecommendedForumPost.builder()
                    .postId(toId(candidate.getId()))
                    .title(titleAndBody[0])
                    .content(titleAndBody[1])
                    .excerpt(excerpt(titleAndBody[1]))
                    .categoryId(toId(candidate.getCategoryId()))
                    .category(resolveCategoryName(candidate.getCategoryId()))
                    .score(sameCategory(candidate, categoryId) ? 0.25 : 0.1)
                    .source("backend-fallback")
                    .build());
        }
        return recommendations;
    }

    private boolean sameCategory(Post post, ObjectId categoryId) {
        return categoryId != null && categoryId.equals(post.getCategoryId());
    }

    private String resolveCategoryName(ObjectId categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId)
                .map(CategoryForum::getName)
                .orElse(null);
    }

    private String[] splitTitle(String content) {
        String[] lines = content == null ? new String[0] : content.lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .toArray(String[]::new);

        if (lines.length == 0) {
            return new String[]{"Untitled discussion", ""};
        }
        if (lines.length == 1) {
            return new String[]{truncate(lines[0], 120), lines[0]};
        }
        String body = String.join("\n", java.util.Arrays.copyOfRange(lines, 1, lines.length));
        return new String[]{truncate(lines[0], 160), body};
    }

    private String excerpt(String content) {
        return truncate(content == null ? "" : content.replace("\n", " ").trim(), 220);
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    private String toId(ObjectId id) {
        return id == null ? null : id.toHexString();
    }

    private boolean isRetryableException(Throwable throwable) {
        if (throwable instanceof WebClientResponseException ex) {
            return ex.getStatusCode().is5xxServerError();
        }
        return throwable instanceof WebClientException;
    }
}
