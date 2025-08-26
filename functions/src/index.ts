import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Auto-delete expired photos every hour
export const autoDeleteExpiredPhotos = functions.pubsub
  .schedule('0 * * * *') // Every hour
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    console.log('🗑️ Starting auto-delete process...');
    
    const db = admin.firestore();
    const storage = admin.storage().bucket();
    const now = admin.firestore.Timestamp.now();
    
    try {
      // Find expired photos
      const expiredPhotos = await db.collection('photos')
        .where('deleteAt', '<=', now.toDate())
        .get();
      
      console.log(`Found ${expiredPhotos.size} expired photos`);
      
      if (expiredPhotos.empty) {
        console.log('No expired photos found');
        return null;
      }

      const deletePromises: Promise<any>[] = [];
      
      expiredPhotos.forEach(doc => {
        const photoData = doc.data();
        
        // Delete from Storage
        const storageDeletePromise = storage
          .file(photoData.filePath)
          .delete()
          .catch(error => {
            console.log(`Failed to delete file ${photoData.filePath}:`, error.message);
          });
        
        // Delete from Firestore
        const firestoreDeletePromise = doc.ref.delete();
        
        deletePromises.push(storageDeletePromise, firestoreDeletePromise);
      });
      
      await Promise.all(deletePromises);
      console.log(`✅ Successfully processed ${expiredPhotos.size} expired photos`);
      
      // Clean up empty albums
      await cleanupEmptyAlbums(db);
      
      return null;
      
    } catch (error) {
      console.error('❌ Auto-delete error:', error);
      return null;
    }
  });

// Clean up empty albums daily at 2 AM
export const cleanupEmptyAlbumsScheduled = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2 AM
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    const db = admin.firestore();
    await cleanupEmptyAlbums(db);
    return null;
  });

// Helper function to clean empty albums
async function cleanupEmptyAlbums(db: admin.firestore.Firestore): Promise<void> {
  console.log('🧹 Cleaning up empty albums...');
  
  try {
    const albums = await db.collection('albums').get();
    let deletedCount = 0;
    
    for (const albumDoc of albums.docs) {
      const albumId = albumDoc.id;
      const photosCount = await db.collection('photos')
        .where('albumId', '==', albumId)
        .get();
      
      if (photosCount.empty) {
        await albumDoc.ref.delete();
        deletedCount++;
        console.log(`Deleted empty album: ${albumId}`);
      }
    }
    
    console.log(`✅ Deleted ${deletedCount} empty albums`);
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// Manual delete function (for admin use)
export const forceDeleteAlbum = functions.https.onCall(async (data, context) => {
  const albumId = data.albumId;
  
  if (!albumId) {
    throw new functions.https.HttpsError('invalid-argument', 'Album ID is required');
  }
  
  const db = admin.firestore();
  const storage = admin.storage().bucket();
  
  try {
    // Delete all photos in the album
    const photos = await db.collection('photos')
      .where('albumId', '==', albumId)
      .get();
    
    const deletePromises: Promise<any>[] = [];
    
    photos.forEach(doc => {
      const photoData = doc.data();
      
      // Delete from Storage
      deletePromises.push(
        storage.file(photoData.filePath).delete().catch(error => {
          console.log(`Failed to delete file ${photoData.filePath}:`, error.message);
        })
      );
      
      // Delete from Firestore
      deletePromises.push(doc.ref.delete());
    });
    
    await Promise.all(deletePromises);
    
    // Delete the album
    await db.collection('albums').doc(albumId).delete();
    
    return { success: true, deletedPhotos: photos.size };
    
  } catch (error) {
    console.error('Force delete error:', error);
    throw new functions.https.HttpsError('internal', 'Delete failed');
  }
});

// Trigger when photo is deleted from Firestore
export const onPhotoDelete = functions.firestore
  .document('photos/{photoId}')
  .onDelete(async (snap, context) => {
    const photoData = snap.data();
    
    if (!photoData) {
      console.log('No photo data found');
      return null;
    }
    
    const storage = admin.storage().bucket();
    
    try {
      await storage.file(photoData.filePath).delete();
      console.log(`🗑️ Deleted file: ${photoData.filePath}`);
    } catch (error) {
      console.log(`Failed to delete file ${photoData.filePath}:`, error);
    }
    
    return null;
  });