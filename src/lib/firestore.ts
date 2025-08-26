// ==============================================
// 4. src/lib/firestore.ts
// ==============================================
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc,
  getDoc,
  query, 
  where, 
  orderBy, 
  Timestamp,
  updateDoc,
  increment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Photo, Album } from '@/types';

export const createAlbum = async (name: string): Promise<string> => {
  const albumData = {
    name,
    createdAt: Timestamp.fromDate(new Date()),
    views: 0
  };
  
  const docRef = await addDoc(collection(db, 'albums'), albumData);
  
  // Update with share link
  const shareLink = `${window.location.origin}/album/${docRef.id}`;
  await updateDoc(doc(db, 'albums', docRef.id), { shareLink });
  
  return docRef.id;
};

export const savePhoto = async (photoData: Omit<Photo, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'photos'), {
    ...photoData,
    uploadTime: Timestamp.fromDate(photoData.uploadTime),
    deleteAt: Timestamp.fromDate(photoData.deleteAt)
  });
  
  return docRef.id;
};

export const getAlbumPhotos = async (albumId: string): Promise<Photo[]> => {
  const q = query(
    collection(db, 'photos'),
    where('albumId', '==', albumId),
    orderBy('uploadTime', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    uploadTime: doc.data().uploadTime.toDate(),
    deleteAt: doc.data().deleteAt.toDate()
  })) as Photo[];
};

export const getAlbum = async (albumId: string): Promise<Album | null> => {
  const albumDoc = await getDoc(doc(db, 'albums', albumId));
  
  if (!albumDoc.exists()) return null;
  
  const albumData = albumDoc.data();
  const photos = await getAlbumPhotos(albumId);
  
  return {
    id: albumDoc.id,
    ...albumData,
    photos,
    createdAt: albumData.createdAt.toDate()
  } as Album;
};

export const incrementAlbumViews = async (albumId: string): Promise<void> => {
  await updateDoc(doc(db, 'albums', albumId), {
    views: increment(1)
  });
};

export const getAllAlbums = async (): Promise<Album[]> => {
  const q = query(collection(db, 'albums'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  const albums = await Promise.all(
    snapshot.docs.map(async (albumDoc) => {
      const albumData = albumDoc.data();
      const photos = await getAlbumPhotos(albumDoc.id);
      
      return {
        id: albumDoc.id,
        ...albumData,
        photos,
        createdAt: albumData.createdAt.toDate()
      } as Album;
    })
  );
  
  return albums;
};
