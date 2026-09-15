# SiMIDS Tanjung Lago — Prototype V5

Prototype sistem monitoring imunisasi untuk kader Posyandu, bidan desa, dan Puskesmas Tanjung Lago. V5 berfokus pada **input yang mudah untuk kader**, **pengingat tindak lanjut**, **peta risiko dusun**, **tren cakupan mingguan**, serta **report yang mengikuti struktur Data Tanjung Lago.xlsx**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frekaruang-plg%2Fsimids)

## Alur kader
1. Cari/pilih anak melalui pemilih dengan pencarian nama anak, ibu/orang tua, dusun, atau Posyandu.
2. Pilih imunisasi dari tombol/daftar besar; imunisasi yang belum tercatat ditampilkan lebih dulu.
3. Tanggal pelayanan otomatis hari ini, tetapi dapat diubah.
4. Periksa ringkasan lalu simpan.
5. Website menampilkan pengingat anak yang perlu dihubungi.
6. Tombol WhatsApp membuka chat dengan pesan yang sudah disiapkan; kader tetap menekan **Kirim** sendiri.
7. Hasil tindak lanjut/sweeping dicatat kembali ke SiMIDS.

## Perubahan utama V5
- **Peta Risiko Dusun skematik**: warna risiko per dusun dan dapat disentuh untuk memfilter daftar anak. Peta tidak mengklaim batas geografis sebenarnya karena sumber tidak menyediakan koordinat/batas dusun.
- **Tren cakupan mingguan**: grafik menampilkan cakupan kumulatif (%) per minggu, bukan jumlah input. MR-2 menampilkan garis target 85%.
- **Report Excel**: preview mengikuti struktur sumber: NO, Puskesmas, Desa, Sasaran Pusdatin (BBL & Surviving Infants), Sasaran Daerah (BBL & Surviving Infants), lalu kelompok hasil imunisasi dengan #L/%/#P/%/#JML/%.
- **IPV-3 (Khusus DIY)** ikut disediakan karena kolom tersebut ada pada spreadsheet sumber.
- Report resmi hanya memakai entri imunisasi yang sudah divalidasi.
- Export CSV memakai tiga baris header agar saat dibuka di Excel susunannya tetap mengikuti report sumber.

## Struktur deployment
Versi GitHub ini sengaja memakai loader statis kecil (`index.html` + `loader.js`). HTML aplikasi, CSS, dan JavaScript dibagi menjadi file teks pada folder `chunks/`, kemudian dirangkai kembali di browser. Tujuannya menghindari masalah encoding/base64 yang sempat terjadi pada deployment prototype langsung.

Tidak diperlukan build command, package manager, atau framework. Vercel cukup menjalankan repository ini sebagai **static site** dari root project.

## Master sasaran
Data awal master sasaran berasal dari angka L/P per desa yang tersedia pada report. Empat blok sasaran disimpan sebagai field terpisah agar siap jika angka Pusdatin/Daerah atau BBL/SI nantinya berbeda.

## Prototype vs produksi
Prototype ini masih memakai `localStorage` sehingga data tersimpan di browser/perangkat yang digunakan. Multi-user, sinkronisasi antarperangkat, autentikasi Kader/Bidan/Puskesmas, dan RLS akan dipasang pada tahap production dengan backend seperti Supabase.
