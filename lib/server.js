import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import crypto from 'crypto';

export const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
export const sha = (s) => crypto.createHash('sha256').update(s + process.env.IP_SALT).digest('hex');
export const ipHash = () => sha((headers().get('x-forwarded-for') || 'unknown').split(',')[0].trim());

// Ambil/buat akun anonim + cek blokir (cookie ATAU ip). Dipanggil di setiap API.
export async function getAnon() {
  const ip = ipHash();
  const jar = cookies();
  const id = jar.get('anon_id')?.value;
  let user = null;
  if (id) user = (await db.from('anon_users').select('*').eq('id', id).maybeSingle()).data;
  const cond = user ? `ip_hash.eq.${ip},user_id.eq.${user.id}` : `ip_hash.eq.${ip}`;
  const { data: ban } = await db.from('bans').select('id').or(cond)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).limit(1);
  if (ban?.length) return { banned: true };
  for (let i = 0; i < 5 && !user; i++) {
    const username = 'anonym_' + String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    user = (await db.from('anon_users').insert({ username, ip_hash: ip }).select().single()).data;
  }
  jar.set('anon_id', user.id, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 31536000, path: '/' });
  return { user };
}

const adminToken = () => crypto.createHmac('sha256', process.env.ADMIN_SECRET).update('admin').digest('hex');
export const isAdmin = () => cookies().get('admin')?.value === adminToken();
export const setAdmin = () => cookies().set('admin', adminToken(), { httpOnly: true, sameSite: 'strict', secure: true, maxAge: 43200, path: '/' });

// Batasi spam: maks 5 postingan/komentar per menit per pengguna
export async function tooFast(table, userId) {
  const since = new Date(Date.now() - 60000).toISOString();
  const { count } = await db.from(table).select('id', { count: 'exact', head: true }).eq('user_id', userId).gt('created_at', since);
  return count >= 5;
}
