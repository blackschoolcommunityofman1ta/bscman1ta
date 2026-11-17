import { NextResponse as R } from 'next/server';
import { db, getAnon, tooFast, safe, banned } from '@/lib/server';
export const dynamic = 'force-dynamic';

export const GET = safe(async () => {
  const a = await getAnon();
  if (a.banned) return banned();
  const { data, error } = await db.from('posts').select('id,content,created_at,anon_users(username)')
    .eq('is_deleted', false).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return R.json({ posts: data });
});

export const POST = safe(async (req) => {
  const a = await getAnon();
  if (a.banned) return banned();
  const content = ((await req.json()).content || '').trim();
  if (!content || content.length > 500) return R.json({ error: 'Isi harus 1–500 karakter' }, { status: 400 });
  if (await tooFast('posts', a.user.id)) return R.json({ error: 'Terlalu cepat, tunggu sebentar' }, { status: 429 });
  const { error } = await db.from('posts').insert({ user_id: a.user.id, content });
  if (error) throw error;
  return R.json({ ok: true });
});
