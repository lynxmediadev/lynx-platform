-- Auditoría de solo lectura para la línea base de FASE 0 y FASE 1.
-- Ejecutar con una conexión administrativa; no contiene ni muestra credenciales.

SELECT current_database() AS database_name,
       current_setting('server_version') AS server_version,
       pg_database_size(current_database()) AS database_bytes;

SELECT role, count(*) AS users
FROM public."User"
GROUP BY role
ORDER BY role;

SELECT status, count(*) AS users
FROM public."User"
GROUP BY status
ORDER BY status;

SELECT count(*) FILTER (WHERE "passwordHash" LIKE 'scrypt$%') AS scrypt_hashes,
       count(*) FILTER (WHERE "passwordHash" LIKE 'invited$%') AS invite_placeholders,
       count(*) FILTER (WHERE "passwordHash" IS NULL) AS nullable_passwords,
       count(*) FILTER (WHERE "supabaseAuthUserId" IS NOT NULL) AS supabase_links
FROM public."User";

SELECT count(*) AS supabase_auth_users
FROM auth.users;

SELECT count(*) AS public_tables,
       count(*) FILTER (WHERE c.relrowsecurity) AS rls_enabled_tables
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r';

SELECT grantee, privilege_type, count(*) AS direct_grants
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
GROUP BY grantee, privilege_type
ORDER BY grantee, privilege_type;

SELECT (SELECT count(*) FROM public."UserSession") AS user_sessions,
       (SELECT count(*) FROM public."PasswordResetToken") AS reset_tokens,
       (SELECT count(*) FROM public."InviteToken") AS invite_tokens,
       (SELECT count(*) FROM public."EmailVerificationToken") AS verification_tokens;

SELECT (SELECT count(*) FROM public."Track") AS tracks,
       (SELECT count(*) FROM public."TrackVersion") AS track_versions,
       (SELECT count(*) FROM public."TrackStem") AS track_stems;
