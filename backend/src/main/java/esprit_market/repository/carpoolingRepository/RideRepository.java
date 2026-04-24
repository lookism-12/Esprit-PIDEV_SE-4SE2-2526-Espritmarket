package esprit_market.repository.carpoolingRepository;

import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.entity.carpooling.Ride;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RideRepository extends MongoRepository<Ride, ObjectId> {

        List<Ride> findByDepartureLocationAndDestinationLocationAndDepartureTimeAfterAndAvailableSeatsGreaterThanEqualAndStatus(
                        String departureLocation, String destinationLocation, LocalDateTime departureTime,
                        Integer minSeats,
                        RideStatus status);

        List<Ride> findByDriverProfileId(ObjectId driverProfileId);

        List<Ride> findByStatusAndDepartureTimeBefore(RideStatus status, LocalDateTime before);

        List<Ride> findByStatus(RideStatus status);

        @org.springframework.data.mongodb.repository.Query("{$and: [" +
                        "{?0: null, $or: [{'departureLocation': ?0}, {?0: null}]}, " +
                        "{?1: null, $or: [{'destinationLocation': ?1}, {?1: null}]}, " +
                        "{?2: null, $or: [{'departureTime': {$gte: ?2}}, {?2: null}]}, " +
                        "{?3: null, $or: [{'availableSeats': {$gte: ?3}}, {?3: null}]}, " +
                        "{?4: null, $or: [{'status': ?4}, {?4: null}]}" +
                        "]}")
        List<Ride> findByFilters(String departureLocation, String destinationLocation, LocalDateTime departureTime,
                        Integer availableSeats, RideStatus status);

        List<Ride> findByVehicleId(ObjectId vehicleId);

    long countByStatusIn(java.util.Collection<RideStatus> statuses);

    @org.springframework.data.mongodb.repository.Aggregation(pipeline = {
        "{ $group: { _id: { $dateToString: { format: '%m', date: '$createdAt' } }, count: { $sum: 1 } } }",
        "{ $sort: { _id: 1 } }"
    })
    List<esprit_market.dto.carpooling.stats.AggregationResult> getMonthlyRidesTrend();

    @org.springframework.data.mongodb.repository.Aggregation(pipeline = {
        "{ $group: { _id: '$status', count: { $sum: 1 } } }"
    })
    List<esprit_market.dto.carpooling.stats.AggregationResult> getStatusDistribution();

    @org.springframework.data.mongodb.repository.Aggregation(pipeline = {
        "{ $project: { route: { $concat: ['$departureLocation', ' → ', '$destinationLocation'] } } }",
        "{ $group: { _id: '$route', count: { $sum: 1 } } }",
        "{ $sort: { count: -1 } }",
        "{ $limit: 5 }"
    })
    List<esprit_market.dto.carpooling.stats.AggregationResult> getTopRoutes();
}
