# SiMIDS Tanjung Lago — Prototype V6

SiMIDS V6 adalah prototype pencatatan kohort bayi dan imunisasi untuk kader Posyandu, bidan desa, dan Puskesmas Tanjung Lago. V6 menyesuaikan input dengan struktur **data individu kohort bayi** yang biasa digunakan, tetapi antarmuka kader dibuat jauh lebih sederhana agar nyaman dipakai lewat smartphone.

## Alur kader
1. Cari atau pilih anak dengan pencarian nama anak, NIK, nama orang tua, dusun, atau Posyandu.
2. Pilih jenis imunisasi dari daftar besar yang dapat dicari.
3. Tanggal pelayanan otomatis hari ini dan dapat diubah bila diperlukan.
4. Pos Imunisasi otomatis memakai Posyandu anak bila tersedia dan tetap dapat dicari/diganti.
5. Tanggal input dicatat otomatis oleh sistem.
6. Periksa ringkasan lalu simpan.
7. Website menampilkan pengingat anak yang perlu ditindaklanjuti.
8. Tombol WhatsApp membuka chat dengan pesan yang sudah disiapkan; kader tetap menekan **Kirim** sendiri.
9. Hasil tindak lanjut/sweeping dicatat kembali ke SiMIDS.

## Penyesuaian V6 dengan data kohort individu
- Identitas: NIK Anak, Nama Anak, Tanggal Lahir, Jenis Kelamin, Nama Orang Tua, Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan/Desa, dan Puskesmas.
- Pelayanan: HB0, BCG 1, POLIO 1–4, DPT-Hb-Hib 1–3, IPV 1–2, ROTA 1–3, PCV 1–2, dan MR 1.
- Untuk setiap pelayanan, sistem menyimpan **Tanggal Imunisasi, Tanggal Input, dan Pos Imunisasi**.
- MR-2 tetap tersedia sebagai indikator program sesuai proposal, walaupun tidak terdapat pada format kohort individu lama.
- Data IDL disiapkan dalam struktur data/ekspor, tetapi tidak dibebankan sebagai input rutin kader.

## Keluaran sistem
- Peta risiko dusun dan daftar prioritas sweeping.
- Pengingat jadwal di dalam website.
- Click-to-WhatsApp dengan pesan siap kirim.
- Tren cakupan mingguan.
- Dashboard target proposal.
- Laporan kumulatif mengikuti format Data Tanjung Lago.
- Ekspor **Kohort Individu (CSV)** mengikuti struktur data sumber.

## Deployment GitHub/Vercel
Repository ini menggunakan loader statis (`index.html` + `loader.js`) dengan file aplikasi di folder `chunks/`. Struktur ini dipakai agar deployment static Vercel stabil dan tidak mengalami masalah encoding/base64 seperti deployment prototype awal.

Tidak diperlukan build command atau package manager. Framework preset di Vercel dapat menggunakan **Other** dengan root directory `./`.

## Prototype vs produksi
Prototype masih memakai `localStorage`. Data tersimpan di browser/perangkat yang digunakan. Untuk go-live multi-user, sinkronisasi antarperangkat, autentikasi Kader/Bidan/Puskesmas, database bersama, dan RLS perlu diaktifkan melalui backend seperti Supabase.

Dokumentasi tambahan:
- `MAPPING_KOHORT_V6.md`
- `UX_CHANGELOG_V6.md`
- `FUNGSI_PROPOSAL_VS_SISTEM.md`
