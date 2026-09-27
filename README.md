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

### Pembaruan kader — 27 September 2026

- Tombol Edit/Hapus tersedia pada daftar anak dan hasil pencarian semua desa.
  Kader hanya boleh menghapus anak di desa penugasannya. Konfirmasi menjelaskan
  bahwa riwayat imunisasi, IDL, dan tindak lanjut ikut terhapus permanen.
- Pilihan imunisasi mendukung beberapa jenis dalam satu kunjungan. Tanggal,
  tempat, catatan, dan jadwal berikutnya berlaku untuk semua pilihan. Untuk batch
  berbeda, tuliskan nama vaksin dan batch masing-masing pada kolom keterangan.
  Input beberapa imunisasi memerlukan koneksi internet dan disimpan melalui satu
  transaksi insert. Input satu imunisasi tetap mendukung antrean offline.
- Login kader mengenali nama desa yang terdaftar, misalnya `mulya sari`,
  `mulya_sari`, dan `kader_mulya_sari`. Kata sandi tidak diubah.
- Terapkan migration `kader_child_delete_village_scope` untuk izin hapus kader.
  Perubahan kebijakan ini sudah diterapkan pada proyek Supabase terkait.

Verifikasi: `node --test tests/backend.test.cjs` (10 skenario) dan
`node tests/browser.cjs` (memerlukan Playwright dan Chromium; bisa memakai
`CHROMIUM_PATH`). Browser memakai data sintetis dan memeriksa edit/hapus kader,
konfirmasi batal hapus, edit dari daftar semua desa, multi-select, kegagalan
simpan, status belum divalidasi, serta layout HP. Uji transaksi database yang
selalu di-rollback memastikan edit/hapus desa sendiri, penolakan hapus lintas
desa, insert dua imunisasi dengan status belum diverifikasi, dan cascade hapus.
Login password akun kader asli belum diuji; status aktif/konfirmasi dan bootstrap
wilayah Mulya Sari berhasil diperiksa.

Pemeriksaan advisor masih melaporkan temuan pada konfigurasi lama yang tidak
berubah dalam patch ini, termasuk fungsi SECURITY DEFINER yang dapat dieksekusi
anon, ekstensi pg_net di public, dan proteksi password bocor yang nonaktif.
Lihat [panduan audit fungsi](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
[panduan ekstensi](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public),
dan [proteksi password](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
