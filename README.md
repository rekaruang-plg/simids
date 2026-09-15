# SiMIDS Tanjung Lago — Prototype V5

V5 menyempurnakan V4 dengan fokus pada tiga keluaran proposal: **peta risiko dusun**, **tren cakupan mingguan**, dan **report yang mengikuti struktur Data Tanjung Lago.xlsx**. Antarmuka kader tetap dibuat sederhana untuk penggunaan melalui smartphone.

## Alur kader
1. Cari/pilih anak melalui pemilih yang memiliki pencarian.
2. Pilih imunisasi dari tombol/daftar besar; imunisasi yang belum tercatat ditampilkan lebih dulu.
3. Tanggal pelayanan otomatis hari ini, tetapi dapat diubah.
4. Periksa ringkasan lalu simpan.
5. Website menampilkan pengingat anak yang perlu dihubungi.
6. Tombol WhatsApp membuka chat dengan pesan yang sudah disiapkan; kader tetap menekan **Kirim** sendiri.
7. Hasil tindak lanjut/sweeping dicatat kembali ke SiMIDS.

## Perubahan utama V5
- **Peta Risiko Dusun skematik**: warna risiko per dusun, dapat disentuh untuk memfilter daftar anak. Peta tidak mengklaim batas geografis sebenarnya karena file sumber tidak menyediakan koordinat/batas dusun.
- **Tren cakupan mingguan**: grafik menampilkan cakupan kumulatif (%) per minggu, bukan jumlah input. MR-2 menampilkan garis target 85%.
- **Report Excel**: preview 159 kolom mengikuti struktur sumber: NO, Puskesmas, Desa, Sasaran Pusdatin (BBL & Surviving Infants), Sasaran Daerah (BBL & Surviving Infants), kemudian 24 kelompok hasil imunisasi dengan #L/%/#P/%/#JML/%.
- **IPV-3 (Khusus DIY)** ditambahkan karena kolom ini ada pada spreadsheet sumber.
- Report resmi hanya memakai entri imunisasi yang sudah divalidasi.
- Export CSV memakai tiga baris header agar saat dibuka di Excel susunannya tetap mengikuti report sumber.

## Master sasaran
Data awal master sasaran berasal dari angka L/P per desa yang tersedia pada report. Dalam file contoh, empat blok sasaran mempunyai total yang sama; V5 menyimpan keempat blok sebagai field terpisah agar siap jika nantinya angka Pusdatin/Daerah atau BBL/SI berbeda.

## Offline dan produksi
Prototype tetap memakai `localStorage` sehingga dapat didemokan tanpa server. Service worker menyediakan cache PWA ketika di-host. Multi-user, sinkronisasi antarperangkat, autentikasi, dan RLS membutuhkan backend (mis. Supabase) sebelum go-live.
