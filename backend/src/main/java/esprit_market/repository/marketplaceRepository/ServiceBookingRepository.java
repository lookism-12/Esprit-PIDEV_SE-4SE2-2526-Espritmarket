package esprit_market.repository.marketplaceRepository;

import esprit_market.Enum.marketplaceEnum.BookingStatus;
import esprit_market.entity.marketplace.ServiceBooking;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ServiceBookingRepository extends MongoRepository<ServiceBooking, ObjectId> {
    
    /**
     * Find all bookings for a specific service
     */
    List<ServiceBooking> findByServiceId(ObjectId serviceId);
    
    /**
     * Find all bookings for a specific user
     */
    List<ServiceBooking> findByUserId(ObjectId userId);
    
    /**
     * Find all bookings for a provider.
     */
    List<ServiceBooking> findByProviderId(ObjectId providerId);
    
    /**
     * Find bookings for a service on a specific date
     */
    List<ServiceBooking> findByServiceIdAndBookingDate(ObjectId serviceId, LocalDate date);
    
    /**
     * Find confirmed bookings for a service on a specific date
     */
    List<ServiceBooking> findByServiceIdAndBookingDateAndStatus(
            ObjectId serviceId, LocalDate date, BookingStatus status);
    
    /**
     * Find active bookings that can block a slot.
     */
    List<ServiceBooking> findByServiceIdAndBookingDateAndStatusIn(
            ObjectId serviceId, LocalDate date, List<BookingStatus> statuses);
    
    /**
     * Find all bookings for a shop
     */
    List<ServiceBooking> findByShopId(ObjectId shopId);
    
    /**
     * Find bookings by shop and status
     */
    List<ServiceBooking> findByShopIdAndStatus(ObjectId shopId, BookingStatus status);
    
    /**
     * Count confirmed bookings for a service
     */
    long countByServiceIdAndStatus(ObjectId serviceId, BookingStatus status);
}
