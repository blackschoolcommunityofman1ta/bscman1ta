import { NextResponse as R } from 'next/server';
import { safe, setVerified } from '@/lib/server';

export const POST = safe(async (req) => {
  const { nis, token } = await req.json();
  if (!/^[01239]\d0\d{3}$/.test(String(nis || ''))) return R.json({ error: 'NIS tidak valid' }, { status: 400 });
  if (process.env.TURNSTILE_SECRET) {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token || '' }) });
    if (!(await r.json()).success) return R.json({ error: 'Verifikasi robot gagal, coba lagi' }, { status: 400 });
  }
  setVerified(); // NIS hanya dicek formatnya, tidak disimpan
  return R.json({ ok: true });
});
