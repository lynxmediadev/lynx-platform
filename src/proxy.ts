// src/proxy.ts
/**
 * Middleware de auth/roles:
 * - /admin/** => ADMIN o STAFF (fallback legacy temporal permitido).
 * - /creator/** => CREATOR.
 */
import { NextRequest, NextResponse } from "next/server";

export const config = { matcher: ["/admin/:path*", "/creator/:path*"] };

function tenc(s: string) {
  return new TextEncoder().encode(s);
}
function b64uToU8(b64url: string): Uint8Array {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function hmacRaw(key: string, msg: string) {
  const k = await crypto.subtle.importKey(
    "raw",
    tenc(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", k, tenc(msg));
  return new Uint8Array(sig);
}
function tse(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    x |= ai ^ bi;
  }
  return x === 0;
}
async function sha256hex(s: string) {
  const d = await crypto.subtle.digest("SHA-256", tenc(s));
  return Array.from(new Uint8Array(d))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const viewAsRole = (req.cookies.get("app_view_as_role")?.value ?? "")
    .trim()
    .toUpperCase();
  const isViewAsCreator = viewAsRole === "CREATOR";

  // Rutas abiertas del flujo de auth
  if (
    pathname === "/admin/login" ||
    pathname === "/admin/login/submit" ||
    pathname === "/admin/logout" ||
    pathname === "/admin/view-as"
  ) {
    return NextResponse.next();
  }

  const AUTH_SECRET =
    (process.env.AUTH_SESSION_SECRET ?? "").trim() ||
    (process.env.ADMIN_SESSION_SECRET ?? "").trim();
  const LEGACY_SECRET = (process.env.ADMIN_SESSION_SECRET ?? "").trim();
  const BIND_UA = (process.env.ADMIN_BIND_UA ?? "") === "1";
  const ALLOW_LEGACY = (process.env.ADMIN_ALLOW_LEGACY ?? "") === "1";
  const EXPECTED_LEGACY =
    (process.env.ADMIN_ACCESS_KEY ?? "").trim() ||
    (process.env.ADMIN_PASS ?? "").trim();
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  const isCreatorArea =
    pathname === "/creator" || pathname.startsWith("/creator/");

  // 1) Validar sesión nueva (app_session: v2.payload.sig)
  const appToken = (req.cookies.get("app_session")?.value ?? "").trim();
  if (AUTH_SECRET && appToken) {
    try {
      const [v, payloadB64, sigB64] = appToken.split(".");
      if (v === "v2" && payloadB64 && sigB64) {
        const expSig = await hmacRaw(AUTH_SECRET, payloadB64);
        const gotSig = b64uToU8(sigB64);
        if (tse(expSig, gotSig)) {
          const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
          const p = JSON.parse(json) as {
            sub?: string;
            role?: string;
            exp?: number;
          };
          if (
            p?.sub &&
            p?.role &&
            typeof p.exp === "number" &&
            Date.now() < p.exp
          ) {
            if (isAdminArea && (p.role === "ADMIN" || p.role === "STAFF")) {
              if (p.role === "ADMIN" && isViewAsCreator) {
                return NextResponse.redirect(new URL("/creator", req.url), {
                  status: 303,
                });
              }
              return NextResponse.next();
            }
            if (
              isCreatorArea &&
              (p.role === "CREATOR" || (p.role === "ADMIN" && isViewAsCreator))
            ) {
              return NextResponse.next();
            }
          }
        }
      }
    } catch {
      // seguimos a fallback
    }
  }

  // 2) Legacy temporal solo para /admin
  if (isAdminArea && LEGACY_SECRET) {
    const token = (req.cookies.get("admin_session")?.value ?? "").trim();
    if (token) {
      try {
        const [v, payloadB64, sigB64] = token.split(".");
        if (v === "v1" && payloadB64 && sigB64) {
          const expSig = await hmacRaw(LEGACY_SECRET, payloadB64);
          const gotSig = b64uToU8(sigB64);
          if (tse(expSig, gotSig)) {
            const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
            const p = JSON.parse(json) as {
              sub?: string;
              exp?: number;
              ua?: string;
            };
            if (
              p?.sub === "admin" &&
              typeof p.exp === "number" &&
              Date.now() < p.exp
            ) {
              if (BIND_UA && p.ua) {
                const ua = req.headers.get("user-agent") || "";
                const h = await sha256hex(ua);
                if (h !== p.ua) {
                  return NextResponse.redirect(
                    new URL("/admin/login", req.url),
                    { status: 303 },
                  );
                }
              }
              return NextResponse.next();
            }
          }
        }
      } catch {
        // no-op
      }
    }
  }

  // 3) Legacy cookie admin_key solo para /admin y solo si está permitido
  if (isAdminArea && ALLOW_LEGACY && EXPECTED_LEGACY) {
    const legacy = (req.cookies.get("admin_key")?.value ?? "").trim();
    if (legacy === EXPECTED_LEGACY) {
      return NextResponse.next();
    }
  }

  // 4) No autenticado => redirigir a login correcto
  if (isCreatorArea) {
    const to = new URL("/auth/login", req.url);
    to.searchParams.set("next", pathname);
    return NextResponse.redirect(to, { status: 303 });
  }

  return NextResponse.redirect(new URL("/admin/login", req.url), {
    status: 303,
  });
}
