import { NextResponse as R } from 'next/server';
import { db, getAnon, tooFast } from '@/lib/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  const a = await getAnon();
  if (a.banned) return R.json({ error: 'Akses diblokir' }, { status: 403 });
  const { data } = await db.from('posts').select('id,content,created_at,anon_users(username)')
    .eq('is_deleted', false).order('created_at', { ascending: false }).limit(50);
  return R.json({ posts: data || [] });
}

export async function POST(req) {
  const a = await getAnon();
  if (a.banned) return R.json({ error: 'Akses diblokir' }, { status: 403 });
  const content = ((await req.json()).content || '').trim();
  if (!content || content.length > 500) return R.json({ error: 'Isi 1–500 karakter' }, { status: 400 });
  if (await tooFast('posts', a.user.id)) return R.json({ error: 'Terlalu cepat, tunggu sebentar' }, { status: 429 });
  await db.from('posts').insert({ user_id: a.user.id, content });
  return R.json({ ok: true });
}
