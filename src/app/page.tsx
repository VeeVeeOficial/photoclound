// ==============================================
// Fixed AlbumViewer.tsx - รับ album เดียว
// ==============================================
'use client';

import React, { useState } from 'react';
import { ArrowLeft, Download, Share2, Calendar, Camera, Eye, Check, Clock } from 'lucide-react';
import { Album, Photo } from '@/types';
import Image from 'next/image';

interface AlbumViewerProps {
  album: Album;    // รับ album เดียว ไม่ใช่ albums array
  onBack: () => void;
}

const AlbumViewer: React.FC<AlbumViewerProps> = ({ album, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const copyShareLink = () => {
    navigator.clipboard.writeText(album.shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(photo.downloadURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const getTimeLeft = (deleteAt: Date) => {
    const now = new Date();
    const timeLeft = deleteAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Album Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold mb-2">{album.name}</h2>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  {album.createdAt.toLocaleDateString('th-TH')}
                </span>
                <span className="flex items-center gap-1">
                  <Camera size={16} />
                  {album.photos.length} photo{album.photos.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={16} />
                  {album.views} view{album.views !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={copyShareLink}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? 'Copied!' : 'Share Album'}
          </button>
        </div>

        {/* Auto-delete warning */}
        {album.photos.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
            <Clock size={16} className="text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Photos will be automatically deleted in {getTimeLeft(album.photos[0].deleteAt)}
            </span>
          </div>
        )}
      </div>

      {/* Photos Grid */}
      {album.photos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Camera size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No photos in this album</h3>
          <p className="text-gray-500">This album is empty or all photos have been deleted.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {album.photos.map(photo => (
              <div key={photo.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer">
                <Image
                  src={photo.downloadURL}
                  alt={photo.fileName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  onClick={() => setSelectedPhoto(photo)}
                />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPhoto(photo);
                    }}
                    className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
                  >
                    <Download size={16} />
                  </button>
                </div>
                
                {/* Photo info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-white text-sm truncate">{photo.fileName}</p>
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span>{formatFileSize(photo.fileSize)}</span>
                    <span>{getTimeLeft(photo.deleteAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={selectedPhoto.downloadURL}
              alt={selectedPhoto.fileName}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
              priority
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadPhoto(selectedPhoto);
                }}
                className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumViewer;