import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Measurement, MeasurementInput } from '../domain/measurement';

interface SugarDatabase extends DBSchema {
  measurements: {
    key: string;
    value: Measurement;
    indexes: { measuredAt: number };
  };
}

export interface MeasurementRepository {
  listMeasurements(): Promise<Measurement[]>;
  saveMeasurement(input: MeasurementInput): Promise<Measurement>;
  deleteMeasurement(id: string): Promise<void>;
  close(): void;
}

export function createMeasurementRepository(databaseName = 'sugar-diary'): MeasurementRepository {
  let databasePromise: Promise<IDBPDatabase<SugarDatabase>> | null = null;

  function getDatabase(): Promise<IDBPDatabase<SugarDatabase>> {
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB недоступна в этом браузере'));
    }

    databasePromise ??= openDB<SugarDatabase>(databaseName, 1, {
      upgrade(database) {
        const store = database.createObjectStore('measurements', { keyPath: 'id' });
        store.createIndex('measuredAt', 'measuredAt');
      },
    });
    return databasePromise;
  }

  return {
    async listMeasurements() {
      const database = await getDatabase();
      const items = await database.getAllFromIndex('measurements', 'measuredAt');
      return items.reverse();
    },

    async saveMeasurement(input) {
      const measurement: Measurement = { ...input, id: crypto.randomUUID() };
      const database = await getDatabase();
      await database.add('measurements', measurement);
      return measurement;
    },

    async deleteMeasurement(id) {
      const database = await getDatabase();
      await database.delete('measurements', id);
    },

    close() {
      if (!databasePromise) return;
      void databasePromise.then((database) => database.close());
      databasePromise = null;
    },
  };
}

export const defaultRepository = createMeasurementRepository();

export function listMeasurements(): Promise<Measurement[]> {
  return defaultRepository.listMeasurements();
}

export function saveMeasurement(input: MeasurementInput): Promise<Measurement> {
  return defaultRepository.saveMeasurement(input);
}

export function deleteMeasurement(id: string): Promise<void> {
  return defaultRepository.deleteMeasurement(id);
}
