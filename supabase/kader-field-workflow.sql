-- Dokumentasi perubahan production untuk workflow kader.
-- SUDAH diterapkan ke project Supabase production; jangan dijalankan ulang tanpa review.

-- 1) public.simids_followup_page(text,text,integer,integer,integer)
-- Logika MR-2 tidak lagi menandai semua anak yang belum punya MR-2.
-- MR-2 baru masuk pengingat ketika usia anak mendekati / melewati 18 bulan.
-- Jadwal next_due_date yang diisi petugas tetap memiliki prioritas.

-- 2) public.simids_validation_queue(text,integer,integer)
-- RPC ringan untuk antrean verifikasi Bidan/Puskesmas/Admin, 50 catatan per halaman.

-- 3) public.simids_audit_log
-- Audit trail server-side untuk INSERT/UPDATE/DELETE pada:
--   public.simids_children
--   public.simids_immunizations
--   public.simids_followups
-- Menyimpan actor_user_id, actor_role, data sebelum/sesudah, dan waktu perubahan.
-- Pengguna aplikasi tidak mempunyai izin INSERT/UPDATE/DELETE ke tabel audit.
-- SELECT dibatasi untuk role puskesmas/admin.

-- Jadwal MR-2 18 bulan mengikuti jadwal imunisasi rutin Kementerian Kesehatan
-- yang digunakan sebagai dasar operasional pengingat. Ketentuan klinis lokal tetap
-- dapat diprioritaskan melalui kolom next_due_date pada pelayanan anak.
