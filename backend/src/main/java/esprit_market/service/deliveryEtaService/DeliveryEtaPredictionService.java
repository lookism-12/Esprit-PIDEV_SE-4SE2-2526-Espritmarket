package esprit_market.service.deliveryEtaService;

import esprit_market.config.deliveryeta.DeliveryEtaConfig;
import esprit_market.dto.deliveryEta.DeliveryEtaMlRequest;
import esprit_market.dto.deliveryEta.DeliveryEtaMlResponse;
import esprit_market.dto.deliveryEta.DeliveryEtaPredictionDTO;
import esprit_market.entity.SAV.Delivery;
import esprit_market.entity.cart.Order;
import esprit_market.entity.deliveryEta.DeliveryEtaPrediction;
import esprit_market.entity.user.User;
import esprit_market.repository.SAVRepository.DeliveryRepository;
import esprit_market.repository.cartRepository.OrderRepository;
import esprit_market.repository.deliveryEtaRepository.DeliveryEtaPredictionRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DeliveryEtaPredictionService {
    private final DeliveryEtaConfig config;
    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final DeliveryEtaPredictionRepository predictionRepository;

    private final WebClient weatherWebClient;
    private final WebClient routeWebClient;
    private final WebClient mlWebClient;

    private final List<ZoneDefinition> zoneDefinitions = List.of(
            new ZoneDefinition(new Coordinates(36.8065, 10.1815), List.of("grand tunis", "greater tunis", "grand tunisie", "tunis capitale")),
            new ZoneDefinition(new Coordinates(36.8782, 10.3247), List.of("la marsa", "marsa")),
            new ZoneDefinition(new Coordinates(36.8528, 10.3233), List.of("carthage", "kartaj")),
            new ZoneDefinition(new Coordinates(36.8702, 10.3417), List.of("sidi bou said", "sidi bousaid", "sidi bou saïd")),
            new ZoneDefinition(new Coordinates(36.8065, 10.1815), List.of("tunis", "centre ville tunis", "lac 1", "lac1", "lac 2", "lac2", "charguia")),
            new ZoneDefinition(new Coordinates(36.8665, 10.1647), List.of("ariana", "raoued", "soukra", "la soukra", "mnihla")),
            new ZoneDefinition(new Coordinates(36.7435, 10.2319), List.of("ben arous", "rades", "radès", "megrine", "mourouj", "ezzahra")),
            new ZoneDefinition(new Coordinates(36.8080, 10.0972), List.of("manouba", "mannouba", "den den", "douar hicher")),
            new ZoneDefinition(new Coordinates(36.4513, 10.7353), List.of("nabeul", "nabel")),
            new ZoneDefinition(new Coordinates(36.5786, 10.8583), List.of("korba")),
            new ZoneDefinition(new Coordinates(36.4001, 10.6167), List.of("hammamet", "yasmine hammamet")),
            new ZoneDefinition(new Coordinates(37.2744, 9.8739), List.of("bizerte", "bizert", "benzart", "banzart", "bizerte nord", "bizerte sud", "menzel bourguiba", "ras jebel")),
            new ZoneDefinition(new Coordinates(35.8245, 10.6346), List.of("sousse", "susa", "sahloul", "khezama", "akouda")),
            new ZoneDefinition(new Coordinates(35.7643, 10.8113), List.of("monastir", "mestir", "ksar hellal")),
            new ZoneDefinition(new Coordinates(35.5047, 11.0622), List.of("mahdia", "chebba")),
            new ZoneDefinition(new Coordinates(34.7406, 10.7603), List.of("sfax", "safax", "sfax ville", "sfax nord", "sfax sud", "sakiet ezzit", "sakiet eddaier", "chihia", "agareb", "mahares", "jebeniana", "thyna", "route gremda", "route tunis sfax", "route mahdia sfax")),
            new ZoneDefinition(new Coordinates(35.6781, 10.0963), List.of("kairouan", "kairwan")),
            new ZoneDefinition(new Coordinates(35.0382, 9.4858), List.of("sidi bouzid", "sidi bou zid")),
            new ZoneDefinition(new Coordinates(35.1676, 8.8365), List.of("kasserine", "gasrine")),
            new ZoneDefinition(new Coordinates(34.4250, 8.7842), List.of("gafsa", "gafsa ville")),
            new ZoneDefinition(new Coordinates(33.8881, 10.0975), List.of("gabes", "gabès", "matmata")),
            new ZoneDefinition(new Coordinates(33.3549, 10.5055), List.of("medenine", "médenine", "mednine", "djerba", "houmt souk")),
            new ZoneDefinition(new Coordinates(32.9297, 10.4518), List.of("tataouine", "tatawin")),
            new ZoneDefinition(new Coordinates(33.7044, 8.9690), List.of("kebili", "kébili", "douz")),
            new ZoneDefinition(new Coordinates(33.9197, 8.1335), List.of("tozeur", "touzeur", "nefta")),
            new ZoneDefinition(new Coordinates(36.7256, 9.1817), List.of("beja", "béja")),
            new ZoneDefinition(new Coordinates(36.5011, 8.7802), List.of("jendouba", "tabarka")),
            new ZoneDefinition(new Coordinates(36.1822, 8.7148), List.of("kef", "le kef")),
            new ZoneDefinition(new Coordinates(36.0833, 9.3667), List.of("siliana")),
            new ZoneDefinition(new Coordinates(36.4029, 10.1429), List.of("zaghouan", "zaghwen"))
    );

    public DeliveryEtaPredictionService(DeliveryEtaConfig config,
                                        DeliveryRepository deliveryRepository,
                                        OrderRepository orderRepository,
                                        UserRepository userRepository,
                                        DeliveryEtaPredictionRepository predictionRepository,
                                        @Qualifier("deliveryWeatherWebClient") WebClient weatherWebClient,
                                        @Qualifier("deliveryRouteWebClient") WebClient routeWebClient,
                                        @Qualifier("deliveryEtaMlWebClient") WebClient mlWebClient) {
        this.config = config;
        this.deliveryRepository = deliveryRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.predictionRepository = predictionRepository;
        this.weatherWebClient = weatherWebClient;
        this.routeWebClient = routeWebClient;
        this.mlWebClient = mlWebClient;
    }

    public DeliveryEtaPredictionDTO predictForDelivery(String deliveryId) {
        Delivery delivery = deliveryRepository.findById(new ObjectId(deliveryId))
                .orElseThrow(() -> new RuntimeException("Delivery not found: " + deliveryId));
        Optional<Order> order = resolveOrder(delivery);
        Optional<User> driver = delivery.getUserId() != null ? userRepository.findById(delivery.getUserId()) : Optional.empty();

        Coordinates destination = coordinatesForDelivery(delivery);
        Coordinates origin = driver.map(this::coordinatesForDriver)
                .orElseGet(() -> nearbyOrigin(destination));
        RouteInfo route = resolveRoute(origin, destination);
        WeatherInfo weather = resolveWeather(destination);

        LocalDateTime now = LocalDateTime.now();
        DeliveryEtaMlRequest mlRequest = DeliveryEtaMlRequest.builder()
                .orderId(order.map(Order::getOrderNumber).orElse(formatOrderNumber(delivery)))
                .distanceKm(route.distanceKm())
                .routeDurationMinutes(route.durationMinutes())
                .weather(weather.main())
                .temperatureC(weather.temperatureC())
                .windSpeed(weather.windSpeed())
                .isRain(isRain(weather.main()))
                .hourOfDay(now.getHour())
                .dayOfWeek(now.getDayOfWeek().getValue())
                .vehicleType(driver.map(User::getVehicleType).filter(value -> !value.isBlank()).orElse("Car"))
                .build();

        PredictionResult prediction = callMlOrFallback(mlRequest);
        DeliveryEtaPrediction saved = predictionRepository.save(DeliveryEtaPrediction.builder()
                .deliveryId(delivery.getId())
                .orderId(order.map(Order::getId).orElse(delivery.getOrderId()))
                .orderNumber(order.map(Order::getOrderNumber).orElse(formatOrderNumber(delivery)))
                .estimatedMinutes(prediction.estimatedMinutes())
                .riskLevel(prediction.riskLevel())
                .reason(prediction.reason())
                .weather(weather.main())
                .temperatureC(weather.temperatureC())
                .windSpeed(weather.windSpeed())
                .distanceKm(round(route.distanceKm()))
                .routeDurationMinutes(round(route.durationMinutes()))
                .originLatitude(origin.latitude())
                .originLongitude(origin.longitude())
                .destinationLatitude(destination.latitude())
                .destinationLongitude(destination.longitude())
                .modelVersion(prediction.modelVersion())
                .source(prediction.source())
                .createdAt(now)
                .build());

        return toDto(saved);
    }

    public Optional<DeliveryEtaPredictionDTO> getLatestForDelivery(String deliveryId) {
        return predictionRepository.findFirstByDeliveryIdOrderByCreatedAtDesc(new ObjectId(deliveryId))
                .map(this::toDto);
    }

    public List<DeliveryEtaPredictionDTO> getHistoryForDelivery(String deliveryId) {
        return predictionRepository.findByDeliveryIdOrderByCreatedAtDesc(new ObjectId(deliveryId)).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private Optional<Order> resolveOrder(Delivery delivery) {
        if (delivery.getOrderId() != null) {
            Optional<Order> byId = orderRepository.findById(delivery.getOrderId());
            if (byId.isPresent()) return byId;
        }
        if (delivery.getCartId() != null) {
            return orderRepository.findAllByCartId(delivery.getCartId()).stream().findFirst();
        }
        return Optional.empty();
    }

    private WeatherInfo resolveWeather(Coordinates coordinates) {
        if (!config.isUseExternalWeather() || config.getOpenWeatherApiKey() == null || config.getOpenWeatherApiKey().isBlank()) {
            return new WeatherInfo("Clear", 22.0, 3.0);
        }
        try {
            Map<?, ?> response = weatherWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/data/2.5/weather")
                            .queryParam("lat", coordinates.latitude())
                            .queryParam("lon", coordinates.longitude())
                            .queryParam("units", "metric")
                            .queryParam("appid", config.getOpenWeatherApiKey())
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                    .block();

            List<?> weatherList = response.get("weather") instanceof List<?> list ? list : List.of();
            String main = "Clear";
            if (!weatherList.isEmpty() && weatherList.get(0) instanceof Map<?, ?> weatherMap) {
                Object mainValue = weatherMap.get("main");
                main = mainValue != null ? String.valueOf(mainValue) : "Clear";
            }
            Map<?, ?> mainMap = response.get("main") instanceof Map<?, ?> map ? map : Map.of();
            Map<?, ?> windMap = response.get("wind") instanceof Map<?, ?> map ? map : Map.of();
            return new WeatherInfo(main, toDouble(mainMap.get("temp"), 22.0), toDouble(windMap.get("speed"), 3.0));
        } catch (Exception e) {
            log.warn("Weather lookup failed, using fallback: {}", e.getMessage());
            return new WeatherInfo("Clear", 22.0, 3.0);
        }
    }

    private RouteInfo resolveRoute(Coordinates origin, Coordinates destination) {
        if (config.isUseExternalRouting()) {
            try {
                String coordinates = origin.longitude() + "," + origin.latitude() + ";" + destination.longitude() + "," + destination.latitude();
                Map<?, ?> response = routeWebClient.get()
                        .uri("/route/v1/driving/{coordinates}?overview=false&alternatives=false", coordinates)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                        .block();
                List<?> routes = response.get("routes") instanceof List<?> list ? list : List.of();
                if (!routes.isEmpty() && routes.get(0) instanceof Map<?, ?> route) {
                    double distanceKm = toDouble(route.get("distance"), 0) / 1000.0;
                    double minutes = toDouble(route.get("duration"), 0) / 60.0;
                    if (distanceKm > 0 && minutes > 0) {
                        return new RouteInfo(distanceKm, minutes);
                    }
                }
            } catch (Exception e) {
                log.warn("OSRM route lookup failed, using haversine fallback: {}", e.getMessage());
            }
        }
        double distanceKm = haversineKm(origin, destination);
        return new RouteInfo(distanceKm, Math.max(5.0, distanceKm * 4.5 + 8.0));
    }

    private PredictionResult callMlOrFallback(DeliveryEtaMlRequest request) {
        if (config.isUseMl()) {
            try {
                DeliveryEtaMlResponse response = mlWebClient.post()
                        .uri("/predict")
                        .bodyValue(request)
                        .retrieve()
                        .bodyToMono(DeliveryEtaMlResponse.class)
                        .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                        .block();
                if (response != null && response.getEstimatedMinutes() != null) {
                    return new PredictionResult(
                            response.getEstimatedMinutes(),
                            response.getRiskLevel(),
                            response.getReason(),
                            response.getModelVersion() != null ? response.getModelVersion() : "delivery-eta-v1",
                            "ML"
                    );
                }
            } catch (Exception e) {
                log.warn("Delivery ETA ML service unavailable, using heuristic fallback: {}", e.getMessage());
            }
        }
        return heuristicPrediction(request);
    }

    private PredictionResult heuristicPrediction(DeliveryEtaMlRequest request) {
        double minutes = Math.max(request.getRouteDurationMinutes(), request.getDistanceKm() * 4.2 + 8);
        int score = 0;
        StringBuilder reason = new StringBuilder();
        if (request.getDistanceKm() >= 12) {
            score += 2;
            reason.append("long distance");
        } else if (request.getDistanceKm() >= 7) {
            score += 1;
            reason.append("medium distance");
        }
        if (Boolean.TRUE.equals(request.getIsRain())) {
            score += 2;
            minutes *= 1.22;
            appendReason(reason, "rain");
        }
        if (request.getHourOfDay() != null && List.of(7, 8, 17, 18, 19).contains(request.getHourOfDay())) {
            score += 1;
            minutes *= 1.15;
            appendReason(reason, "evening traffic");
        }
        if (request.getWindSpeed() != null && request.getWindSpeed() >= 10) {
            score += 1;
            appendReason(reason, "wind");
        }
        String risk = score >= 4 ? "HIGH" : score >= 2 ? "MEDIUM" : "LOW";
        return new PredictionResult((int) Math.round(minutes), risk, reason.isEmpty() ? "normal conditions" : reason.toString(), "delivery-eta-heuristic", "HEURISTIC");
    }

    private Coordinates coordinatesForDelivery(Delivery delivery) {
        return findZoneCoordinates(delivery.getAddress()).orElseGet(() -> deterministicJitter(new Coordinates(36.8065, 10.1815), delivery.getAddress(), 0.11));
    }

    private Coordinates coordinatesForDriver(User driver) {
        Optional<Coordinates> zoneCoordinates = findZoneCoordinates(driver.getDeliveryZone());
        if (zoneCoordinates.isPresent()) {
            return zoneCoordinates.get();
        }
        if (driver.getCurrentLatitude() != null && driver.getCurrentLongitude() != null
                && isTunisiaCoordinate(driver.getCurrentLatitude(), driver.getCurrentLongitude())
                && hasFreshDriverLocation(driver)) {
            return new Coordinates(driver.getCurrentLatitude(), driver.getCurrentLongitude());
        }
        return deterministicJitter(new Coordinates(36.8065, 10.1815), driver.getEmail(), 0.055);
    }

    private boolean hasFreshDriverLocation(User driver) {
        return driver.getLastLocationUpdatedAt() != null
                && ChronoUnit.HOURS.between(driver.getLastLocationUpdatedAt(), LocalDateTime.now()) <= 6;
    }

    private Coordinates nearbyOrigin(Coordinates destination) {
        return new Coordinates(destination.latitude() + 0.02, destination.longitude() - 0.02);
    }

    private Optional<Coordinates> findZoneCoordinates(String value) {
        String normalized = normalize(value);
        ZoneMatch bestMatch = null;
        for (int zoneIndex = 0; zoneIndex < zoneDefinitions.size(); zoneIndex++) {
            ZoneDefinition zone = zoneDefinitions.get(zoneIndex);
            for (String alias : zone.aliases()) {
                String normalizedAlias = normalize(alias);
                if (containsLocationAlias(normalized, normalizedAlias)) {
                    ZoneMatch match = new ZoneMatch(zone.coords(), normalizedAlias.length(), zoneIndex);
                    if (bestMatch == null
                            || match.aliasLength() > bestMatch.aliasLength()
                            || (match.aliasLength() == bestMatch.aliasLength() && match.zoneIndex() < bestMatch.zoneIndex())) {
                        bestMatch = match;
                    }
                }
            }
        }
        return bestMatch == null ? Optional.empty() : Optional.of(bestMatch.coords());
    }

    private static boolean containsLocationAlias(String text, String alias) {
        return !text.isBlank() && !alias.isBlank() && (" " + text + " ").contains(" " + alias + " ");
    }

    private String formatOrderNumber(Delivery delivery) {
        if (delivery.getCartId() == null) return "ORD-UNKNOWN";
        int year = delivery.getDeliveryDate() != null ? delivery.getDeliveryDate().getYear() : LocalDateTime.now().getYear();
        String shortHex = delivery.getCartId().toHexString().substring(0, Math.min(5, delivery.getCartId().toHexString().length())).toUpperCase();
        return "ORD-" + year + "-" + shortHex;
    }

    private DeliveryEtaPredictionDTO toDto(DeliveryEtaPrediction prediction) {
        return DeliveryEtaPredictionDTO.builder()
                .id(prediction.getId() != null ? prediction.getId().toHexString() : null)
                .deliveryId(prediction.getDeliveryId() != null ? prediction.getDeliveryId().toHexString() : null)
                .orderId(prediction.getOrderId() != null ? prediction.getOrderId().toHexString() : null)
                .orderNumber(prediction.getOrderNumber())
                .estimatedMinutes(prediction.getEstimatedMinutes())
                .riskLevel(prediction.getRiskLevel())
                .reason(prediction.getReason())
                .weather(prediction.getWeather())
                .temperatureC(prediction.getTemperatureC())
                .windSpeed(prediction.getWindSpeed())
                .distanceKm(prediction.getDistanceKm())
                .routeDurationMinutes(prediction.getRouteDurationMinutes())
                .originLatitude(prediction.getOriginLatitude())
                .originLongitude(prediction.getOriginLongitude())
                .destinationLatitude(prediction.getDestinationLatitude())
                .destinationLongitude(prediction.getDestinationLongitude())
                .modelVersion(prediction.getModelVersion())
                .source(prediction.getSource())
                .createdAt(prediction.getCreatedAt())
                .build();
    }

    private static double haversineKm(Coordinates a, Coordinates b) {
        double radius = 6371;
        double dLat = Math.toRadians(b.latitude() - a.latitude());
        double dLon = Math.toRadians(b.longitude() - a.longitude());
        double lat1 = Math.toRadians(a.latitude());
        double lat2 = Math.toRadians(b.latitude());
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }

    private static Coordinates deterministicJitter(Coordinates base, String seed, double amount) {
        return new Coordinates(
                round(base.latitude() + deterministicOffset(seed, 17, amount)),
                round(base.longitude() + deterministicOffset(seed, 53, amount))
        );
    }

    private static double deterministicOffset(String seed, int salt, double amount) {
        int hash = salt;
        String safeSeed = seed == null ? "" : seed;
        for (int i = 0; i < safeSeed.length(); i++) hash = Math.floorMod(hash * 31 + safeSeed.charAt(i), 1000003);
        return (((hash % 2000) / 1000.0) - 1.0) * amount;
    }

    private static boolean isRain(String weather) {
        String value = normalize(weather);
        return value.contains("rain") || value.contains("storm") || value.contains("thunder");
    }

    private static boolean isTunisiaCoordinate(double lat, double lon) {
        return lat >= 30 && lat <= 38.5 && lon >= 7 && lon <= 12.5;
    }

    private static String normalize(String value) {
        return value == null ? "" : java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static void appendReason(StringBuilder reason, String value) {
        if (!reason.isEmpty()) reason.append(" + ");
        reason.append(value);
    }

    private static double toDouble(Object value, double fallback) {
        if (value instanceof Number number) return number.doubleValue();
        try {
            return value == null ? fallback : Double.parseDouble(String.valueOf(value));
        } catch (Exception e) {
            return fallback;
        }
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record Coordinates(double latitude, double longitude) {}
    private record ZoneDefinition(Coordinates coords, List<String> aliases) {}
    private record ZoneMatch(Coordinates coords, int aliasLength, int zoneIndex) {}
    private record WeatherInfo(String main, Double temperatureC, Double windSpeed) {}
    private record RouteInfo(Double distanceKm, Double durationMinutes) {}
    private record PredictionResult(Integer estimatedMinutes, String riskLevel, String reason, String modelVersion, String source) {}
}
