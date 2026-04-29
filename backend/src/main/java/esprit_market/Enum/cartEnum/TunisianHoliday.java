package esprit_market.Enum.cartEnum;

import java.time.LocalDate;
import java.time.Month;
import java.util.Arrays;
import java.util.List;

/**
 * Tunisian Holidays Enum
 * 
 * Defines major holidays in Tunisia for event-based promotions.
 * 
 * Note: Islamic holidays (Ramadan, Eid) follow the lunar calendar and vary each year.
 * These dates should be updated annually or calculated dynamically.
 */
public enum TunisianHoliday {
    
    // Fixed Holidays (Gregorian Calendar)
    NEW_YEAR("New Year's Day", Month.JANUARY, 1),
    INDEPENDENCE_DAY("Independence Day", Month.MARCH, 20),
    YOUTH_DAY("Youth Day", Month.MARCH, 21),
    MARTYRS_DAY("Martyrs' Day", Month.APRIL, 9),
    LABOUR_DAY("Labour Day", Month.MAY, 1),
    REPUBLIC_DAY("Republic Day", Month.JULY, 25),
    WOMENS_DAY("Women's Day", Month.AUGUST, 13),
    REVOLUTION_DAY("Revolution and Youth Day", Month.DECEMBER, 17);
    
    private final String displayName;
    private final Month month;
    private final int day;
    
    TunisianHoliday(String displayName, Month month, int day) {
        this.displayName = displayName;
        this.month = month;
        this.day = day;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public Month getMonth() {
        return month;
    }
    
    public int getDay() {
        return day;
    }
    
    /**
     * Get the date for this holiday in the specified year
     */
    public LocalDate getDateForYear(int year) {
        return LocalDate.of(year, month, day);
    }
    
    /**
     * Check if today is this holiday
     */
    public boolean isToday() {
        LocalDate today = LocalDate.now();
        return today.getMonth() == month && today.getDayOfMonth() == day;
    }
    
    /**
     * Check if the given date is this holiday
     */
    public boolean isDate(LocalDate date) {
        return date.getMonth() == month && date.getDayOfMonth() == day;
    }
    
    /**
     * Check if today is any Tunisian holiday
     */
    public static boolean isTodayHoliday() {
        return Arrays.stream(values()).anyMatch(TunisianHoliday::isToday);
    }
    
    /**
     * Get the current holiday if today is a holiday
     */
    public static TunisianHoliday getTodayHoliday() {
        return Arrays.stream(values())
                .filter(TunisianHoliday::isToday)
                .findFirst()
                .orElse(null);
    }
    
    /**
     * Check if the given date is any Tunisian holiday
     */
    public static boolean isHoliday(LocalDate date) {
        return Arrays.stream(values()).anyMatch(h -> h.isDate(date));
    }
    
    /**
     * Get all holidays for the current year
     */
    public static List<LocalDate> getAllHolidaysThisYear() {
        int currentYear = LocalDate.now().getYear();
        return Arrays.stream(values())
                .map(h -> h.getDateForYear(currentYear))
                .toList();
    }
}
