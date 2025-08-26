// src/lib/apps-script-storage.ts
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw35O0W7PsgNu_Hh2jHsB87dVvS5tjxWXqUWa6ygOMze6ylLtYOZ80jweCAURvDN6T7/exec';

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