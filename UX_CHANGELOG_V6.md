# SiMIDS V6 — Kohort Individu + UX Kader

V6 disesuaikan dengan struktur file data individu kohort bayi yang digunakan di lapangan.

## Prinsip
- Kader **tidak melihat 66 kolom** seperti spreadsheet.
- Data identitas anak diisi sekali.
- Setiap pelayanan imunisasi cukup: pilih anak → pilih imunisasi → tanggal → Pos Imunisasi → simpan.
- `Tanggal Input` dicatat otomatis oleh sistem.
- Provinsi, kabupaten, kecamatan, dan Puskesmas terisi otomatis untuk wilayah program.
- Pos Imunisasi menggunakan daftar yang dapat dicari.
- Setelah menyimpan, kader dapat langsung memilih “Imunisasi lain, anak yang sama” bila ada lebih dari satu layanan pada hari yang sama.

## Kesetaraan dengan data kohort sumber
Identitas: NIK Anak, Nama Anak, Tanggal Lahir, Jenis Kelamin, Nama Orang Tua, Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan/Desa, Puskesmas.

Pelayanan: HB0, BCG 1, POLIO 1–4, DPT-Hb-Hib 1–3, IPV 1–2, ROTA 1–3, PCV 1–2, MR 1. Masing-masing mempunyai tanggal imunisasi, tanggal input, dan Pos Imunisasi pada hasil ekspor.

MR-2 tetap disimpan sebagai indikator program sesuai proposal, tetapi tidak dipaksakan ke format kohort lama yang hanya mempunyai MR-1.

## Ekspor
Halaman Laporan menyediakan ekspor `Kohort Individu (CSV)` dengan susunan kolom yang sama seperti file sumber, selain laporan kumulatif program yang sudah ada.

## Privasi
Data nyata dari file yang diberikan tidak dimasukkan ke source code atau demo publik. V6 hanya menggunakan struktur kolom dan daftar fasilitas/pos umum.
