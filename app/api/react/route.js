import { NextResponse as R } from 'next/server';
import { db, getAnon, safe, gate } from '@/lib/server';

export const POST = safe(async (req) => {
  const a = await getAnon();
  { const g = gate(a); if (g) return g; }
  const { post_id, kind } = await req.json();
  const t = kind === 'save' ? 'saves' : 'likes';
  const { data } = await db.from(t).select('post_id').eq('post_id', post_id).eq('user_id', a.user.id).maybeSingle();
  const { error } = data ? await db.from(t).delete().eq('post_id', post_id).eq('user_id', a.user.id) : await db.from(t).insert({ post_id, user_id: a.user.id });
  if (error) throw error;
  return R.json({ on: !data });
});
