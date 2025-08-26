'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PhotoUploader from '@/components/PhotoUploader';
import AlbumGrid from '@/components/AlbumGrid';
import { Album } from '@/types';
import { getAllAlbums } from '@/lib/firestore';
import { Upload, Images, Camera, Share2, Clock } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);

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

  const handleAlbumCreated = (newAlbum: Album) => {
    setAlbums(prev => [newAlbum, ...prev]);
    setShowUploader(false);
    
    // Show success message
    setTimeout(() => {
      alert(`Album "${newAlbum.name}" created successfully with ${newAlbum.photos.length} photos!`);
    }, 500);
  };

  const handleAlbumSelect = (album: Album) => {
    router.push(`/album/${album.id}`);
  };

  const handleAlbumDelete = async () => {
    alert('Delete function not implemented yet');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your albums...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md mx-4">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <button 
            onClick={loadAlbums}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PhotoShare
                </h1>
                <p className="text-gray-500 text-sm">Share memories instantly</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowUploader(!showUploader)}
                className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg ${
                  showUploader 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {showUploader ? 'Cancel' : (
                  <>
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Photos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Upload Section */}
        {showUploader && (
          <div className="mb-8 animate-in slide-in-from-top duration-300">
            <PhotoUploader onAlbumCreated={handleAlbumCreated} />
          </div>
        )}

        {/* Welcome Section */}
        {!showUploader && albums.length === 0 && (
          <div className="text-center py-16 animate-in fade-in-50 duration-500">
            <div className="bg-white rounded-3xl p-12 shadow-xl max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Images className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to PhotoShare</h2>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Upload and share your photos easily. Create albums that auto-delete after 24 hours for privacy.
              </p>
              <button
                onClick={() => setShowUploader(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                <Upload className="w-5 h-5 inline mr-2" />
                Create Your First Album
              </button>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="text-center p-4">
                  <div className="bg-blue-100 w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Batch Upload</h3>
                  <p className="text-gray-600 text-sm">Upload hundreds of photos at once with smart batching</p>
                </div>
                <div className="text-center p-4">
                  <div className="bg-green-100 w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Easy Sharing</h3>
                  <p className="text-gray-600 text-sm">Share albums instantly with a simple link</p>
                </div>
                <div className="text-center p-4">
                  <div className="bg-purple-100 w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Auto Delete</h3>
                  <p className="text-gray-600 text-sm">Photos automatically delete after 24 hours for privacy</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Albums Section */}
        {!showUploader && albums.length > 0 && (
          <div className="animate-in fade-in-50 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Albums</h2>
                <p className="text-gray-600">
                  {albums.length} album{albums.length !== 1 ? 's' : ''} • 
                  {albums.reduce((total, album) => total + album.photos.length, 0)} photos total
                </p>
              </div>
              <button
                onClick={() => setShowUploader(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                New Album
              </button>
            </div>
            
            <AlbumGrid 
              albums={albums}
              onAlbumSelect={handleAlbumSelect}
              onAlbumDelete={handleAlbumDelete}
            />
          </div>
        )}

        {/* Loading state for albums */}
        {!showUploader && loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your albums...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p className="mb-2">Built with ❤️ for easy photo sharing</p>
            <p className="text-sm">Photos are stored securely and deleted automatically after 24 hours</p>
          </div>
        </div>
      </footer>
    </div>
  );
}