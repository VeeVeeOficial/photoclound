// src/lib/firestore.ts
// ==============================================
// ใช้ Apps Script แทน Firestore
// ==============================================

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzbUwa134-yZMcNzxpLetPGyUcibPvw9ZkY_BrQi8u_wWvK-M7sqqkKOhHmY2Ef31Jr/exec';

import { Album, Photo } from '@/types';

// === สร้างอัลบั้ม ===
export const createAlbum = async (name: string): Promise<string> => {
  const payload = {
    action: 'create_album',
    name,
    createdAt: new Date().toISOString(),
  };

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create album');
  return data.albumId; // Apps Script คืน id อัลบั้ม
};

// === บันทึก metadata ของรูป ===
export const savePhoto = async (photoData: Omit<Photo, 'id'>): Promise<string> => {
  const payload = {
    action: 'save_photo',
    ...photoData,
    uploadTime: photoData.uploadTime.toISOString(),
    deleteAt: photoData.deleteAt.toISOString(),
  };

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to save photo');
  return data.photoId; // Apps Script คืน id ของรูป
};

// === อ่านรูปจากอัลบั้ม ===
export const getAlbumPhotos = async (albumId: string): Promise<Photo[]> => {
  const res = await fetch(`${APPS_SCRIPT_URL}?action=get_photos&albumId=${albumId}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to load photos');
  return data.photos;
};

// === อ่านข้อมูลอัลบั้มเดียว ===
export const getAlbum = async (albumId: string): Promise<Album | null> => {
  const res = await fetch(`${APPS_SCRIPT_URL}?action=get_album&albumId=${albumId}`);
  const data = await res.json();
  if (!data.success) return null;
  return data.album as Album;
};

// === อ่านอัลบั้มทั้งหมด ===
export const getAllAlbums = async (): Promise<Album[]> => {
  const res = await fetch(`${APPS_SCRIPT_URL}?action=get_albums`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to load albums');
  return data.albums as Album[];
};
// เพิ่ม views ของ album
export const incrementAlbumViews = async (albumId: string): Promise<void> => {
  console.log(`Mock increment views for album ${albumId}`);
  // ถ้าใช้ Firestore จริง:
  // await updateDoc(doc(db, 'albums', albumId), {
  //   views: increment(1)
  // });
};
