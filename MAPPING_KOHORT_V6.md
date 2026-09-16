# Mapping Data Individu Kohort → SiMIDS V6

File sumber mempunyai 66 kolom dan 2.057 baris data anak (di luar header). V6 tidak menampilkan 66 kolom tersebut kepada kader.

## Identitas anak (diisi sekali)
- NIK Anak
- Nama Anak
- Tanggal Lahir Anak
- Jenis Kelamin Anak
- Nama Orang Tua
- Kelurahan / Desa

Kolom wilayah berikut diisi otomatis oleh sistem untuk program ini:
- Provinsi: SUMATERA SELATAN
- Kabupaten atau Kota: KAB. BANYUASIN
- Kecamatan: TANJUNG LAGO
- Puskesmas: TANJUNG LAGO

Field tambahan SiMIDS untuk kebutuhan proposal:
- Dusun (peta risiko/sweeping)
- Nomor WhatsApp orang tua
- Alamat/patokan rumah
- Posyandu / Pos Imunisasi utama

## Pelayanan imunisasi
Struktur sumber mencatat tiga kolom untuk setiap dosis: tanggal imunisasi, tanggal input, dan Pos Imunisasi.

Jenis yang dipetakan langsung:
HB0; BCG 1; POLIO 1–4; DPT-Hb-Hib 1–3; IPV 1–2; ROTA 1–3; PCV 1–2; MR 1.

Pada V6 kader hanya perlu:
1. Pilih anak.
2. Pilih jenis imunisasi.
3. Pilih/cek tanggal pelayanan.
4. Pilih Pos Imunisasi (otomatis terisi dari Posyandu anak bila tersedia).
5. Simpan.

Tanggal Input dibuat otomatis oleh sistem.

## IDL
File sumber mempunyai Tanggal IDL 1, Tanggal Input IDL 1, Pos IDL 1, PKM Pembentuk IDL 1, dan Status IDL 1. Field ini tidak dipaksa menjadi input harian kader karena pada data sumber `Pos IDL 1` merupakan `INPUT OLEH SISTEM`. Struktur database V6 sudah menyiapkan field IDL untuk proses/verifikasi tingkat bidan/Puskesmas.

## MR-2
File kohort individu yang diberikan hanya mempunyai MR-1, sedangkan proposal SiMIDS menargetkan MR dosis ke-2. Karena itu MR-2 tetap menjadi indikator tambahan SiMIDS dan tidak dimasukkan secara paksa ke ekspor kohort lama 66 kolom.

## Ekspor
Menu Laporan V6 mempunyai ekspor Kohort Individu CSV dengan 66 header yang sama persis dengan file sumber, sekaligus mempertahankan laporan kumulatif program yang sudah ada.

## Privasi
Nama, NIK, dan data individu dari file sumber tidak dimasukkan ke demo/source code publik. Hanya struktur field dan nama fasilitas umum yang dipakai sebagai acuan desain sistem.
