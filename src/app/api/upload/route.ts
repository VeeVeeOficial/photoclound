// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw35O0W7PsgNu_Hh2jHsB87dVS5tJxkqUMa6y0MZe6y1LtYOZ80jweCAURvDN6T7/exec';

// ✅ Handle POST
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("📩 Payload received:", payload);

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log("📡 Google Script status:", res.status);

    const text = await res.text(); // อ่านเป็น text ก่อน (บางทีไม่ใช่ JSON)
    console.log("📦 Google Script raw response:", text);

    let data: any;
    try {
      data = JSON.parse(text); // ถ้า parse JSON ได้
    } catch {
      data = { raw: text }; // ถ้าไม่ใช่ JSON
    }

    return NextResponse.json(data, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err: any) {
    console.error("❌ Proxy error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Proxy failed" },
      { status: 500 }
    );
  }
}

// ✅ Handle OPTIONS (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
