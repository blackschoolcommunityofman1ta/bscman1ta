import { NextResponse as R } from 'next/server';
import { db, getAnon, tooFast, safe, gate } from '@/lib/server';
export const dynamic = 'force-dynamic';

export const GET = safe(async (req) => {
  const a = await getAnon();
  { const g = gate(a); if (g) return g; }
  const post_id = new URL(req.url).searchParams.get('post_id');
  const { data, error } = await db.from('comments').select('id,parent_id,content,created_at,anon_users(username)')
    .eq('post_id', post_id).eq('is_deleted', false).order('created_at');
  if (error) throw error;
  return R.json({ comments: data });
});

export const POST = safe(async (req) => {
  const a = await getAnon();
  { const g = gate(a); if (g) return g; }
  const { post_id, parent_id, content: c } = await req.json();
  const content = (c || '').trim();
  if (!content || content.length > 300) return R.json({ error: 'Isi harus 1–300 karakter' }, { status: 400 });
  if (await tooFast('comments', a.user.id)) return R.json({ error: 'Terlalu cepat, tunggu sebentar' }, { status: 429 });
  const { error } = await db.from('comments').insert({ post_id, parent_id: parent_id || null, user_id: a.user.id, content });
  if (error) throw error;
  return R.json({ ok: true });
});
