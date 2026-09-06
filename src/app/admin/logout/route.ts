// src/app/admin/logout/route.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ /admin/logout — GET + POST en un solo Route Handler                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - GET: devuelve HTML mínimo que auto-envía un POST a esta misma ruta.       │
 * │ - POST: borra cookies de sesión (admin_session y admin_key legacy) y        │
 * │         redirige con 303 a /admin/login.                                    │
 * │ - Ventaja: sin 405 ni conflictos entre page.tsx y route.ts.                 │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  APP_SESSION_COOKIE,
  clearSessionCookie,
  clearViewAsRoleCookie,
  destroyUserSessionByCookie,
} from "@/lib/account-auth/session";
import { allowsSupabaseAuth } from "@/lib/account-auth/mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function redirectUrl(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}

// GET: mini HTML que auto-postea (y con <noscript> para fallback)
export async function GET() {
  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <title>Cerrando sesión…</title>
    <meta name="robots" content="noindex,nofollow">
  </head>
  <body style="font-family: ui-sans-serif, system-ui; max-width: 640px; margin: 4rem auto; padding: 0 1rem;">
    <h1 style="font-size: 1.25rem; margin: 0 0 .5rem;">Cerrando sesión…</h1>
    <p style="color:#666; margin: 0 0 1rem;">Un segundo, estamos cerrando tu sesión de administrador.</p>

    <form id="logout-form" method="POST" action="/admin/logout">
      <input type="hidden" name="bye" value="1">
    </form>

    <script>
      (function () {
        var f = document.getElementById('logout-form');
        if (f) f.submit();
      })();
    </script>

    <noscript>
      <form method="POST" action="/admin/logout">
        <button type="submit" style="padding:.6rem 1rem;border:1px solid #ddd;border-radius:.5rem;background:#f6f6f6;">
          Cerrar sesión ahora
        </button>
      </form>
    </noscript>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// POST: borra cookies y redirige al login
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(redirectUrl(req, "/admin/login"), {
    status: 303,
  });
  const c = await cookies();
  const rawSession = c.get(APP_SESSION_COOKIE)?.value;

  await destroyUserSessionByCookie(rawSession);
  await clearSessionCookie();
  await clearViewAsRoleCookie();
  if (allowsSupabaseAuth()) {
    const client = await createSupabaseServerClient();
    if (client) await client.auth.signOut();
  }

  // Token firmado (HMAC)
  c.set("admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  // Legacy (por si aún existiera)
  c.set("admin_key", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return res;
}
