# Audit Fungsi Proposal vs SiMIDS V6

## Direpresentasikan di prototype
- Data kohort anak dan identitas orang tua.
- Input imunisasi melalui smartphone.
- Validasi input kader oleh bidan.
- Pengingat jadwal di dalam website.
- Click-to-WhatsApp dengan pesan siap kirim; pengiriman tetap dikendalikan kader.
- Peta risiko dusun dan prioritas sweeping.
- Daftar anak terlambat/dekat jadwal/MR-2 belum tercatat.
- Pencatatan hasil sweeping/tindak lanjut.
- Dashboard cakupan imunisasi.
- Tren cakupan kumulatif mingguan.
- Pre-test/post-test ibu balita dan kader.
- Penyuluhan ibu balita.
- Pelatihan komunikasi risiko kader.
- Pelatihan operasional digital kader.
- Kelompok peduli imunisasi/peer-group.
- Monitoring target program: kohort 187, sweeping >=22, peningkatan pengetahuan >=30%, keterlambatan <=1 minggu, MR-2 >=85%.
- Laporan rutin dengan Sasaran Pusdatin, Sasaran Daerah, dan kelompok hasil imunisasi sesuai spreadsheet sumber.
- Ekspor CSV format laporan kumulatif.
- Ekspor kohort individu mengikuti struktur data sumber.
- Materi program direpresentasikan: leaflet, flipchart A3, video 3–5 menit, panduan kader.
- Backup lokal dan PWA cache.

## Membutuhkan backend saat go-live
- Login akun nyata Kader/Bidan/Puskesmas.
- Database bersama dan real-time antarperangkat.
- Sinkronisasi offline → server.
- RLS/pembatasan hak akses per desa/Posyandu.
- Audit trail server yang tidak bisa dimodifikasi pengguna.

## Luaran program yang bukan fungsi aplikasi
Aplikasi dapat mengukur dan mendokumentasikan, tetapi pelaksanaan lapangan tetap diperlukan untuk mencapai peningkatan pengetahuan, cakupan MR-2, artikel ilmiah, laporan akhir, publikasi media massa, dan produksi materi edukasi final.
