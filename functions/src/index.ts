import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// ================================
// Auto-delete expired photos every hour
// ================================
export const autoDeleteExpiredPhotos = onSchedule(
  {
    schedule: "0 * * * *", // Every hour
    timeZone: "Asia/Bangkok",
  },
  async () => {
    logger.info("🗑️ Starting auto-delete process...");

    const db = admin.firestore();
    const storage = admin.storage().bucket();
    const now = admin.firestore.Timestamp.now();

    try {
      // Find expired photos
      const expiredPhotos = await db
        .collection("photos")
        .where("deleteAt", "<=", now.toDate())
        .get();

      logger.info(`Found ${expiredPhotos.size} expired photos`);

      if (expiredPhotos.empty) {
        logger.info("No expired photos found");
        return;
      }

      const deletePromises: Promise<unknown>[] = [];

      expiredPhotos.forEach((doc) => {
        const photoData = doc.data();

        // Delete from Storage
        const storageDeletePromise = storage
          .file(photoData.filePath)
          .delete()
          .catch((error) => {
            logger.error(`Failed to delete file ${photoData.filePath}:`, error.message);
          });

        // Delete from Firestore
        const firestoreDeletePromise = doc.ref.delete();

        deletePromises.push(storageDeletePromise, firestoreDeletePromise);
      });

      await Promise.all(deletePromises);
      logger.info(`✅ Successfully processed ${expiredPhotos.size} expired photos`);

      // Clean up empty albums
      await cleanupEmptyAlbums(db);
    } catch (error) {
      logger.error("❌ Auto-delete error:", error);
    }
  }
);

// ================================
// Clean up empty albums daily at 2 AM
// ================================
export const cleanupEmptyAlbumsScheduled = onSchedule(
  {
    schedule: "0 2 * * *", // Daily at 2 AM
    timeZone: "Asia/Bangkok",
  },
  async () => {
    const db = admin.firestore();
    await cleanupEmptyAlbums(db);
  }
);

// ================================
// Helper function to clean empty albums
// ================================
async function cleanupEmptyAlbums(db: admin.firestore.Firestore): Promise<void> {
  logger.info("🧹 Cleaning up empty albums...");

  try {
    const albums = await db.collection("albums").get();
    let deletedCount = 0;

    for (const albumDoc of albums.docs) {
      const albumId = albumDoc.id;
      const photosCount = await db
        .collection("photos")
        .where("albumId", "==", albumId)
        .get();

      if (photosCount.empty) {
        await albumDoc.ref.delete();
        deletedCount++;
        logger.info(`Deleted empty album: ${albumId}`);
      }
    }

    logger.info(`✅ Deleted ${deletedCount} empty albums`);
  } catch (error) {
    logger.error("❌ Cleanup error:", error);
  }
}

// ================================
// Manual delete function (for admin use)
// ================================
export const forceDeleteAlbum = onCall(async (request) => {
  const albumId = request.data.albumId;

  if (!albumId) {
    throw new HttpsError("invalid-argument", "Album ID is required");
  }

  const db = admin.firestore();
  const storage = admin.storage().bucket();

  try {
    // Delete all photos in the album
    const photos = await db
      .collection("photos")
      .where("albumId", "==", albumId)
      .get();

    const deletePromises: Promise<unknown>[] = [];

    photos.forEach((doc) => {
      const photoData = doc.data();

      // Delete from Storage
      deletePromises.push(
        storage.file(photoData.filePath).delete().catch((error) => {
          logger.error(`Failed to delete file ${photoData.filePath}:`, error.message);
        })
      );

      // Delete from Firestore
      deletePromises.push(doc.ref.delete());
    });

    await Promise.all(deletePromises);

    // Delete the album
    await db.collection("albums").doc(albumId).delete();

    return { success: true, deletedPhotos: photos.size };
  } catch (error) {
    logger.error("Force delete error:", error);
    throw new HttpsError("internal", "Delete failed");
  }
});

// ================================
// Trigger when photo is deleted from Firestore
// ================================
export const onPhotoDelete = onDocumentDeleted("photos/{photoId}", async (event) => {
  const photoData = event.data?.data();

  if (!photoData) {
    logger.warn("No photo data found");
    return;
  }

  const storage = admin.storage().bucket();

  try {
    await storage.file(photoData.filePath).delete();
    logger.info(`🗑️ Deleted file: ${photoData.filePath}`);
  } catch (error) {
    logger.error(`Failed to delete file ${photoData.filePath}:`, error);
  }
});
