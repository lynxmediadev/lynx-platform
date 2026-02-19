import { config as loadEnv } from "dotenv";
import { PrismaClient, TicketSeverity, TicketSource, TicketStatus } from "@prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const db = new PrismaClient();

function pick<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)] as T;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHash(size = 12) {
  const chars = "abcdef0123456789";
  let out = "";
  for (let i = 0; i < size; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)] as string;
  }
  return out;
}

const summaries = [
  "404 al abrir track desde listado",
  "Error al guardar cambios en metadata",
  "Vista mobile corta texto en columna",
  "Timeout al cargar requests",
  "Tooltip bloquea click en boton",
  "No aparece resultado al filtrar",
  "Boton de accion queda deshabilitado",
  "Sidebar no marca ruta activa",
  "Formulario no valida campo obligatorio",
  "Estado no se actualiza en tabla",
  "Copy to clipboard falla en mobile",
  "Pagina de detalle no carga assets",
  "Error intermitente en dashboard",
  "Redireccion incorrecta luego de login",
  "No se persiste selector de filtros",
  "Mensaje de exito no desaparece",
  "Modal de contacto no cierra",
  "Paginacion repite registros",
  "Badge de estado no coincide",
  "Issue de accesibilidad con teclado",
];

const details = [
  "Pasos: abrir lista, entrar al item y volver. Resultado actual: 404. Resultado esperado: abrir detalle correctamente.",
  "Al guardar en modulo creativo devuelve error visual. Se reproduce en desktop y mobile.",
  "En iPhone 13 el texto se corta y no se puede leer el estado completo.",
  "Con filtros activos, la consulta demora mas de 8 segundos y vence timeout.",
  "El tooltip queda sobre el boton y bloquea el click directo del usuario.",
  "Al buscar por nombre exacto devuelve vacio, pero el registro existe en DB.",
  "El boton cambia a loading y no vuelve a estado normal hasta recargar.",
  "Ruta /admin/tracks/:id/edit no deja activo el item de sidebar esperado.",
  "Se envia form sin nombre en alta rapida cuando no deberia permitirlo.",
  "Bulk action responde 200 pero la tabla no refresca con el nuevo estado.",
  "Copiar ID en Android Chrome no muestra confirmacion y no copia valor.",
  "Detalle de request muestra placeholders porque no carga payload asociado.",
  "Dashboard muestra pantalla en blanco por 1 segundo al cambiar de pestaña.",
  "Luego de login STAFF redirige a /admin/tracks en vez de /admin.",
  "El valor de estado en filtro vuelve a TODOS tras cambiar de pagina.",
  "Toast de exito queda persistente y tapa acciones de cabecera.",
  "Desde 404 se abre modal, se envia ticket y no se cierra automaticamente.",
  "Pagina 2 muestra registros de pagina 1 en contratos.",
  "Badge dice RESOLVED pero fila indica OPEN en el mismo registro.",
  "Con tabulacion no se alcanza el boton principal de accion en modal.",
];

const pageUrls = [
  "http://localhost:3000/admin/tracks",
  "http://localhost:3000/admin/requests",
  "http://localhost:3000/admin/users",
  "http://localhost:3000/admin/playlists",
  "http://localhost:3000/admin/contracts",
  "http://localhost:3000/admin/tickets",
  "http://localhost:3000/admin/track/cmkx1ed3f000duq9glemziy2b/edit",
  "http://localhost:3000/catalog",
  "http://localhost:3000/auth/login",
  "http://localhost:3000/auth/register",
];

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 Version/17.6 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
  "Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0",
];

async function main() {
  const users = await db.user.findMany({
    select: { id: true, email: true },
    take: 30,
    orderBy: { createdAt: "desc" },
  });

  const statuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "SPAM"];
  const severities: TicketSeverity[] = ["LOW", "MEDIUM", "HIGH"];
  const sources: TicketSource[] = ["NOT_FOUND", "ERROR_PAGE", "MANUAL"];

  const now = Date.now();
  const rows = Array.from({ length: 20 }).map((_, idx) => {
    const status = pick(statuses);
    const severity = pick(severities);
    const source = pick(sources);
    const reporter = users.length > 0 ? pick(users) : null;
    const createdOffsetMinutes = randInt(10, 60 * 24 * 15);
    const createdAt = new Date(now - createdOffsetMinutes * 60_000);
    const updatedAt = new Date(createdAt.getTime() + randInt(1, 360) * 60_000);

    const isResolved = status === "RESOLVED" || status === "SPAM";

    return {
      summary: summaries[idx % summaries.length] as string,
      details: details[idx % details.length] as string,
      status,
      severity,
      source,
      pageUrl: pick(pageUrls),
      email: reporter?.email ?? `dummy${idx + 1}@example.com`,
      reporterUserId: reporter?.id ?? null,
      userAgent: pick(userAgents),
      ipHash: randomHash(64),
      createdAt,
      updatedAt,
      resolvedAt: isResolved ? new Date(updatedAt.getTime() + randInt(1, 90) * 60_000) : null,
      resolvedByUserId: isResolved && users.length > 0 ? pick(users).id : null,
      meta: {
        seed: true,
        batch: "seed.tickets.v1",
        errorDigest: `TICKET-${randomHash(10)}`,
        viewport: pick(["375x812", "390x844", "1366x768", "1920x1080"]),
        build: `dev-${randomHash(7)}`,
      },
    };
  });

  await db.supportTicket.createMany({ data: rows });

  console.log(`[seed:tickets] inserted ${rows.length} support tickets`);
}

main()
  .catch((error) => {
    console.error("[seed:tickets] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
