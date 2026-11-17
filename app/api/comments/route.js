import { NextResponse as R } from 'next/server';
import { db, getAnon, tooFast } from '@/lib/server';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const a = await getAnon();
  if (a.banned) return R.json({ error: 'Akses diblokir' }, { status: 403 });
  const post_id = new URL(req.url).searchParams.get('post_id');
  const { data } = await db.from('comments').select('id,parent_id,content,created_at,anon_users(username)')
    .eq('post_id', post_id).eq('is_deleted', false).order('created_at');
  return R.json({ comments: data || [] });
}

export async function POST(req) {
  const a = await getAnon();
  if (a.banned) return R.json({ error: 'Akses diblokir' }, { status: 403 });
  const { post_id, parent_id, content: c } = await req.json();
  const content = (c || '').trim();
  if (!content || content.length > 300) return R.json({ error: 'Isi 1–300 karakter' }, { status: 400 });
  if (await tooFast('comments', a.user.id)) return R.json({ error: 'Terlalu cepat, tunggu sebentar' }, { status: 429 });
  await db.from('comments').insert({ post_id, parent_id: parent_id || null, user_id: a.user.id, content });
  return R.json({ ok: true });
}
