import { NextResponse as R } from 'next/server';
import { db, getAnon, safe, gate } from '@/lib/server';

export const POST = safe(async (req) => {
  const a = await getAnon();
  { const g = gate(a); if (g) return g; }
  const { post_id, comment_id, reason } = await req.json();
  if (!post_id && !comment_id) return R.json({ error: 'Data tidak valid' }, { status: 400 });
  const { error } = await db.from('reports').insert({ post_id: post_id || null, comment_id: comment_id || null, reason: String(reason || '').slice(0, 100) });
  if (error) throw error;
  return R.json({ ok: true });
});
