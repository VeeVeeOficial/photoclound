// src/lib/imgur.ts
export const uploadToImgur = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      Authorization: 'Client-ID YOUR_IMGUR_CLIENT_ID', // ฟรี
    },
    body: formData,
  });

  const data = await response.json();
  return data.data.link;
};