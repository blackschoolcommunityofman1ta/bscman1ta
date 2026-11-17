import Link from 'next/link';
import './globals.css';
export const metadata = { title: 'Black School Community of MAN1TA', description: 'Ruang anonim untuk siswa' };
export const viewport = { themeColor: '#000000' };

export default function RootLayout({ children }) {
  return (
    <html lang="id"><body>
      <header className="hd">
        <Link href="/" className="brand"><img src="/logo.png" alt="" width="34" height="34" /><div><b>Black School Community</b><span>MAN1TA</span></div></Link>
        <Link href="/rules" className="hl">Aturan</Link>
      </header>
      <div className="col">{children}</div>
    </body></html>
  );
}
