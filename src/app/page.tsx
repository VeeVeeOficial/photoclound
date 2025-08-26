// ==============================================
// src/app/page.tsx - with Upload Feature
// ==============================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AlbumGrid from '@/components/AlbumGrid';
import { Album } from '@/types';
import { getAllAlbums } from '@/lib/firestore';
import { Upload, Plus } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      setError(null);
      const albumsData = await getAllAlbums();
      const validAlbums = (albumsData || []).filter(album => 
        album && typeof album === 'object' && album.name && album.id
      );
      setAlbums(validAlbums);
    } catch (error) {
      console.error('Error loading albums:', error);
      setError('Failed to load albums');
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAlbumSelect = (album: Album) => {
    router.push(`/album/${album.id}`);
  };

  const handleAlbumDelete = async () => {
    alert('Delete function not implemented yet');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // TODO: Implement actual upload logic
      alert(`Selected ${files.length} files. Upload functionality needs to be implemented.`);
      
      // Reset input
      e.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading albums...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <button 
            onClick={loadAlbums}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header with Upload */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">PhotoShare</h1>
              <p className="text-gray-600">Share your photos easily and securely</p>
            </div>
            
            {/* Upload Button */}
            <div className="flex items-center gap-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="photo-upload"
                disabled={uploading}
              />
              <label htmlFor="photo-upload">
                <div className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer flex items-center gap-2 shadow-lg">
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Upload Photos
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Upload Zone */}
          {albums.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <div className="text-center">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-400 transition-colors">
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">Get Started</h3>
                  <p className="text-gray-500 mb-4">Upload your first photos to create an album</p>
                  <label htmlFor="photo-upload">
                    <div className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
                      <Plus size={16} />
                      Choose Photos
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Albums Grid */}
        <AlbumGrid 
          albums={albums}
          onAlbumSelect={handleAlbumSelect}
          onAlbumDelete={handleAlbumDelete}
        />
      </div>
    </div>
  );
}