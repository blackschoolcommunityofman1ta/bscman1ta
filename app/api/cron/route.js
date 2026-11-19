import { NextResponse as R } from 'next/server';
import { db, cutoff } from '@/lib/server';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return R.json({ error: 'unauthorized' }, { status: 401 });
  const c = cutoff();
  await Promise.all([db.from('posts').delete().lt('created_at', c), db.from('notices').delete().lt('created_at', c), db.from('reports').delete().lt('created_at', c)]);
  return R.json({ ok: true });
}
