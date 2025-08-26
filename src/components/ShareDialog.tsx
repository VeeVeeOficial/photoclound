// ==============================================
// 8. src/components/ShareDialog.tsx
// ==============================================
'use client';

import React, { useState } from 'react';
import { Copy, Check, Share2, X, Facebook, Twitter, MessageCircle } from 'lucide-react';

interface ShareDialogProps {
  shareLink: string;
  albumName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ shareLink, albumName, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToSocial = (platform: 'facebook' | 'twitter' | 'line') => {
    const text = `Check out my photo album: ${albumName}`;
    const url = shareLink;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'line':
        shareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text + ' ' + url)}`;
        break;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Share2 size={20} className="text-blue-500" />
            <h3 className="text-lg font-bold">Share Album</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Album Info */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm mb-2">Sharing:</p>
          <p className="font-medium">{albumName}</p>
        </div>

        {/* Copy Link */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Share to Social Media</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => shareToSocial('facebook')}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Facebook size={16} />
              Facebook
            </button>
            <button
              onClick={() => shareToSocial('twitter')}
              className="flex items-center justify-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
            >
              <Twitter size={16} />
              Twitter
            </button>
            <button
              onClick={() => shareToSocial('line')}
              className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <MessageCircle size={16} />
              LINE
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            ⚠️ Photos will be automatically deleted after 24 hours
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;