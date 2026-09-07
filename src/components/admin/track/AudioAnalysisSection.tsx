import PublicAudioBar from "@/components/public/PublicAudioBar";
import { formatBytes } from "@/lib/format";
import { resolvePublicTrackAudio } from "@/lib/storage/public-track-audio";
import { getTrackAudioModule } from "@/server/track-edit/queries";

type AudioAnalysisSectionProps = {
  trackId: string;
  isrc: string | null;
  iswc: string | null;
  licenseType: string | null;
  composerName: string | null;
};

function bytesToBase64(buf: Buffer | Uint8Array | null): string | null {
  if (!buf) return null;
  return Buffer.from(buf).toString("base64");
}

export default async function AudioAnalysisSection({
  trackId,
  isrc,
  iswc,
  licenseType,
  composerName,
}: AudioAnalysisSectionProps) {
  const trackAudio = await getTrackAudioModule(trackId);
  if (!trackAudio) {
    return (
      <section className="space-y-4">
        <div className="rounded-xl border border-border bg-card/80 p-4 text-xs text-warning">
          No se pudo cargar el modulo de audio para este track.
        </div>
      </section>
    );
  }

  const publicSrc = resolvePublicTrackAudio(trackAudio) || null;

  const waveformB64 = trackAudio.waveform
    ? bytesToBase64(trackAudio.waveform as any)
    : null;

  const techHasAnalysis =
    trackAudio.loudnessLufs !== null ||
    trackAudio.loudnessRangeLu !== null ||
    trackAudio.truePeakDbfs !== null ||
    trackAudio.analysisAt !== null;

  return (
    <section className="space-y-4">
      <div className="space-y-3 rounded-xl border border-border bg-card/80 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Audio &amp; analisis tecnico
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Player con waveform y datos tecnicos base del archivo
              (duracion, sample rate, canales, bitrate).
            </p>
          </div>
        </div>

        {publicSrc ? (
          <PublicAudioBar
            src={publicSrc}
            waveformB64={waveformB64}
            durationSec={trackAudio.durationSec ?? undefined}
          />
        ) : (
          <p className="rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
            No hay audio asociado a este track. Sube un archivo desde la
            seccion de creacion o analisis.
          </p>
        )}

        <div className="grid gap-2 rounded-lg border border-border bg-card/90 p-3 text-xs text-foreground md:grid-cols-4">
          <div className="rounded-md border border-border bg-muted/60 p-2">
            <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
              ISRC
            </div>
            <div className="">{(isrc ?? "—").trim().toUpperCase()}</div>
          </div>

          <div className="rounded-md border border-border bg-muted/60 p-2">
            <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
              ISWC
            </div>
            <div className="">{(iswc ?? "—").trim().toUpperCase()}</div>
          </div>
          <div className="rounded-md border border-border bg-muted/60 p-2">
            <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
              TIPO DE LICENCIA
            </div>
            <div className="">{(licenseType ?? "—").trim().toUpperCase()}</div>
          </div>
          <div className="rounded-md border border-border bg-muted/60 p-2">
            <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
              COMPOSITOR
            </div>
            <div className="">{(composerName ?? "—").trim().toUpperCase()}</div>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card/80 p-4 text-xs text-foreground/80">
        <h2 className="text-sm font-semibold text-foreground">Resumen tecnico</h2>

        {techHasAnalysis ? (
          <dl className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <div>
              <dt className="text-[11px] font-black text-muted-foreground">
                Loudness (I)
              </dt>
              <dd className="font-mono text-xs">
                {typeof trackAudio.loudnessLufs === "number"
                  ? `${trackAudio.loudnessLufs.toFixed(2)} LUFS`
                  : "–"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-black text-muted-foreground">
                Loudness Range
              </dt>
              <dd className="font-mono text-xs">
                {typeof trackAudio.loudnessRangeLu === "number"
                  ? `${trackAudio.loudnessRangeLu.toFixed(2)} LU`
                  : "–"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-black text-muted-foreground">
                True Peak
              </dt>
              <dd className="font-mono text-xs">
                {typeof trackAudio.truePeakDbfs === "number"
                  ? `${trackAudio.truePeakDbfs.toFixed(2)} dBFS`
                  : "–"}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-black text-muted-foreground">
                Duracion
              </dt>
              <dd className="font-mono text-xs">
                {typeof trackAudio.durationSec === "number"
                  ? `${trackAudio.durationSec.toFixed(2)} s`
                  : "–"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-black text-muted-foreground">
                Sample Rate
              </dt>
              <dd className="font-mono text-xs">
                {typeof trackAudio.sampleRateHz === "number"
                  ? `${trackAudio.sampleRateHz.toFixed(2)} Hz`
                  : "–"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-black text-muted-foreground">
                Bitrate
              </dt>
              <dd className="font-mono text-xs">
                {typeof trackAudio.bitrateKbps === "number"
                  ? `${trackAudio.bitrateKbps.toFixed(2)} kbps`
                  : "–"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-black text-muted-foreground">
                Ultimo analisis
              </dt>
              <dd className="font-mono text-[11px]">
                {trackAudio.analysisAt
                  ? new Date(trackAudio.analysisAt).toLocaleString()
                  : "–"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Aun no se ha realizado analisis tecnico para este track. Usa el
            boton <span className="font-semibold text-foreground">\"Analizar\"</span>{" "}
            en el header superior para generar metricas de loudness (LUFS),
            rango (LRA) y True Peak.
          </p>
        )}

        <div className="pt-1 text-[11px]">
          <div className="text-[11px] font-black text-muted-foreground">Asset</div>
          {publicSrc ? (
            <div className="flex flex-col gap-1">
              <a
                href={publicSrc ?? "#"}
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono text-[11px] text-success underline underline-offset-2"
              >
                Abrir audio
              </a>
              <span className="text-muted-foreground">
                {trackAudio.assetKey ? "R2" : "URL externa"} ·{" "}
                {trackAudio.assetMime ?? "mime —"} ·{" "}
                {trackAudio.assetSize != null ? formatBytes(trackAudio.assetSize) : "size —"}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">Sin audio</span>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          El detalle completo del analisis se muestra en este panel tras
          ejecutar \"Analizar\".
        </p>
      </div>
    </section>
  );
}
