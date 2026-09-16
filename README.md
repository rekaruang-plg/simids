# SiMIDS Tanjung Lago — Prototype V6.1

SiMIDS V6.1 adalah prototype pencatatan data bayi dan imunisasi untuk kader Posyandu, bidan desa, dan Puskesmas Tanjung Lago. Sistem tetap mengikuti struktur **data individu kohort bayi** yang digunakan di lapangan, tetapi antarmuka kader disederhanakan agar nyaman dipakai lewat smartphone.

## Data demo
Prototype memuat **10 anak dummy** untuk uji coba alur kader. Seluruh nama, NIK, nomor telepon, dan alamat pada data demo bersifat fiktif. Pola imunisasi, tanggal pelayanan/input, dan Pos Imunisasi dibuat menyerupai struktur kohort individu agar fitur input, pengingat, validasi, dashboard, sweeping, dan ekspor dapat diuji tanpa memakai data pribadi anak asli.

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

## Penyesuaian dengan data kohort individu
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

## Polishing V6.1 untuk uji kader
- Kontrol sentuh utama dan sekunder ditargetkan minimal 44–48 px pada tampilan mobile.
- Tombol tutup popup dibuat 48×48 px dan tab filter imunisasi minimal 48 px.
- Istilah teknis pada area kerja kader disederhanakan; struktur teknis tetap dipertahankan pada laporan.
- Pemilih Kader/Bidan/Puskesmas diberi label **Mode uji** agar tidak disalahartikan sebagai hak akses production.
- Cache PWA dinaikkan ke V6.1 agar perangkat tidak tertahan versi lama.

## Deployment GitHub/Vercel
Repository menggunakan loader statis (`index.html` + `loader.js`) dengan file aplikasi di folder `chunks/`. Tidak diperlukan build command atau package manager. Framework preset di Vercel dapat menggunakan **Other** dengan root directory `./`.

## Prototype vs produksi
Prototype masih memakai `localStorage`. Data tersimpan di browser/perangkat yang digunakan. Untuk go-live multi-user, sinkronisasi antarperangkat, autentikasi Kader/Bidan/Puskesmas, database bersama, dan RLS perlu diaktifkan melalui backend seperti Supabase.

Dokumentasi tambahan:
- `MAPPING_KOHORT_V6.md`
- `UX_CHANGELOG_V6.md`
- `UX_CHANGELOG_V6_1.md`
- `QA_UJI_SINGKAT_V6_1.md`
- `FUNGSI_PROPOSAL_VS_SISTEM.md`
