import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const INTERNAL_DOMAIN = "simids.example.com";
const roles = new Set(["kader", "bidan", "puskesmas", "admin"]);
const normalizeUsername = (value: unknown) => String(value || "").trim().toLowerCase();
const internalEmail = (username: string) => `${username}@${INTERNAL_DOMAIN}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Metode tidak didukung." }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Sesi admin tidak ditemukan." }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Sesi admin tidak valid." }, 401);

  const callerId = userData.user.id;
  const { data: callerAccess, error: accessError } = await admin
    .from("simids_user_access")
    .select("user_id,role,active")
    .eq("user_id", callerId)
    .maybeSingle();
  if (accessError) return json({ error: accessError.message }, 500);
  if (!callerAccess?.active || callerAccess.role !== "admin") return json({ error: "Hanya administrator SiMIDS yang dapat mengelola akun." }, 403);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: "Permintaan tidak valid." }, 400); }
  const action = String(body.action || "list");

  if (action === "list") {
    const { data: accessRows, error } = await admin
      .from("simids_user_access")
      .select("user_id,role,display_name,village,active,created_at,updated_at")
      .order("created_at", { ascending: true });
    if (error) return json({ error: error.message }, 500);

    const { data: targetRows, error: targetError } = await admin
      .from("simids_targets")
      .select("village")
      .order("village", { ascending: true });
    if (targetError) return json({ error: targetError.message }, 500);

    const authUsers: any[] = [];
    let page = 1;
    for (;;) {
      const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listError) return json({ error: listError.message }, 500);
      authUsers.push(...data.users);
      if (data.users.length < 1000) break;
      page += 1;
    }
    const byId = new Map(authUsers.map((u: any) => [u.id, u]));
    const users = (accessRows || []).map((row: any) => {
      const authUser: any = byId.get(row.user_id);
      const email = authUser?.email || "";
      const isInternal = email.endsWith(`@${INTERNAL_DOMAIN}`);
      const username = authUser?.user_metadata?.username || (isInternal ? email.slice(0, -(`@${INTERNAL_DOMAIN}`.length)) : email);
      return {
        ...row,
        username,
        email: isInternal ? null : email,
        internal_login: isInternal,
        last_sign_in_at: authUser?.last_sign_in_at || null,
      };
    });
    const villages = [...new Set((targetRows || []).map((row: any) => row.village).filter(Boolean))];
    return json({ users, villages });
  }

  if (action === "create") {
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    const displayName = String(body.display_name || "").trim();
    const role = String(body.role || "").trim();
    const village = String(body.village || "").trim();

    if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(username)) return json({ error: "Username 3–40 karakter: huruf kecil, angka, titik, garis bawah, atau minus." }, 400);
    if (password.length < 8) return json({ error: "Kata sandi minimal 8 karakter." }, 400);
    if (!displayName) return json({ error: "Nama petugas wajib diisi." }, 400);
    if (!roles.has(role)) return json({ error: "Peran tidak valid." }, 400);
    if ((role === "kader" || role === "bidan") && !village) return json({ error: "Desa penugasan wajib dipilih untuk kader/bidan." }, 400);

    const email = internalEmail(username);
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, username, simids_internal: true },
    });
    if (createError || !created.user) {
      const msg = createError?.message || "Akun gagal dibuat.";
      return json({ error: /already|registered|exists/i.test(msg) ? "Username sudah dipakai." : msg }, 400);
    }

    const accessPayload = {
      user_id: created.user.id,
      role,
      display_name: displayName,
      village: role === "kader" || role === "bidan" ? village : null,
      active: true,
      updated_at: new Date().toISOString(),
    };
    const { error: insertError } = await admin.from("simids_user_access").insert(accessPayload);
    if (insertError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: insertError.message }, 500);
    }
    return json({ user: { ...accessPayload, username, email: null, internal_login: true } }, 201);
  }

  if (action === "update") {
    const userId = String(body.user_id || "");
    const role = String(body.role || "").trim();
    const displayName = String(body.display_name || "").trim();
    const village = String(body.village || "").trim();
    const active = body.active !== false;
    if (!userId || !roles.has(role) || !displayName) return json({ error: "Data akun belum lengkap." }, 400);
    if ((role === "kader" || role === "bidan") && !village) return json({ error: "Desa penugasan wajib dipilih untuk kader/bidan." }, 400);
    if (userId === callerId && (!active || role !== "admin")) return json({ error: "Administrator tidak dapat menonaktifkan atau menurunkan akses akunnya sendiri." }, 400);

    const { error } = await admin.from("simids_user_access").update({
      role,
      display_name: displayName,
      village: role === "kader" || role === "bidan" ? village : null,
      active,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
    if (error) return json({ error: error.message }, 500);
    await admin.auth.admin.updateUserById(userId, { user_metadata: { display_name: displayName } });
    return json({ ok: true });
  }

  if (action === "reset_password") {
    const userId = String(body.user_id || "");
    const password = String(body.password || "");
    if (!userId || password.length < 8) return json({ error: "Kata sandi baru minimal 8 karakter." }, 400);
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: "Aksi tidak dikenali." }, 400);
});
