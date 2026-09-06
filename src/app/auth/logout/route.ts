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
    <p style="color:#666; margin: 0 0 1rem;">Un segundo, estamos cerrando tu sesión.</p>

    <form id="logout-form" method="POST" action="/auth/logout">
      <input type="hidden" name="bye" value="1">
    </form>

    <script>
      (function () {
        var f = document.getElementById('logout-form');
        if (f) f.submit();
      })();
    </script>

    <noscript>
      <form method="POST" action="/auth/logout">
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

export async function POST(req: NextRequest) {
  const c = await cookies();
  const rawSession = c.get(APP_SESSION_COOKIE)?.value;

  await destroyUserSessionByCookie(rawSession);
  await clearSessionCookie();
  await clearViewAsRoleCookie();
  if (allowsSupabaseAuth()) {
    const client = await createSupabaseServerClient();
    if (client) await client.auth.signOut();
  }

  return NextResponse.redirect(redirectUrl(req, "/auth/login"), {
    status: 303,
  });
}
