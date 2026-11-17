import { NextResponse as R } from 'next/server';
import { db, isAdmin, setAdmin } from '@/lib/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isAdmin()) return R.json({ error: 'unauthorized' }, { status: 401 });
  const sel = 'id,content,created_at,user_id,anon_users(username)';
  const [p, c] = await Promise.all([
    db.from('posts').select(sel).eq('is_deleted', false).order('created_at', { ascending: false }).limit(100),
    db.from('comments').select(sel).eq('is_deleted', false).order('created_at', { ascending: false }).limit(100)]);
  return R.json({ posts: p.data || [], comments: c.data || [] });
}

export async function POST(req) {
  const b = await req.json();
  if (b.action === 'login') {
    if (b.password !== process.env.ADMIN_PASSWORD) return R.json({ error: 'Password salah' }, { status: 401 });
    setAdmin(); return R.json({ ok: true });
  }
  if (!isAdmin()) return R.json({ error: 'unauthorized' }, { status: 401 });
  if (b.action === 'delete') {
    await db.from(b.type === 'post' ? 'posts' : 'comments').update({ is_deleted: true }).eq('id', b.id);
  }
  if (b.action === 'ban') {
    const { data: u } = await db.from('anon_users').select('ip_hash').eq('id', b.user_id).single();
    const expires_at = b.days ? new Date(Date.now() + b.days * 864e5).toISOString() : null;
    await db.from('bans').insert({ user_id: b.user_id, ip_hash: u.ip_hash, reason: b.reason || '', expires_at });
  }
  return R.json({ ok: true });
}
