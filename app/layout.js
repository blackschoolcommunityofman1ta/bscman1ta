import Link from 'next/link';
import './globals.css';
import Menu from '@/components/Menu';
export const metadata = { title: 'Black School Community', description: 'Ruang anonim untuk siswa', icons: { icon: '/ikon.png', apple: '/ikon.png' } };
export const viewport = { themeColor: '#000000' };

export default function RootLayout({ children }) {
  return (
    <html lang="id"><body>
      <header className="hd">
        <Link href="/" className="brand"><img src="/ikon.png" alt="" width="34" height="34" /><div><b>Black School Community</b><span>MAN1TA</span></div></Link>
        <Menu />
      </header>
      <div className="col">{children}</div>
    </body></html>
  );
}
