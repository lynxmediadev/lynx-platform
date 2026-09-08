export type DeleteTrackAssetResult =
  | { ok: true; alreadyDeleted: boolean }
  | {
      ok: false;
      phase: "storage" | "database";
      recordMarkedMissing: boolean;
    };

/**
 * El objeto se elimina antes que el registro para no dejar un archivo privado
 * sin rastreo. Si PostgreSQL falla después, el registro se marca MISSING para
 * que el estado parcial sea visible y reintentable.
 */
export async function deleteTrackAssetStorageAndRecord(input: {
  deleteObject: () => Promise<void>;
  deleteRecord: () => Promise<number>;
  markRecordMissing: () => Promise<void>;
}): Promise<DeleteTrackAssetResult> {
  try {
    await input.deleteObject();
  } catch {
    return {
      ok: false,
      phase: "storage",
      recordMarkedMissing: false,
    };
  }

  try {
    const deletedCount = await input.deleteRecord();
    return { ok: true, alreadyDeleted: deletedCount === 0 };
  } catch {
    let recordMarkedMissing = false;
    try {
      await input.markRecordMissing();
      recordMarkedMissing = true;
    } catch {
      // El resultado conserva el fallo; la ruta no lo oculta al cliente.
    }
    return { ok: false, phase: "database", recordMarkedMissing };
  }
}
