// ==============================================
// 10. src/app/album/[id]/page.tsx
// ==============================================
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AlbumViewer from '@/components/AlbumViewer';
import { Album } from '@/types';
import { getAlbum, incrementAlbumViews } from '@/lib/firestore';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AlbumPage() {
  const params = useParams();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadAlbum(params.id as string);
    }
  }, [params.id]);

  const loadAlbum = async (albumId: string) => {
    try {
      const albumData = await getAlbum(albumId);
      
      if (!albumData) {
        setError('Album not found');
        return;
      }

      setAlbum(albumData);
      
      // Increment view count
      await incrementAlbumViews(albumId);
      
    } catch (error) {
      console.error('Error loading album:', error);
      setError('Failed to load album');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading album...</p>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Album not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            This album may have been deleted or the link is invalid.
          </p>
          <Link
            href="/"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <AlbumViewer 
          album={album} 
          onBack={() => window.history.back()} 
        />
      </div>
    </div>
  );
}
