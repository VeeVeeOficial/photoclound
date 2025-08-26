// ==============================================
// src/app/page.tsx (หน้าแรก)
// ==============================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AlbumGrid from '@/components/AlbumGrid'; // ใช้ AlbumGrid
import { Album } from '@/types';
import { getAllAlbums } from '@/lib/firestore';

export default function HomePage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      setError(null);
      const albumsData = await getAllAlbums();
      // ป้องกัน undefined และ filter ข้อมูลเสีย
      const validAlbums = (albumsData || []).filter(album => 
        album && typeof album === 'object' && album.name && album.id
      );
      setAlbums(validAlbums);
    } catch (error) {
      console.error('Error loading albums:', error);
      setError('Failed to load albums');
      setAlbums([]); // ตั้งค่า fallback
    } finally {
      setLoading(false);
    }
  };

  const handleAlbumSelect = (album: Album) => {
    router.push(`/album/${album.id}`);
  };

  const handleAlbumDelete = async (albumId: string) => {
    if (!confirm('Are you sure you want to delete this album?')) return;
    
    try {
      // TODO: Implement delete function when firestore deleteAlbum is available
      alert('Delete function not implemented yet');
      
      // For now, just remove from UI (won't persist)
      // setAlbums(prev => prev.filter(album => album.id !== albumId));
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Failed to delete album');
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
        <AlbumGrid 
          albums={albums}
          onAlbumSelect={handleAlbumSelect}
          onAlbumDelete={handleAlbumDelete}
        />
      </div>
    </div>
  );
}