// types/index.ts
export interface Photo {
  id: string;
  fileName: string;
  downloadURL: string;
  filePath: string;
  albumId: string;
  uploadTime: Date;
  deleteAt: Date;
  fileSize: number;
}

export interface Album {
  id: string;
  name: string;
  photos: Photo[];
  shareLink: string;
  createdAt: Date;
  views: number;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'waiting' | 'uploading' | 'completed' | 'error';
}

export interface UploadResult {
  file: File;
  ok: boolean;
  url?: string;
  error?: string;
}