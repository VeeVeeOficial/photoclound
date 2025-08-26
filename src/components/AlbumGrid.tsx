// ==============================================
// 6. src/components/AlbumGrid.tsx - With Safety Checks
// ==============================================
'use client';

import React, { useState } from 'react';
import { Eye, Camera, Calendar, Trash2, Copy, Check } from 'lucide-react';
import { Album } from '@/types';
import Image from 'next/image';

interface AlbumGridProps {
  albums: Album[];
  onAlbumSelect?: (album: Album) => void;
  onAlbumDelete?: (albumId: string) => void;
}

const AlbumGrid: React.FC<AlbumGridProps> = ({ albums, onAlbumSelect, onAlbumDelete }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter out invalid albums
  const validAlbums = (albums || []).filter(album => 
    album && 
    typeof album === 'object' && 
    album.id && 
    album.name && 
    typeof album.name === 'string'
  );

  const copyShareLink = (shareLink: string, albumId: string) => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopiedId(albumId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown date';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (validAlbums.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera size={64} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-medium text-gray-600 mb-2">No albums yet</h3>
        <p className="text-gray-500">Upload some photos to create your first album!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Albums</h2>
        <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">
          {validAlbums.length} album{validAlbums.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {validAlbums.map(album => {
          const photos = Array.isArray(album.photos) ? album.photos : [];
          const validPhotos = photos.filter(photo => photo && photo.downloadURL && photo.id);
          
          return (
            <div key={album.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              {/* Album Thumbnail */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-1 h-48 bg-gray-100">
                  {validPhotos.slice(0, 4).map((photo, index) => (
                    <div key={photo.id} className={`relative ${
                      validPhotos.length === 1 ? 'col-span-2' : ''
                    } ${validPhotos.length === 2 && index === 0 ? 'col-span-2' : ''}`}>
                      <Image
                        src={photo.downloadURL}
                        alt={photo.fileName || 'Photo'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={(e) => {
                          // Hide broken images
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                  {validPhotos.length > 4 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-lg text-sm">
                      +{validPhotos.length - 4} more
                    </div>
                  )}
                  {validPhotos.length === 0 && (
                    <div className="col-span-2 flex items-center justify-center">
                      <Camera size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Delete Button (Hover) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {onAlbumDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAlbumDelete(album.id);
                      }}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Album Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2 truncate">{album.name}</h3>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Camera size={14} />
                      {validPhotos.length} photo{validPhotos.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {album.views || 0} view{(album.views || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Calendar size={12} />
                  <span>{formatDate(album.createdAt)}</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onAlbumSelect?.(album)}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyShareLink(album.shareLink || '', album.id);
                    }}
                    className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    title="Copy share link"
                  >
                    {copiedId === album.id ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlbumGrid;