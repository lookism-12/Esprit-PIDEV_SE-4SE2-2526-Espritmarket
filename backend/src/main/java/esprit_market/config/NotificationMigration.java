package esprit_market.config;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time migration: converts old notifications that stored the user as a
 * DBRef ({ "$ref": "users", "$id": ObjectId(...) }) into the new flat format
 * (userId: ObjectId, userFullName: String).
 *
 * Safe to run multiple times — skips documents that already have userId set.
 */
@Component
@RequiredArgsConstructor
public class NotificationMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(NotificationMigration.class);

    private final MongoTemplate mongoTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            migrateNotifications();
        } catch (Exception e) {
            log.error("Notification migration failed — app will continue but old notifications may not load", e);
        }
    }

    private void migrateNotifications() {
        MongoCollection<Document> notifications =
                mongoTemplate.getDb().getCollection("notifications");
        MongoCollection<Document> users =
                mongoTemplate.getDb().getCollection("users");

        // Find all docs that still have the old 'user' DBRef field and no 'userId'
        long total = notifications.countDocuments(
                Filters.and(
                        Filters.exists("user"),
                        Filters.exists("userId", false)
                )
        );

        if (total == 0) {
            log.info("Notification migration: nothing to migrate.");
            return;
        }

        log.info("Notification migration: migrating {} documents...", total);
        int migrated = 0;
        int failed = 0;

        try (MongoCursor<Document> cursor = notifications.find(
                Filters.and(
                        Filters.exists("user"),
                        Filters.exists("userId", false)
                )
        ).cursor()) {

            while (cursor.hasNext()) {
                Document doc = cursor.next();
                try {
                    ObjectId notifId = doc.getObjectId("_id");
                    Object userField = doc.get("user");

                    ObjectId userId = null;

                    if (userField instanceof Document userDoc) {
                        // DBRef stored as { "$ref": "users", "$id": ObjectId }
                        Object idVal = userDoc.get("$id");
                        if (idVal instanceof ObjectId oid) {
                            userId = oid;
                        } else if (idVal instanceof Document idDoc) {
                            userId = idDoc.getObjectId("$oid");
                        }
                    } else if (userField instanceof ObjectId oid) {
                        userId = oid;
                    }

                    if (userId == null) {
                        // No user reference — just remove the stale field
                        notifications.updateOne(
                                Filters.eq("_id", notifId),
                                Updates.unset("user")
                        );
                        migrated++;
                        continue;
                    }

                    // Look up the user's name
                    Document user = users.find(Filters.eq("_id", userId)).first();
                    String fullName = "";
                    if (user != null) {
                        String first = user.getString("firstName");
                        String last  = user.getString("lastName");
                        fullName = ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
                    }

                    // Update the notification document
                    notifications.updateOne(
                            Filters.eq("_id", notifId),
                            Updates.combine(
                                    Updates.set("userId", userId),
                                    Updates.set("userFullName", fullName),
                                    Updates.unset("user")
                            )
                    );
                    migrated++;

                } catch (Exception e) {
                    log.warn("Failed to migrate notification {}: {}", doc.get("_id"), e.getMessage());
                    failed++;
                }
            }
        }

        log.info("Notification migration complete: {} migrated, {} failed.", migrated, failed);
    }
}
