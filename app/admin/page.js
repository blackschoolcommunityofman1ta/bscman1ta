'use client';
import { useEffect, useState } from 'react';

const api = (body) => fetch('/api/admin', body && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());

export default function Admin() {
  const [data, setData] = useState(null), [pw, setPw] = useState('');
  const load = () => api().then((d) => setData(d.error ? null : d));
  useEffect(() => { load(); }, []);
  const login = async () => { const r = await api({ action: 'login', password: pw }); r.error ? alert(r.error) : load(); };
  const del = async (type, id) => { if (confirm('Hapus?')) { await api({ action: 'delete', type, id }); load(); } };
  const ban = async (user_id) => {
    const d = prompt('Blokir berapa hari? (kosongkan = permanen)');
    if (d === null) return;
    await api({ action: 'ban', user_id, days: Number(d) || null, reason: prompt('Alasan?') || '' }); load();
  };
  if (!data) return <main><h1>Admin</h1><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" /><div className="row"><button onClick={login}>Masuk</button></div></main>;
  const item = (type) => (x) => (
    <div className="post" key={x.id}>
      <span className="who">{x.anon_users?.username}</span> <span className="t">{new Date(x.created_at).toLocaleString('id-ID')}</span>
      <p>{x.content}</p>
      <div className="row"><button className="g" onClick={() => del(type, x.id)}>Hapus</button><button onClick={() => ban(x.user_id)}>Blokir pengguna + IP</button></div>
    </div>
  );
  return <main><h1>Panel Admin</h1><h2>Postingan</h2>{data.posts.map(item('post'))}<h2>Komentar</h2>{data.comments.map(item('comment'))}</main>;
}
