'use client';

import { useState, useEffect } from 'react';
import PhotoUploader from '@/components/PhotoUploader';
import AlbumGrid from '@/components/AlbumGrid';
import AlbumViewer from '@/components/AlbumViewer';
import { Album } from '@/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAllAlbums } from '@/lib/firestore';
import { Eye, Upload, Camera } from 'lucide-react';

export default function HomePage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      // For now, we'll use mock data since we haven't set up Firebase yet
      const mockAlbums: Album[] = [
        {
          id: '1',
          name: 'Sample Album',
          photos: [],
          shareLink: 'https://example.com/album/1',
          createdAt: new Date(),
          views: 0
        }
      ];
      setAlbums(mockAlbums);
    } catch (error) {
      console.error('Error loading albums:', error);
      setError('Failed to load albums');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAlbum = (album: Album) => {
    setAlbums(prev => [album, ...prev]);
    setActiveTab('gallery');
  };

  const handleAlbumSelect = (album: Album) => {
    setCurrentAlbum(album);
  };

  const handleAlbumDelete = async (albumId: string) => {
    if (confirm('Are you sure you want to delete this album?')) {
      setAlbums(prev => prev.filter(album => album.id !== albumId));
    }
  };

  if (currentAlbum) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <AlbumViewer album={currentAlbum} onBack={() => setCurrentAlbum(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📸 PhotoShare</h1>
          <p className="text-gray-600">แชร์ภาพสวยๆ ง่ายๆ เพียงลิงค์เดียว</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-lg">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-6 py-2 rounded-xl transition-all duration-200 ${
                activeTab === 'gallery'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Eye className="inline mr-2" size={16} />
              Gallery
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2 rounded-xl transition-all duration-200 ${
                activeTab === 'upload'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Upload className="inline mr-2" size={16} />
              Upload
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Content */}
        {activeTab === 'gallery' && (
          <>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading albums...</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Your Albums</h2>
                  <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">
                    {albums.length} album{albums.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {albums.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera size={64} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-600 mb-2">No albums yet</h3>
                    <p className="text-gray-500">Upload some photos to create your first album!</p>
                  </div>
                ) : (
                  <AlbumGrid 
                    albums={albums} 
                    onAlbumSelect={handleAlbumSelect}
                    onAlbumDelete={handleAlbumDelete}
                  />
                )}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'upload' && (
          <div>
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
              <p className="font-medium">Demo Mode</p>
              <p className="text-sm">Firebase Storage is not configured yet. This is a preview of the interface.</p>
            </div>
            <PhotoUploader onAlbumCreated={handleNewAlbum} />
          </div>
        )}
      </div>
    </div>
  );
}