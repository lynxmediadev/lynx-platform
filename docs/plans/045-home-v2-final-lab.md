# 045 - Home V2 Final Lab: 4 Elegidas + 6 Nuevas Opciones

> Nota vigente: este plan queda como antecedente historico. La ronda activa fue ampliada por `docs/plans/046-home-v2-options-11-20.md`.

## Objetivo

- Conservar las opciones elegidas por el usuario y reordenarlas por preferencia.
- Crear una ultima ronda de 6 opciones nuevas mas atrevidas, diferentes entre si y alineadas con catalogo, assets digitales, licencias, merch y servicios.
- Mantener el laboratorio en una pantalla por opcion.

## Cambios implementados

- `/` ahora renderiza 10 opciones:
  - Opcion 1: antigua 6/10 (`HomeVariantEditorialWall`).
  - Opcion 2: antigua 2/10 (`HomeVariantTen`).
  - Opcion 3: antigua 10/10 (`HomeVariantOdrIndex`).
  - Opcion 4: antigua 1/10 (`HomeVariantThree`).
  - Opciones 5-10: nueva ronda atrevida.
- Las variantes descartadas se mantienen en codigo, pero fuera del explorer activo.
- `/dev/home-archive/saved-1` se mantiene como archivo visual independiente.

## Nuevas opciones activas

- `HomeVariantDropLedger`: ledger/recibo comercial con assets como lineas de compra.
- `HomeVariantSoundMuseum`: galeria de objetos premium para assets, merch y servicios.
- `HomeVariantSplitDecision`: home dividido por intencion de usuario.
- `HomeVariantSearchMonolith`: buscador brutalista gigante como entrada principal.
- `HomeVariantSignalBoard`: tablero de senales tipo sistema/terminal.
- `HomeVariantAssetCircuit`: mapa de ecosistema con nodos conectados.

## Validacion

- [x] `npm run typecheck`
- [x] Smoke test `/`
- [x] Smoke test `/dev/home-archive/saved-1`
- [x] Smoke test `/about-us`
- [x] Smoke test `/catalog`

## Registro de avances

- 2026-05-31
  - Fase completada: implementacion visual, reordenamiento y documentacion.
  - Archivos tocados:
    - `src/components/home-v2/HomeVariantExplorer.tsx`
    - `src/components/home-v2/HomeVariantDropLedger.tsx`
    - `src/components/home-v2/HomeVariantSoundMuseum.tsx`
    - `src/components/home-v2/HomeVariantSplitDecision.tsx`
    - `src/components/home-v2/HomeVariantSearchMonolith.tsx`
    - `src/components/home-v2/HomeVariantSignalBoard.tsx`
    - `src/components/home-v2/HomeVariantAssetCircuit.tsx`
    - `docs/PROJECT_GENERAL_CONTEXT.md`
    - `docs/context/COMPONENT_INVENTORY.md`
    - `docs/plans/044-home-v2-curated-lab.md`
  - Validacion ejecutada:
    - `npm run typecheck` OK.
    - Smoke test HTTP OK en `/`, `/dev/home-archive/saved-1`, `/about-us`, `/catalog`.
  - Estado: completado.
