// src/pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// ใช้ Apps Script URL ของคุณ
const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw35O0W7PsgNu_Hh2jHsB87dVvS5tjxWXqUWa6ygOMze6ylLtYOZ80jweCAURvDN6T7/exec';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    // ✅ Preflight สำหรับ CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const payload = req.body;

    // ส่ง request ไป Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ success: false, error: 'Proxy request failed' });
  }
}
