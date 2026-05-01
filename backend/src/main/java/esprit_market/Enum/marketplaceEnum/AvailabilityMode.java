package esprit_market.Enum.marketplaceEnum;

public enum AvailabilityMode {
    ONLINE,
    IN_PERSON,
    BOTH;

    public boolean allows(MeetingMode meetingMode) {
        if (this == BOTH) {
            return true;
        }
        if (this == ONLINE) {
            return meetingMode == MeetingMode.ONLINE;
        }
        return meetingMode == MeetingMode.IN_PERSON;
    }
}
