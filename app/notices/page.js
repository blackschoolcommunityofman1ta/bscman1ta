'use client';
import { useEffect, useState } from 'react';

export default function Notices() {
  const [l, setL] = useState(null);
  useEffect(() => { fetch('/api/notices').then((r) => r.json()).then((d) => setL(d.notices || [])).catch(() => setL([])); }, []);
  return (
    <div className="pg"><h1>Pemberitahuan Admin</h1>
      <p className="mut">Dihapus otomatis setelah 7 hari.</p>
      {l === null && <div className="sp" />}
      {l?.length === 0 && <p className="mut">Belum ada pemberitahuan.</p>}
      {l?.map((x) => <div className="opt" style={{ cursor: 'default' }} key={x.id}><div>{x.content}</div><div className="mut" style={{ fontSize: '.8rem', marginTop: 4 }}>{new Date(x.created_at).toLocaleString('id-ID')}</div></div>)}
    </div>
  );
}
