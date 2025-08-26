// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw35O0W7PsgNu_Hh2jHsB87dVS5tJxkqUMa6y0MZe6y1LtYOZ80jweCAURvDN6T7/exec';

// ✅ Handle POST
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Proxy failed';
    return NextResponse.json(
      { success: false, error: errorMessage },
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
