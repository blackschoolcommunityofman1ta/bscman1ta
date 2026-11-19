'use client';
import { useEffect, useState } from 'react';

const api = async (b) => {
  try {
    const r = await fetch('/api/admin', b && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
    return await r.json();
  } catch { return { error: 'Gagal terhubung ke server' }; }
};

export default function Admin() {
  const [d, setD] = useState(null), [pw, setPw] = useState(''), [tab, setTab] = useState('reports');
  const load = () => api().then((x) => setD(x.error ? false : x));
  useEffect(() => { load(); }, []);
  useEffect(() => { const f = () => setTab('notices'); addEventListener('admin-notice', f); return () => removeEventListener('admin-notice', f); }, []);
  const login = async () => { const r = await api({ action: 'login', password: pw }); r.error ? alert(r.error) : load(); };
  const act = async (b) => { await api(b); load(); };
  const ban = (uid) => {
    const n = prompt('Blokir berapa hari? (kosongkan = permanen)');
    if (n !== null) act({ action: 'ban', user_id: uid, days: Number(n) || null, reason: prompt('Alasan?') || '' });
  };
  if (d === null) return <div className="sp" />;
  if (!d) return (
    <div className="pg"><h1>Masuk Admin</h1>
      <div className="row"><input className="in" type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} placeholder="Password" />
      <button className="pill" onClick={login}>Masuk</button></div></div>
  );
  const tabs = [['reports', 'Laporan'], ['posts', 'Postingan'], ['comments', 'Komentar'], ['notices', 'Notice']];
  return (
    <>
      <div className="tabs">{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l} ({d[k].length})</button>)}</div>
      {tab === 'notices' && <Notices d={d} act={act} />}
      {tab !== 'notices' && d[tab].length === 0 && <div className="empty">Tidak ada data.</div>}
      {(tab === 'notices' ? [] : d[tab]).map((x) => {
        const type = x.type || tab.slice(0, -1);
        return (
          <div className="post" key={type + x.id}>
            <div className="pb">
              <div className="ph"><b>{x.anon_users?.username}</b><span className="mut">· {new Date(x.created_at).toLocaleString('id-ID')} · {type}</span></div>
              <p>{x.content}</p>
              {x.reasons && <p className="mut">Dilaporkan {x.reasons.length}×: {[...new Set(x.reasons)].join(', ')}</p>}
              <div className="row">
                <button className="bt d" onClick={() => confirm('Hapus?') && act({ action: 'delete', type, id: x.id })}>Hapus</button>
                <button className="bt d" onClick={() => ban(x.user_id)}>Blokir + IP</button>
                {x.reasons && <button className="bt" onClick={() => act({ action: 'dismiss', type, id: x.id })}>Abaikan</button>}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function Notices({ d, act }) {
  const [t, setT] = useState('');
  return (
    <div className="pg">
      <textarea style={{ border: '1px solid #2f3336', borderRadius: 8, padding: 8 }} maxLength={1000} value={t} onChange={(e) => setT(e.target.value)} placeholder="Tulis pemberitahuan untuk semua pengguna…" />
      <div className="row"><button className="pill" disabled={!t.trim()} onClick={() => { act({ action: 'notice', content: t }); setT(''); }}>Kirim notice</button></div>
      {d.notices.map((x) => <div className="opt" style={{ cursor: 'default' }} key={x.id}><div>{x.content}</div><button className="bt d" style={{ marginTop: 6 }} onClick={() => confirm('Hapus?') && act({ action: 'delnotice', id: x.id })}>Hapus</button></div>)}
    </div>
  );
}
