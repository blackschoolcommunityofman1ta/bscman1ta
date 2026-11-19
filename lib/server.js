import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import crypto from 'crypto';

export const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
export const sha = (s) => crypto.createHash('sha256').update(s + process.env.IP_SALT).digest('hex');
export const ipHash = () => sha((headers().get('x-forwarded-for') || 'unknown').split(',')[0].trim());
export const banned = () => NextResponse.json({ error: 'Akses kamu diblokir oleh admin.', banned: true }, { status: 403 });
// Semua error server dikirim sebagai JSON supaya tampil di layar, bukan gagal diam-diam
export const safe = (fn) => async (req) => {
  try { return await fn(req); }
  catch (e) { return NextResponse.json({ error: 'Server: ' + (e.message || 'error') }, { status: 500 }); }
};

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
  if (!isVerified()) return { needVerify: true };
  for (let i = 0; i < 5 && !user; i++) {
    const username = 'anonym_' + String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const { data, error } = await db.from('anon_users').insert({ username, ip_hash: ip }).select().single();
    if (error && error.code !== '23505') throw error;
    user = data;
  }
  if (!user) throw new Error('Gagal membuat akun anonim');
  jar.set('anon_id', user.id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 31536000, path: '/' });
  return { user };
}

const adminToken = () => crypto.createHmac('sha256', process.env.ADMIN_SECRET).update('admin').digest('hex');
export const isAdmin = () => cookies().get('admin')?.value === adminToken();
export const setAdmin = () => cookies().set('admin', adminToken(), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 43200, path: '/' });

export async function tooFast(table, userId) {
  const since = new Date(Date.now() - 60000).toISOString();
  const { count } = await db.from(table).select('id', { count: 'exact', head: true }).eq('user_id', userId).gt('created_at', since);
  return count >= 5;
}

const sign = (s) => crypto.createHmac('sha256', process.env.ADMIN_SECRET).update(s).digest('hex');
export const isVerified = () => cookies().get('ver')?.value === sign('ver');
export const setVerified = () => cookies().set('ver', sign('ver'), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 31536000, path: '/' });
export const cutoff = () => new Date(Date.now() - 7 * 864e5).toISOString();
export const gate = (a) => a.banned ? banned() : a.needVerify ? NextResponse.json({ error: 'Verifikasi dulu', needVerify: true }, { status: 401 }) : null;
