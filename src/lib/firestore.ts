// lib/firestore.ts - Mock functions
import { Album, Photo } from '@/types';

// Mock storage - using const for arrays (ESLint preferred)
const mockAlbums: Album[] = [];
const mockPhotos: Photo[] = [];

export async function createAlbum(name: string): Promise<string> {
  const albumId = Math.random().toString(36).substring(2, 15);
  
  const newAlbum: Album = {
    id: albumId,
    name: name,
    photos: [],
    shareLink: typeof window !== 'undefined' 
      ? `${window.location.origin}/album/${albumId}` 
      : `https://your-domain.vercel.app/album/${albumId}`,
    createdAt: new Date(),
    views: 0
  };
  
  mockAlbums.unshift(newAlbum);
  console.log('Album created:', albumId, name);
  return albumId;
}

export async function savePhoto(photoData: Omit<Photo, 'id'>): Promise<string> {
  const photoId = Math.random().toString(36).substring(2, 15);
  
  const photo: Photo = {
    id: photoId,
    fileName: photoData.fileName,
    downloadURL: photoData.downloadURL,
    filePath: photoData.filePath,
    albumId: photoData.albumId,
    uploadTime: photoData.uploadTime,
    deleteAt: photoData.deleteAt,
    fileSize: photoData.fileSize
  };
  
  mockPhotos.push(photo);
  
  // อัปเดต album ให้มี photo นี้
  const albumIndex = mockAlbums.findIndex(a => a.id === photoData.albumId);
  if (albumIndex !== -1) {
    mockAlbums[albumIndex].photos.push(photo);
  }
  
  console.log('Photo saved:', photoId, photoData.fileName);
  return photoId;
}

export async function getAllAlbums(): Promise<Album[]> {
  console.log('Getting all albums, found:', mockAlbums.length);
  return [...mockAlbums];
}

export async function getAlbum(albumId: string): Promise<Album | null> {
  const album = mockAlbums.find(a => a.id === albumId);
  console.log('Getting album:', albumId, album ? 'found' : 'not found');
  return album || null;
}

export async function getAlbumPhotos(albumId: string): Promise<Photo[]> {
  const photos = mockPhotos.filter(p => p.albumId === albumId);
  console.log('Getting photos for album:', albumId, 'found:', photos.length);
  return photos;
}

export async function incrementAlbumViews(albumId: string): Promise<void> {
  const albumIndex = mockAlbums.findIndex(a => a.id === albumId);
  if (albumIndex !== -1) {
    mockAlbums[albumIndex].views += 1;
    console.log('Incremented views for album:', albumId);
  }
}