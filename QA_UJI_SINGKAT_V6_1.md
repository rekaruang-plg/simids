# QA Uji Singkat SiMIDS V6.1

Tanggal audit: 16 September 2026.

## Hasil utama
- Halaman utama diuji pada viewport mobile 390×844.
- 10 anak dummy tampil pada Data Anak.
- Pencarian anak dengan kata `Kayla` mengembalikan 1 hasil yang tepat.
- Pemilih imunisasi menampilkan imunisasi yang belum tercatat; pada Kayla terdapat 8 pilihan dan OPV-3 menjadi pilihan pertama pada skenario uji.
- Pos Imunisasi otomatis mengikuti data anak (`PYD KENANGA 2-TANJUNG LAGO`).
- Tanggal pelayanan otomatis terisi tanggal hari ini.
- Tombol Simpan aktif setelah anak + imunisasi + tanggal + pos tersedia.
- Setelah simpan, kartu sukses muncul dan tombol **Imunisasi lain, anak yang sama** tersedia.
- Tidak ditemukan horizontal overflow pada viewport mobile uji.
- Mode Bidan menampilkan navigasi Dashboard; mode Puskesmas menampilkan Pengaturan.

## Audit target sentuh
Pada viewport mobile, semua kontrol yang sedang terlihat dari selector `button`, `select`, `input`, `a[href]`, dan `summary` memiliki lebar dan tinggi minimal 44 px. Sampel:
- Pengingat: 48×48 px.
- Pemilih Mode Uji: tinggi 48 px.
- Menu lainnya: tinggi 48 px.
- Tombol tutup popup: 48×48 px.
- Tab filter imunisasi: tinggi 48 px.

## Perubahan UX V6.1
- Istilah teknis di area kerja kader disederhanakan menjadi **data anak**, **imunisasi**, dan **laporan**.
- Pergantian peran diberi label **Mode uji** agar tidak disalahartikan sebagai hak akses production.
- Kontrol sentuh sekunder dinaikkan ke minimal 44–48 px.

## Status
**Layak untuk uji pengguna lapangan sebagai prototype.** Validasi akhir kemudahan penggunaan tetap perlu dilakukan dengan kader/bidan/petugas Puskesmas nyata karena cognitive walkthrough dan automated UI check tidak dapat menggantikan observasi pengguna langsung.
