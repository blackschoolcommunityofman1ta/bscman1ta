'use client';
import { useEffect, useState } from 'react';

const api = (u, body) => fetch(u, body && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());

function Comments({ postId }) {
  const [list, setList] = useState([]), [text, setText] = useState(''), [reply, setReply] = useState(null);
  const load = () => api('/api/comments?post_id=' + postId).then((d) => setList(d.comments || []));
  useEffect(() => { load(); }, []);
  const send = async () => {
    const r = await api('/api/comments', { post_id: postId, parent_id: reply?.id, content: text });
    if (r.error) return alert(r.error);
    setText(''); setReply(null); load();
  };
  const render = (c) => (
    <div className="c" key={c.id}>
      <span className="who">{c.anon_users?.username}</span> {c.content}{' '}
      <button className="g" onClick={() => setReply(c)}>Balas</button>
      {list.filter((x) => x.parent_id === c.id).map(render)}
    </div>
  );
  return (
    <div>
      {list.filter((c) => !c.parent_id).map(render)}
      <div className="row">
        <input value={text} maxLength={300} onChange={(e) => setText(e.target.value)}
          placeholder={reply ? `Membalas ${reply.anon_users?.username}…` : 'Tulis komentar…'} />
        <button onClick={send}>Kirim</button>
        {reply && <button className="g" onClick={() => setReply(null)}>Batal</button>}
      </div>
    </div>
  );
}

export default function Home() {
  const [posts, setPosts] = useState([]), [text, setText] = useState(''), [open, setOpen] = useState(null), [err, setErr] = useState('');
  const load = () => api('/api/posts').then((d) => (d.error ? setErr(d.error) : setPosts(d.posts)));
  useEffect(() => { load(); }, []);
  const send = async () => {
    const r = await api('/api/posts', { content: text });
    if (r.error) return alert(r.error);
    setText(''); load();
  };
  if (err) return <main><h1>{err}</h1></main>;
  return (
    <main>
      <h1>Komunitas Siswa</h1>
      <textarea rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Apa yang ingin kamu bagikan?" />
      <div className="row"><button onClick={send}>Kirim postingan</button><span className="t">{text.length}/500</span></div>
      {posts.length === 0 && <p className="t">Belum ada postingan. Jadilah yang pertama.</p>}
      {posts.map((p) => (
        <div className="post" key={p.id}>
          <span className="who">{p.anon_users?.username}</span> <span className="t">{new Date(p.created_at).toLocaleString('id-ID')}</span>
          <p>{p.content}</p>
          <button className="g" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? 'Tutup komentar' : 'Komentar'}</button>
          {open === p.id && <Comments postId={p.id} />}
        </div>
      ))}
    </main>
  );
}
