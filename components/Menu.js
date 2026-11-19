'use client';
import Link from 'next/link';
import { useState } from 'react';
const L = [['/', 'Beranda'], ['/saved', 'Tersimpan'], ['/notices', 'Pemberitahuan Admin'], ['/rules', 'Aturan']];

export default function Menu() {
  const [o, setO] = useState(false);
  return (
    <>
      <button className="ib" aria-label="Menu" onClick={() => setO(!o)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
      {o && <div className="mbd" onClick={() => setO(false)}><nav className="mn" onClick={(e) => e.stopPropagation()}>{L.map(([h, t]) => <Link key={h} href={h} onClick={() => setO(false)}>{t}</Link>)}</nav></div>}
    </>
  );
}
