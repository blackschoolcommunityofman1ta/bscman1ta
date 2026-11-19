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
const P = { plus: 'M12 5v14M5 12h14', x: 'M6 6l12 12M18 6L6 18', chat: 'M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.6A8 8 0 1 1 21 12z', flag: 'M5 21V4m0 0h11l-2 4 2 4H5', heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z', mark: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z', share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13', search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3' };
const LOGO = '/ikon.png';
const URL_RE = /((?:https?:\/\/|www\.)[^\s]+)/g;
const Text = ({ t }) => t.split(URL_RE).map((x, i) => {
  if (i % 2 === 0) return x;
  const m = x.match(/[.,!?;:)\]]+$/)?.[0] || '', u = m ? x.slice(0, -m.length) : x;
  return <span key={i}><a className="ln" href={/^www\./.test(u) ? 'https://' + u : u} target="_blank" rel="noopener noreferrer nofollow">{u}</a>{m}</span>;
});
const NIS = /^[01239]\d0\d{3}$/;
const Ic = ({ n, s = 20, f }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={f ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg>;
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
          <div className="cx"><Text t={c.content} /></div>
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

function Verify({ onDone }) {
  const [nis, setNis] = useState(''), [tok, setTok] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  useEffect(() => {
    if (!key) return;
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true;
    s.onload = () => window.turnstile.render('#ts', { sitekey: key, theme: 'dark', callback: setTok });
    document.head.appendChild(s);
  }, []);
  const go = async () => { setBusy(true); const r = await api('/api/verify', { nis, token: tok }); setBusy(false); r.error ? setErr(r.error) : onDone(); };
  return (
    <Modal>
      <div className="wl">
        <img src={LOGO} alt="" width="64" height="64" />
        <h2>Verifikasi dulu</h2>
        <p className="mut">Masukkan NIS (6 digit) dan selesaikan verifikasi robot. NIS tidak disimpan.</p>
        <input className="in" style={{ width: '100%' }} inputMode="numeric" maxLength={6} value={nis} onChange={(e) => setNis(e.target.value.replace(/\D/g, ''))} placeholder="NIS" />
        <div id="ts" style={{ margin: '12px 0', minHeight: key ? 65 : 0 }} />
        {nis.length === 6 && !NIS.test(nis) && <p style={{ color: '#f4212e' }}>Format NIS tidak valid</p>}
        {err && <p style={{ color: '#f4212e' }}>{err}</p>}
        <button className="pill" disabled={!NIS.test(nis) || (key && !tok) || busy} onClick={go}>Verifikasi</button>
      </div>
    </Modal>
  );
}

export default function Feed({ saved, postId }) {
  const router = useRouter();
  const [posts, setPosts] = useState(null), [err, setErr] = useState(''), [open, setOpen] = useState(null);
  const [compose, setCompose] = useState(false), [rep, setRep] = useState(null), [msg, setMsg] = useState('');
  const [ready, setReady] = useState(false), [verify, setVerify] = useState(false), [welcome, setWelcome] = useState(false);
  const [nt, setNt] = useState([]), [ev, setEv] = useState(null), [later, setLater] = useState(false), [q, setQ] = useState('');
  const toast = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2800); };
  const load = async () => {
    const qs = new URLSearchParams();
    if (postId) qs.set('id', postId);
    if (saved) qs.set('saved', '1');
    if (q.trim()) qs.set('q', q.trim());
    const d = await api('/api/posts?' + qs);
    if (d.needVerify) setVerify(true);
    else if (d.banned) setErr(d.error);
    else if (d.error) { toast(d.error); setPosts([]); }
    else setPosts(d.posts);
    setReady(true);
  };
  const loadN = async () => {
    const d = await api('/api/notices');
    let seen = ''; try { seen = localStorage.getItem('noticeSeen') || ''; } catch {}
    setNt((d.notices || []).filter((x) => x.created_at > seen));
  };
  const boot = () => { load(); loadN(); };
  useEffect(() => {
    boot();
    try { setWelcome(!localStorage.getItem('welcomed')); setLater(Date.now() - Number(localStorage.getItem('installLater') || 0) < 3 * 864e5); } catch {}
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    const bip = (e) => { e.preventDefault(); setEv(e); };
    addEventListener('beforeinstallprompt', bip);
    return () => removeEventListener('beforeinstallprompt', bip);
  }, []);
  useEffect(() => { if (!ready) return; const t = setTimeout(load, 350); return () => clearTimeout(t); }, [q]);
  const react = async (p, kind) => {
    const k = kind === 'like' ? 'liked' : 'saved';
    setPosts((l) => l.map((x) => (x.id === p.id ? { ...x, [k]: !x[k], likes: kind === 'like' ? x.likes + (x.liked ? -1 : 1) : x.likes } : x)));
    const r = await api('/api/react', { post_id: p.id, kind });
    if (r.error) { toast(r.error); load(); }
  };
  const share = async (p) => {
    const url = location.origin + '/p/' + p.id;
    try {
      if (navigator.share) await navigator.share({ title: 'Black School Community', text: p.content.slice(0, 100), url });
      else { await navigator.clipboard.writeText(url); toast('Tautan disalin'); }
    } catch {}
  };
  const next = () => { try { localStorage.setItem('welcomed', '1'); } catch {} router.push('/rules'); };
  const show = !ready || err ? null : verify ? 'v' : welcome ? 'w' : nt.length ? 'n' : ev && !later ? 'i' : null;
  const ls = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

  return (
    <>
      {saved && <div className="pg" style={{ paddingBottom: 0 }}><h1>Tersimpan</h1></div>}
      {!saved && !postId && (
        <div className="sbw"><div className="sb">
          <Ic n="search" s={18} />
          <input value={q} maxLength={50} onChange={(e) => setQ(e.target.value)} placeholder="Cari postingan atau anonym_123456" aria-label="Cari" />
          {q && <button className="ib" aria-label="Hapus pencarian" onClick={() => setQ('')}><Ic n="x" s={16} /></button>}
        </div></div>
      )}
      {posts === null && !err && <div className="sp" />}
      {err && <div className="empty"><h2>{err}</h2></div>}
      {posts?.length === 0 && <div className="empty">{q.trim() ? 'Tidak ada hasil pencarian.' : saved ? 'Belum ada postingan tersimpan.' : 'Belum ada postingan. Tekan + untuk jadi yang pertama.'}</div>}
      {posts?.map((p) => (
        <article className="post" key={p.id}>
          <Avatar name={p.anon_users?.username} />
          <div className="pb">
            <div className="ph"><b>{p.anon_users?.username}</b><span className="mut">· {ago(p.created_at)}</span></div>
            <p><Text t={p.content} /></p>
            <div className="ac">
              <button className="ab" aria-label="Komentar" onClick={() => setOpen(open === p.id ? null : p.id)}><Ic n="chat" s={18} /></button>
              <button className={'ab lk' + (p.liked ? ' on' : '')} aria-label="Suka" onClick={() => react(p, 'like')}><Ic n="heart" s={18} f={p.liked} />{p.likes || ''}</button>
              <button className={'ab' + (p.saved ? ' on' : '')} aria-label="Simpan" onClick={() => react(p, 'save')}><Ic n="mark" s={18} f={p.saved} /></button>
              <button className="ab" aria-label="Bagikan" onClick={() => share(p)}><Ic n="share" s={18} /></button>
              <button className="ab r" aria-label="Laporkan" onClick={() => setRep({ post_id: p.id })}><Ic n="flag" s={18} /></button>
            </div>
            {open === p.id && <Comments postId={p.id} toast={toast} onReport={setRep} />}
          </div>
        </article>
      ))}
      {!err && <button className="fab" aria-label="Buat postingan" onClick={() => setCompose(true)}><Ic n="plus" s={28} /></button>}
      {compose && <Compose onClose={() => setCompose(false)} onDone={() => { setCompose(false); load(); }} toast={toast} />}
      {rep && <Report target={rep} onClose={() => setRep(null)} toast={toast} />}
      {show === 'v' && <Verify onDone={() => { setVerify(false); boot(); }} />}
      {show === 'w' && (
        <Modal>
          <div className="wl">
            <img src={LOGO} alt="" width="64" height="64" />
            <h2>Selamat datang di Black School Community</h2>
            <p className="mut">Ruang anonim untuk siswa. Sebelum mulai, baca dulu aturan komunitasnya ya.</p>
            <button className="pill" onClick={next}>Lanjutkan</button>
          </div>
        </Modal>
      )}
      {show === 'n' && (
        <Modal onClose={() => { ls('noticeSeen', nt[0].created_at); setNt([]); }}>
          <h3>Pemberitahuan Admin</h3>
          {nt.map((x) => <div key={x.id} className="opt" style={{ cursor: 'default' }}><Text t={x.content} /></div>)}
          <div className="mf"><button className="pill" onClick={() => { ls('noticeSeen', nt[0].created_at); setNt([]); }}>Mengerti</button></div>
        </Modal>
      )}
      {show === 'i' && (
        <Modal onClose={() => { ls('installLater', String(Date.now())); setLater(true); }}>
          <div className="wl">
            <img src={LOGO} alt="" width="64" height="64" />
            <h2>Tambahkan ke layar utama</h2>
            <p className="mut">Buka lebih cepat, seperti aplikasi.</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="pill" onClick={async () => { ev.prompt(); await ev.userChoice; setEv(null); }}>Tambahkan sekarang</button>
              <button className="bt" onClick={() => { ls('installLater', String(Date.now())); setLater(true); }}>Nanti</button>
            </div>
          </div>
        </Modal>
      )}
      {msg && <div className="toast">{msg}</div>}
    </>
  );
}
