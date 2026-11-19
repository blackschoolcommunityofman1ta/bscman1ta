import { NextResponse as R } from 'next/server';
import { db, isVerified, safe, cutoff } from '@/lib/server';
export const dynamic = 'force-dynamic';

export const GET = safe(async () => {
  if (!isVerified()) return R.json({ error: 'Verifikasi dulu', needVerify: true }, { status: 401 });
  const { data, error } = await db.from('notices').select('id,content,created_at').gt('created_at', cutoff()).order('created_at', { ascending: false });
  if (error) throw error;
  return R.json({ notices: data });
});
