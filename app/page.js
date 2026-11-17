'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const api = async (u, body) => {
  try {
    const r = await fetch(u, body && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return await r.json();
  } catch { return { error: 'Gagal terhubung ke server' }; }
};
const ago = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' mnt';
  if (s < 86400) return Math.floor(s / 3600) + ' j';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};
const REASONS = ['Cyberbullying', 'Pornografi', 'SARA / ujaran kebencian', 'Data pribadi orang lain', 'Spam / iklan', 'Lainnya'];
const P = { plus: 'M12 5v14M5 12h14', x: 'M6 6l12 12M18 6L6 18', chat: 'M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.6A8 8 0 1 1 21 12z', flag: 'M5 21V4m0 0h11l-2 4 2 4H5' };
const Ic = ({ n, s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg>;
const Avatar = ({ name = 'anonym_200', s }) => <div className={'av' + (s ? ' s' : '')} style={{ background: `hsl(${parseInt(name.slice(-3), 10) % 360} 45% 36%)` }}>A</div>;

function Modal({ onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose?.();
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, []);
  return <div className="bd" onClick={onClose}><div className="md" onClick={(e) => e.stopPropagation()}>{children}</div></div>;
}

function Compose({ onClose, onDone, toast }) {
  const [t, setT] = useState(''), [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    const r = await api('/api/posts', { content: t });
    setBusy(false);
    if (r.error) return toast(r.error);
    toast('Postingan terkirim'); onDone();
  };
  const c = 56.55, n = t.length;
  return (
    <Modal onClose={onClose}>
      <button className="ib" onClick={onClose} aria-label="Tutup"><Ic n="x" /></button>
      <div className="cp"><Avatar /><textarea autoFocus maxLength={500} value={t} onChange={(e) => setT(e.target.value)} placeholder="Apa yang terjadi?" /></div>
      <div className="mf">
        <svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#2f3336" strokeWidth="2.5" /><circle cx="12" cy="12" r="9" fill="none" stroke={n > 450 ? '#f4212e' : '#e0b64a'} strokeWidth="2.5" strokeDasharray={`${(n / 500) * c} ${c}`} transform="rotate(-90 12 12)" /></svg>
        <button className="pill" disabled={!t.trim() || busy} onClick={send}>Posting</button>
      </div>
    </Modal>
  );
}

function Report({ target, onClose, toast }) {
  const [r, setR] = useState('');
  const send = async () => { const res = await api('/api/report', { ...target, reason: r }); toast(res.error || 'Laporan terkirim. Terima kasih!'); onClose(); };
  return (
    <Modal onClose={onClose}>
      <h3>Laporkan konten</h3><p className="mut">Aturan mana yang dilanggar?</p>
      {REASONS.map((x) => <button key={x} className={'opt' + (r === x ? ' on' : '')} onClick={() => setR(x)}>{x}</button>)}
      <div className="mf"><button className="pill" disabled={!r} onClick={send}>Kirim laporan</button></div>
    </Modal>
  );
}

function Comments({ postId, toast, onReport }) {
  const [list, setList] = useState([]), [t, setT] = useState(''), [re, setRe] = useState(null);
  const load = () => api('/api/comments?post_id=' + postId).then((d) => setList(d.comments || []));
  useEffect(() => { load(); }, []);
  const send = async () => {
    const r = await api('/api/comments', { post_id: postId, parent_id: re?.id, content: t });
    if (r.error) return toast(r.error);
    setT(''); setRe(null); load();
  };
  const item = (c) => (
    <div key={c.id}>
      <div className="ci">
        <Avatar s name={c.anon_users?.username} />
        <div className="pb">
          <div className="ph"><b>{c.anon_users?.username}</b><span className="mut">· {ago(c.created_at)}</span></div>
          <div className="cx">{c.content}</div>
          <div className="ac">
            <button className="ab" onClick={() => setRe(c)}>Balas</button>
            <button className="ab r" aria-label="Laporkan" onClick={() => onReport({ comment_id: c.id })}><Ic n="flag" s={15} /></button>
          </div>
        </div>
      </div>
      <div className="cm">{list.filter((x) => x.parent_id === c.id).map(item)}</div>
    </div>
  );
  return (
    <div style={{ marginTop: 8 }}>
      {list.filter((c) => !c.parent_id).map(item)}
      <div className="row">
        <input className="in" value={t} maxLength={300} onChange={(e) => setT(e.target.value)} placeholder={re ? `Membalas ${re.anon_users?.username}…` : 'Tulis komentar…'} />
        <button className="pill" disabled={!t.trim()} onClick={send}>Kirim</button>
        {re && <button className="bt" onClick={() => setRe(null)}>Batal</button>}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState(null), [err, setErr] = useState(''), [open, setOpen] = useState(null);
  const [compose, setCompose] = useState(false), [rep, setRep] = useState(null), [msg, setMsg] = useState(''), [welcome, setWelcome] = useState(false);
  const toast = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2800); };
  const load = () => api('/api/posts').then((d) => {
    if (d.banned) setErr(d.error);
    else if (d.error) { toast(d.error); setPosts([]); }
    else setPosts(d.posts);
  });
  useEffect(() => {
    load();
    try { if (!localStorage.getItem('welcomed')) setWelcome(true); } catch {}
  }, []);
  const next = () => { try { localStorage.setItem('welcomed', '1'); } catch {} router.push('/rules'); };

  return (
    <>
      {posts === null && !err && <div className="sp" />}
      {err && <div className="empty"><h2>{err}</h2></div>}
      {posts?.length === 0 && <div className="empty">Belum ada postingan. Tekan + untuk jadi yang pertama.</div>}
      {posts?.map((p) => (
        <article className="post" key={p.id}>
          <Avatar name={p.anon_users?.username} />
          <div className="pb">
            <div className="ph"><b>{p.anon_users?.username}</b><span className="mut">· {ago(p.created_at)}</span></div>
            <p>{p.content}</p>
            <div className="ac">
              <button className="ab" onClick={() => setOpen(open === p.id ? null : p.id)}><Ic n="chat" s={18} /> Komentar</button>
              <button className="ab r" onClick={() => setRep({ post_id: p.id })}><Ic n="flag" s={18} /> Laporkan</button>
            </div>
            {open === p.id && <Comments postId={p.id} toast={toast} onReport={setRep} />}
          </div>
        </article>
      ))}
      {!err && <button className="fab" aria-label="Buat postingan" onClick={() => setCompose(true)}><Ic n="plus" s={28} /></button>}
      {compose && <Compose onClose={() => setCompose(false)} onDone={() => { setCompose(false); load(); }} toast={toast} />}
      {rep && <Report target={rep} onClose={() => setRep(null)} toast={toast} />}
      {welcome && (
        <Modal>
          <div className="wl">
            <img src="/logo.svg" alt="" width="64" height="64" />
            <h2>Selamat datang di Black School Community</h2>
            <p className="mut">Ruang anonim untuk siswa. Sebelum mulai, baca dulu aturan komunitasnya ya.</p>
            <button className="pill" onClick={next}>Lanjutkan</button>
          </div>
        </Modal>
      )}
      {msg && <div className="toast">{msg}</div>}
    </>
  );
}
