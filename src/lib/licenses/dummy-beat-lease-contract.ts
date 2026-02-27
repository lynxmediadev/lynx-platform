type ContractInput = {
  licenseName: string;
  beatTitle: string;
  producerName: string;
  artistName: string;
  priceLabel: string;
  currencyLabel: string;
};

export function buildDummyBeatLeaseContract(input: ContractInput): string {
  const {
    licenseName,
    beatTitle,
    producerName,
    artistName,
    priceLabel,
    currencyLabel,
  } = input;

  return [
    "CONTRATO ESTÁNDAR DE LICENCIA DE BEAT (DUMMY PARA QA)",
    "",
    `Licencia: ${licenseName}`,
    `Beat: ${beatTitle}`,
    `Productor / Licenciante: ${producerName}`,
    `Artista / Licenciatario: ${artistName}`,
    `Tarifa referencial: ${priceLabel} (${currencyLabel})`,
    "",
    "1. OBJETO",
    "El Productor concede al Licenciatario una licencia de uso del beat identificado arriba,",
    "sin transferir titularidad de master ni publishing, salvo cláusula expresa en contrario.",
    "",
    "2. ALCANCE DE USO",
    "El Licenciatario podrá explotar la obra conforme a los límites específicos de la licencia",
    "seleccionada (copias, streams, videos, presentaciones y broadcasting).",
    "",
    "3. RESTRICCIONES",
    "- No se permite revender, relicenciar o sub-licenciar el beat como archivo aislado.",
    "- No se permite reclamar Content ID sobre el instrumental completo sin autorización.",
    "- No se permite uso difamatorio, ilícito o que vulnere derechos de terceros.",
    "",
    "4. CRÉDITOS",
    "El Licenciatario deberá acreditar al Productor como “Prod. by ...” en metadata y/o",
    "descripciones públicas cuando la plataforma lo permita.",
    "",
    "5. VIGENCIA Y RENOVACIÓN",
    "La licencia mantiene vigencia según su plan comercial y límites de explotación.",
    "Al alcanzar un límite, el Licenciatario debe renovar o escalar a una licencia superior.",
    "",
    "6. INCUMPLIMIENTO",
    "El incumplimiento de límites o restricciones faculta al Productor a revocar la licencia",
    "y exigir retiro de contenidos y/o compensación conforme a derecho.",
    "",
    "7. LEY APLICABLE",
    "Este documento es una plantilla dummy para pruebas de producto y no reemplaza asesoría legal.",
  ].join("\n");
}
