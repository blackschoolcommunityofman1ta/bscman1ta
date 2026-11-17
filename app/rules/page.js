import Link from 'next/link';
export const metadata = { title: 'Aturan Komunitas' };

export default function Rules() {
  return (
    <div className="pg">
      <h1>Aturan Komunitas</h1>
      <p className="mut">Agar ruang ini tetap aman dan nyaman untuk semua.</p>
      <ul>
        <li>Dilarang cyberbullying: menghina, mengejek, atau mengintimidasi siapa pun.</li>
        <li>Dilarang menyebarkan pornografi dan konten seksual dalam bentuk apa pun.</li>
        <li>Dilarang menyebarkan ujaran kebencian dan unsur SARA.</li>
        <li>Dilarang menyebarkan data pribadi orang lain dan diri sendiri: nama lengkap, nomor HP, alamat, atau foto tanpa izin.</li>
        <li>Dilarang menyebarkan hoaks, fitnah, dan ancaman.</li>
        <li>Dilarang spam, iklan, dan tautan mencurigakan.</li>
      </ul>
      <p className="mut">Anonim bukan berarti bebas tanpa tanggung jawab. Pelanggar akan dihapus postingannya dan diblokir beserta jaringannya tanpa pemberitahuan. Menemukan pelanggaran? Tekan <b>Laporkan</b> pada postingan.</p>
      <Link href="/" className="pill">Saya mengerti</Link>
    </div>
  );
}
