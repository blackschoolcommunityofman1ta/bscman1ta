import { NextResponse as R } from 'next/server';
import { db, isAdmin, setAdmin, safe, cutoff } from '@/lib/server';
export const dynamic = 'force-dynamic';
const sel = 'id,content,created_at,user_id,anon_users(username)';

export const GET = safe(async () => {
  if (!isAdmin()) return R.json({ error: 'unauthorized' }, { status: 401 });
  const [p, c, rp] = await Promise.all([
    db.from('posts').select(sel).eq('is_deleted', false).order('created_at', { ascending: false }).limit(100),
    db.from('comments').select(sel).eq('is_deleted', false).order('created_at', { ascending: false }).limit(100),
    db.from('reports').select('post_id,comment_id,reason').order('created_at', { ascending: false }).limit(300)]);
  const ids = (k) => [...new Set((rp.data || []).map((r) => r[k]).filter(Boolean))];
  const [rpp, rcc] = await Promise.all([
    db.from('posts').select(sel).eq('is_deleted', false).in('id', ids('post_id')),
    db.from('comments').select(sel).eq('is_deleted', false).in('id', ids('comment_id'))]);
  const g = {};
  (rp.data || []).forEach((r) => {
    const type = r.post_id ? 'post' : 'comment', id = r.post_id || r.comment_id;
    const x = (type === 'post' ? rpp : rcc).data?.find((y) => y.id === id);
    if (x) (g[type + id] ??= { ...x, type, reasons: [] }).reasons.push(r.reason);
  });
  const reports = Object.values(g).sort((a, b) => b.reasons.length - a.reasons.length);
  const { data: notices } = await db.from('notices').select('*').gt('created_at', cutoff()).order('created_at', { ascending: false });
  return R.json({ reports, posts: p.data || [], comments: c.data || [], notices: notices || [] });
});

export const POST = safe(async (req) => {
  const b = await req.json();
  if (b.action === 'login') {
    if (b.password !== process.env.ADMIN_PASSWORD) return R.json({ error: 'Password salah' }, { status: 401 });
    setAdmin(); return R.json({ ok: true });
  }
  if (!isAdmin()) return R.json({ error: 'unauthorized' }, { status: 401 });
  const col = b.type === 'post' ? 'post_id' : 'comment_id';
  if (b.action === 'delete') await db.from(b.type === 'post' ? 'posts' : 'comments').update({ is_deleted: true }).eq('id', b.id);
  if (b.action === 'notice') await db.from('notices').insert({ content: String(b.content).slice(0, 1000) });
  if (b.action === 'delnotice') await db.from('notices').delete().eq('id', b.id);
  if (b.action === 'dismiss') await db.from('reports').delete().eq(col, b.id);
  if (b.action === 'ban') {
    const { data: u } = await db.from('anon_users').select('ip_hash').eq('id', b.user_id).single();
    const expires_at = b.days ? new Date(Date.now() + b.days * 864e5).toISOString() : null;
    await db.from('bans').insert({ user_id: b.user_id, ip_hash: u.ip_hash, reason: b.reason || '', expires_at });
  }
  return R.json({ ok: true });
});
