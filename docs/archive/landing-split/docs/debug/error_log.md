# Error Log

## 2026-02-15 · Typecheck falla por `PageProps.params` en `.next/types`

- **Comando:** `npm run typecheck`
- **Error:**

```text
.next/types/app/track/[id]/page.ts(34,29): error TS2344: Type 'PageProps' does not satisfy the constraint 'import("/home/ddfer/projects/lynx-media/.next/types/app/track/[id]/page").PageProps'.
  Types of property 'params' are incompatible.
    Type 'Promise<{ id: string; catalog?: string | undefined; }> | { id: string; catalog?: string | undefined; }' is not assignable to type 'Promise<any> | undefined'.
      Type '{ id: string; catalog?: string | undefined; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]
```

- **Impacto:** bloquea `tsc --noEmit` global.
- **Hipótesis:** mezcla de firma legacy y nueva en una ruta App Router (`params` objeto vs `params` Promise) en `app/track/[id]/page.tsx`.
- **Pendiente:** corregir firma de `PageProps` y regenerar `.next/types`.

## 2026-02-15 · `landing:db:push` falla por conectividad IPv6-only (Supabase direct URL)

- **Comando:** `npm run landing:db:push`
- **Error:** `Schema engine error` sin detalle adicional.
- **Diagnóstico de red:** `db.gebrweviosrnelwshlxz.supabase.co` resuelve solo IPv6 en este entorno (WSL), sin ruta IPv6.
- **Evidencia:**

```text
nc -zv db.gebrweviosrnelwshlxz.supabase.co 5432
nc: connect to db.gebrweviosrnelwshlxz.supabase.co (2600:...) port 5432 (tcp) failed: Network is unreachable

nc -4 -zv db.gebrweviosrnelwshlxz.supabase.co 5432
nc: getaddrinfo for host ...: No address associated with hostname
```

- **Resolución aplicada:** cambio a Session Pooler IPv4 (`aws-1-us-east-1.pooler.supabase.com:5432`) en `apps/landing/.env`.
- **Resultado final:** `npm run landing:db:push` ejecuta correctamente y materializa `ContactLead`.
