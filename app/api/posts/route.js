import { NextResponse as R } from 'next/server';
import { db, getAnon, tooFast, safe, gate, cutoff } from '@/lib/server';
export const dynamic = 'force-dynamic';

export const GET = safe(async (req) => {
  const a = await getAnon();
  { const g = gate(a); if (g) return g; }
  const sp = new URL(req.url).searchParams, id = sp.get('id');
  let ids = null;
  if (sp.get('saved')) ids = ((await db.from('saves').select('post_id').eq('user_id', a.user.id)).data || []).map((x) => x.post_id);
  let q = db.from('posts').select('id,content,created_at,anon_users(username),likes(count)')
    .eq('is_deleted', false).gt('created_at', cutoff()).order('created_at', { ascending: false }).limit(50);
  if (id) q = q.eq('id', id);
  if (ids) q = q.in('id', ids);
  const term = (sp.get('q') || '').trim().slice(0, 50).replace(/[%,()*"\\]/g, ' ');
  if (term) {
    const uids = ((await db.from('anon_users').select('id').ilike('username', `%${term}%`).limit(200)).data || []).map((u) => u.id);
    q = q.or(`content.ilike.%${term}%${uids.length ? `,user_id.in.(${uids.join(',')})` : ''}`);
  }
  const { data: posts, error } = await q;
  if (error) throw error;
  const pid = posts.map((p) => p.id);
  const mine = async (t) => new Set(((await db.from(t).select('post_id').eq('user_id', a.user.id).in('post_id', pid)).data || []).map((x) => x.post_id));
  const [L, S] = await Promise.all([mine('likes'), mine('saves')]);
  return R.json({ posts: posts.map((p) => ({ ...p, likes: p.likes?.[0]?.count || 0, liked: L.has(p.id), saved: S.has(p.id) })) });
});

export const POST = safe(async (req) => {
  const a = await getAnon();
  { const g = gate(a); if (g) return g; }
  const content = ((await req.json()).content || '').trim();
  if (!content || content.length > 500) return R.json({ error: 'Isi harus 1–500 karakter' }, { status: 400 });
  if (await tooFast('posts', a.user.id)) return R.json({ error: 'Terlalu cepat, tunggu sebentar' }, { status: 429 });
  const { error } = await db.from('posts').insert({ user_id: a.user.id, content });
  if (error) throw error;
  return R.json({ ok: true });
});
