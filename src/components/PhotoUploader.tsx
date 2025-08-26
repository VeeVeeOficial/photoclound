'use client';

import React, { useState } from 'react';
import { Upload, Camera, Check, X, Pause, Play } from 'lucide-react';
import { createAlbum, savePhoto } from '@/lib/firestore';
import { Album, UploadProgress, Photo } from '@/types';

interface PhotoUploaderProps {
  onAlbumCreated: (album: Album) => void;
}

// Apps Script Configuration
const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw35O0W7PsgNu_Hh2jHsB87dVvS5tjxWXqUWa6ygOMze6ylLtYOZ80jweCAURvDN6T7/exec';

// Batch upload types
type UploadResult = {
  file: File;
  ok: boolean;
  url?: string;
  error?: string;
};

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onAlbumCreated }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [albumName, setAlbumName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [batchStats, setBatchStats] = useState({
    done: 0,
    success: 0,
    failed: 0,
    total: 0,
  });

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Check if error should trigger retry
  const shouldRetry = (err: unknown) => {
    const msg = String(err instanceof Error ? err.message : err || '').toLowerCase();
    return (
      msg.includes('timeout') ||
      msg.includes('too many scripts running simultaneously') ||
      msg.includes('service invoked too many times') ||
      msg.includes('rate') ||
      msg.includes('exceeded') ||
      msg.includes('503') ||
      msg.includes('429')
    );
  };

  // Retry helper
  async function retry<T>(
    fn: () => Promise<T>,
    max = 3,
    baseMs = 800
  ): Promise<T> {
    let attempt = 0;
    let lastErr: unknown;
    while (attempt <= max) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        if (attempt === max || !shouldRetry(e)) break;
        const wait = baseMs * Math.pow(2, attempt) + Math.random() * 250;
        await new Promise((r) => setTimeout(r, wait));
        attempt++;
      }
    }
    throw lastErr;
  }

  // Upload single file to Apps Script
  const uploadToAppsScript = async (
    file: File,
    albumId: string
  ): Promise<string> => {
    const base64Data = await fileToBase64(file);

    const payload = {
      action: 'upload_photo',
      fileName: file.name,
      mimeType: file.type,
      data: base64Data,
      albumId: albumId,
      folder: 'photo-share-albums',
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: { success: boolean; directUrl: string; error?: string } =
      await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Apps Script upload failed');
    }

    return result.directUrl;
  };

  // Batch upload with concurrency control
  const batchUploadToAppsScript = async (
    files: File[],
    albumId: string,
    opts?: {
      concurrency?: number;
      maxRetries?: number;
      onProgress?: (
        done: number,
        total: number,
        success: number,
        fail: number
      ) => void;
    }
  ): Promise<UploadResult[]> => {
    const total = files.length;
    const concurrency = Math.max(1, Math.min(opts?.concurrency ?? 6, 20));
    const maxRetries = opts?.maxRetries ?? 3;

    const queue = files.slice();
    const results: UploadResult[] = [];
    let done = 0,
      success = 0,
      fail = 0;

    const next = async (): Promise<void> => {
      while (!paused && queue.length > 0) {
        const file = queue.shift();
        if (!file) break;

        // Update individual file progress
        setUploadProgress((prev) =>
          prev.map((item) =>
            item.fileName === file.name
              ? { ...item, progress: 20, status: 'uploading' }
              : item
          )
        );

        try {
          const url = await retry(() => uploadToAppsScript(file, albumId), maxRetries);
          results.push({ file, ok: true, url });
          success++;

          // Update file progress to completed
          setUploadProgress((prev) =>
            prev.map((item) =>
              item.fileName === file.name
                ? { ...item, progress: 100, status: 'completed' }
                : item
            )
          );
        } catch (e) {
          const err = e as Error;
          results.push({ file, ok: false, error: err.message || String(e) });
          fail++;

          // Update file progress to error
          setUploadProgress((prev) =>
            prev.map((item) =>
              item.fileName === file.name ? { ...item, status: 'error' } : item
            )
          );
        } finally {
          done++;
          opts?.onProgress?.(done, total, success, fail);

          // Small delay between uploads to avoid overwhelming the server
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    };

    // Start workers
    await Promise.all(Array.from({ length: concurrency }, () => next()));
    return results;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedFiles(files);
      setAlbumName(`Album ${new Date().toLocaleDateString()}`);

      // Initialize progress for all files
      const progressArray: UploadProgress[] = files.map((file) => ({
        fileName: file.name,
        progress: 0,
        status: 'waiting',
      }));
      setUploadProgress(progressArray);
      setBatchStats({ done: 0, success: 0, failed: 0, total: files.length });
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !albumName) return;

    setUploading(true);
    setPaused(false);

    try {
      console.log(
        `🚀 Starting batch upload of ${selectedFiles.length} files...`
      );

      // Create album first
      const albumId = await createAlbum(albumName);
      console.log(`📁 Album created: ${albumId}`);

      const uploadedPhotos: Photo[] = [];

      // Use batch upload
      const results = await batchUploadToAppsScript(selectedFiles, albumId, {
        concurrency: 6, // จำกัดที่ 6 concurrent uploads
        maxRetries: 3,
        onProgress: (done, total, success, failed) => {
          setBatchStats({ done, success, failed, total });
          console.log(
            `Progress: ${done}/${total} (✅${success}, ❌${failed})`
          );
        },
      });

      // Process successful uploads
      for (const result of results) {
        if (result.ok && result.url) {
          try {
            const photoData: Omit<Photo, 'id'> = {
              fileName: result.file.name,
              downloadURL: result.url,
              filePath: `photo-share-albums/${albumId}/${result.file.name}`,
              albumId: albumId,
              uploadTime: new Date(),
              deleteAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              fileSize: result.file.size,
            };

            const photoId = await savePhoto(photoData);
            uploadedPhotos.push({ id: photoId, ...photoData });
          } catch (e) {
            console.error('Failed to save photo metadata:', e);
          }
        }
      }

      // Create album object
      const newAlbum: Album = {
        id: albumId,
        name: albumName,
        photos: uploadedPhotos,
        shareLink: `${window.location.origin}/album/${albumId}`,
        createdAt: new Date(),
        views: 0,
      };

      console.log(
        `🎉 Batch upload completed! ${uploadedPhotos.length}/${selectedFiles.length} files successful`
      );

      onAlbumCreated(newAlbum);

      // Show results
      const successCount = results.filter((r) => r.ok).length;
      const failCount = results.filter((r) => !r.ok).length;

      if (successCount === selectedFiles.length) {
        alert(`🎉 อัปโหลดสำเร็จทั้งหมด ${successCount} ไฟล์!`);
      } else {
        alert(
          `📊 อัปโหลดเสร็จสิ้น\n✅ สำเร็จ: ${successCount} ไฟล์\n❌ ล้มเหลว: ${failCount} ไฟล์\n\nตรวจสอบรายละเอียดด้านล่าง`
        );
      }

      // Reset form
      setSelectedFiles([]);
      setAlbumName('');
    } catch (error) {
      console.error('❌ Batch upload process failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      alert('เกิดข้อผิดพลาดในการอัปโหลด: ' + errorMessage);
    } finally {
      setUploading(false);
      setPaused(false);
    }
  };

  const handlePauseResume = () => {
    setPaused(!paused);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadProgress((prev) => prev.filter((_, i) => i !== index));
    setBatchStats((prev) => ({ ...prev, total: prev.total - 1 }));
  };

  // Calculate total progress
  const totalProgress =
    uploadProgress.length > 0
      ? uploadProgress.reduce((sum, item) => sum + item.progress, 0) /
        uploadProgress.length
      : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Upload Photos - Batch Support
        </h2>

        {/* Batch Upload Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-blue-600 mr-3">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-blue-800 font-medium">Smart Batch Upload</p>
              <p className="text-blue-700 text-sm">
                รองรับการอัปโหลดหลายร้อยไฟล์ พร้อม retry อัตโนมัติและควบคุมความเร็ว
              </p>
            </div>
          </div>
        </div>

        {/* Album Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Album Name
          </label>
          <input
            type="text"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter album name..."
          />
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center mb-6 hover:border-blue-400 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="fileInput"
            disabled={uploading}
          />
          <label
            htmlFor="fileInput"
            className={`cursor-pointer flex flex-col items-center ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Camera size={48} className="text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Click to upload photos
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPG up to 10MB each • Supports hundreds of files
            </p>
          </label>
        </div>

        {/* Batch Statistics */}
        {uploading && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Batch Progress</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {batchStats.done}/{batchStats.total} files
                </span>
                <button
                  onClick={handlePauseResume}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  {paused ? <Play size={16} /> : <Pause size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {batchStats.success}
                </div>
                <div className="text-xs text-gray-500">Success</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {batchStats.failed}
                </div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(totalProgress)}%
                </div>
                <div className="text-xs text-gray-500">Complete</div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(batchStats.done / batchStats.total) * 100}%`,
                }}
              />
            </div>

            {paused && (
              <div className="text-center mt-2 text-orange-600 font-medium">
                ⏸ Paused - Click play to resume
              </div>
            )}
          </div>
        )}

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-3">
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {selectedFiles.map((file, index) => {
                const progress = uploadProgress.find(
                  (p) => p.fileName === file.name
                );
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        {progress?.status === 'completed' && (
                          <Check size={16} className="text-green-600" />
                        )}
                        {progress?.status === 'error' && (
                          <X size={16} className="text-red-600" />
                        )}
                        {progress?.status === 'uploading' && (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        {(!progress || progress.status === 'waiting') && (
                          <Camera size={16} className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-xs">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                          {progress && (
                            <span className="ml-2">
                              {progress.status === 'completed' && '✅ Done'}
                              {progress.status === 'error' && '❌ Failed'}
                              {progress.status === 'uploading' &&
                                '⏳ Uploading...'}
                              {progress.status === 'waiting' && '⏳ Waiting...'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {!uploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || !albumName || uploading}
          className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
            selectedFiles.length === 0 || !albumName || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
          }`}
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Batch Uploading... ({batchStats.done}/{batchStats.total})
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Upload size={16} />
              Create Album ({selectedFiles.length} photos)
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default PhotoUploader;
