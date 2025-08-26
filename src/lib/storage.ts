// src/lib/apps-script-storage.ts
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbUwa134-yZMcNzxpLetPGyUcibPvw9ZkY_BrQi8u_wWvK-M7sqqkKOhHmY2Ef31Jr/exec';

export const uploadToAppsScript = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        
        const response = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upload_image',
            fileName: file.name,
            mimeType: file.type,
            data: base64,
            folder: 'photo-share'
          })
        });
        
        const result = await response.json();
        resolve(result.fileUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.readAsDataURL(file);
  });
};