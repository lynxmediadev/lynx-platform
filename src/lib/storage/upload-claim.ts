import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { TRACK_ASSET_TYPES } from "./asset-policy";

const schema = z.object({ key: z.string().min(1), bucket: z.enum(["PREVIEWS", "PRIVATE"]), assetType: z.enum(TRACK_ASSET_TYPES), mime: z.string().min(1), size: z.number().int().positive(), originalFilename: z.string().min(1).max(180).optional(), label: z.string().max(120).optional(), actorId: z.string().nullable(), trackId: z.string().nullable(), exp: z.number().int().positive() });
export type UploadClaim = z.infer<typeof schema>;
const secret = () => (process.env.ASSET_UPLOAD_SIGNING_SECRET ?? process.env.AUTH_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? "").trim();
export const hasUploadClaimSecret = () => secret().length >= 32;
export function signUploadClaim(claim: UploadClaim) {
  if (!hasUploadClaimSecret()) throw new Error("ASSET_UPLOAD_SIGNING_SECRET no configurado");
  const payload = Buffer.from(JSON.stringify(claim)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("base64url")}`;
}
export function verifyUploadClaim(token: string): UploadClaim | null {
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied || !hasUploadClaimSecret()) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest();
  const suppliedBuffer = Buffer.from(supplied, "base64url");
  if (expected.length !== suppliedBuffer.length || !timingSafeEqual(expected, suppliedBuffer)) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    return parsed.success && parsed.data.exp >= Math.floor(Date.now() / 1000) ? parsed.data : null;
  } catch { return null; }
}
