# SiMIDS Tanjung Lago — Supabase

Aplikasi pencatatan anak dan imunisasi menggunakan Supabase Auth dan database bersama. Semua akses data memerlukan login serta penugasan aktif di `simids_user_access`. Akun aplikasi lain dalam project yang sama tidak otomatis memperoleh akses SiMIDS.

## Status integrasi
- Project: `ntdqqzqgkylxixivkmrp` (project Supabase yang sudah ada).
- Impor kohort: 2.057 anak, 25.163 pelayanan imunisasi, 1.139 catatan IDL.
- Semua 2.057 baris asli dengan 66 kolom disimpan dalam arsip impor yang tidak dapat diakses browser.
- File sumber dan data pribadi **tidak** dimasukkan ke GitHub.
- Identitas, tanggal imunisasi/input, Pos Imunisasi, serta rincian IDL mengikuti Excel. Dusun, telepon, alamat, Posyandu utama, dan jadwal berikutnya yang tidak tersedia tetap kosong.
- HB0 yang tidak menyebut kategori waktu tetap HB0; tidak ditebak sebagai <24 jam berdasarkan tanggal lahir.
- Nama desa dipertahankan sesuai sumber. Penugasan desa memakai nama yang sama persis dengan data, misalnya `TANJUNGLAGO`.
- Angka sasaran lama ditandai belum diverifikasi dan tidak digunakan sebagai penyebut laporan. File kohort individu bukan sumber sasaran penduduk resmi. Administrator harus memeriksa nama desa, angka, dan tahun sebelum menandai `simids_targets.verified=true`.
- Filter tahun/fokus desa disimpan hanya selama sesi tampilan; catatan operasional disimpan di database.

## Akun pertama (perlu email pemilik)
Belum ada akun yang diberi akses SiMIDS. Tentukan email administrator terlebih dahulu. Buat akun melalui Supabase Authentication jika belum ada, kemudian administrator database menjalankan:

```sql
insert into public.simids_user_access(user_id,role,display_name,active)
select id,'admin','Administrator SiMIDS',true
from auth.users where lower(email)=lower('GANTI_DENGAN_EMAIL_ADMIN')
on conflict(user_id) do update set role='admin',active=true;
```

Untuk kader/bidan, isi kolom `village` sesuai nama desa sumber. Kader/bidan tanpa desa tidak mendapat akses data anak. Puskesmas/admin dapat mengakses seluruh data SiMIDS. Jangan memberikan akses kepada pengguna lain hanya karena mereka sudah login ke aplikasi lain di project ini.

## Menjalankan dan merilis
Hosting tetap statis: Vercel preset **Other**, tanpa build command. `index.html` memuat SDK lokal versi tetap, `backend.js`, dan `loader.js`. Setelah login, loader mengambil markup/CSS serta `app.js`. Tidak memerlukan service-role key di browser.

```sh
python -m http.server 8080
node --test tests/backend.test.cjs
```

`vendor/supabase-2.57.4.js` berasal dari paket resmi `@supabase/supabase-js@2.57.4`, lisensi MIT. Refresh session ditangani SDK; session disimpan di sessionStorage. Data kesehatan tidak disimpan ke localStorage. Service worker lama dinonaktifkan dan cache prototype dibersihkan. Setelah rilis, perangkat yang masih menampilkan demo perlu menutup/membuka ulang halaman atau hard refresh agar service worker lama diperbarui.

Penyimpanan menunggu konfirmasi server dan memperbarui satu catatan yang berubah. Kegagalan jaringan/izin ditampilkan tanpa pesan sukses. Pembaruan anak dan imunisasi memakai `updated_at` untuk mendeteksi perubahan bersamaan. Gunakan **Muat ulang data** untuk mengambil perubahan petugas lain; tidak ada antrean simpan offline.

## Database dan pengujian
`database_schema.sql` adalah snapshot struktur produksi tanpa data pribadi. Jangan menjalankannya lagi pada project yang sudah berisi tabel. `supabase/security.sql` dan `supabase/private-access.sql` mencatat perubahan yang **sudah diterapkan**, bukan langkah yang perlu diulang.

`supabase/verify-access.sql` menguji isolasi desa, penolakan pengguna tanpa akses, penolakan anonim, dan pencegahan kader memalsukan validasi. Semua fixture SQL di-rollback. `tests/backend.test.cjs` menguji pagination >1.000 baris, mapping IDL, penyimpanan satu catatan, rollback kegagalan, offline, dan konflik pembaruan.

Arsip impor sengaja memakai RLS tanpa kebijakan pengguna: hanya administrator database/service-role dapat mengaksesnya. Peringatan advisor pada aplikasi lain dalam project bersama tidak diubah oleh integrasi ini.

Uji browser dengan fixture sintetis: `node tests/browser.cjs` (memerlukan Playwright dan Chromium; opsional `CHROMIUM_PATH`). Telah diperiksa: halaman login, 1.001 baris, peran terkunci, simpan/edit, penolakan simpan, serta tampilan mobile 390 px. Login akun produksi belum diuji karena email admin belum ditentukan.
