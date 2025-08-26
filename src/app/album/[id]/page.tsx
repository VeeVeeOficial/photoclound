// ==============================================
// 10. src/app/album/[id]/page.tsx
// ==============================================
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AlbumViewer from '@/components/AlbumViewer';
import { Album } from '@/types';
import { getAlbum, incrementAlbumViews } from '@/lib/firestore';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';


interface AlbumViewerProps {
  album: Album;
  onBack: () => void;
}

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id && typeof params.id === 'string') {
      loadAlbum(params.id);
    } else {
      setError('Invalid album ID');
      setLoading(false);
    }
  }, [params.id]);

  const loadAlbum = async (albumId: string) => {
    try {
      setError(null);
      const albumData = await getAlbum(albumId);
      
      if (!albumData) {
        setError('Album not found');
        return;
      }

      setAlbum(albumData);
      
      // Increment view count
      incrementAlbumViews(albumId).catch(err => 
        console.warn('Failed to increment views:', err)
      );
      
    } catch (error) {
      console.error('Error loading album:', error);
      if (error instanceof Error) {
        setError(`Failed to load album: ${error.message}`);
      } else {
        setError('Failed to load album');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
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
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Album not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error === 'Album not found' 
              ? 'This album may have been deleted or the link is invalid.'
              : 'Please try again or contact support if the problem persists.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleBack}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
            <Link
              href="/"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <AlbumViewer 
          album={album as Album} 
          onBack={handleBack}
        />
      </div>
    </div>
  );
}