import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MeasurementInput } from '../domain/measurement';
import { createMeasurementRepository, type MeasurementRepository } from './db';

const repositories: MeasurementRepository[] = [];

function repository(name = `sugar-test-${crypto.randomUUID()}`): MeasurementRepository {
  const repo = createMeasurementRepository(name);
  repositories.push(repo);
  return repo;
}

function input(measuredAt: number, value = 5.6): MeasurementInput {
  return { type: 'fasting', value, measuredAt };
}

afterEach(() => {
  for (const repo of repositories.splice(0)) repo.close();
  vi.unstubAllGlobals();
});

describe('IndexedDB measurement repository', () => {
  it('сохраняет и возвращает записи по убыванию timestamp', async () => {
    const repo = repository();
    await repo.saveMeasurement(input(100));
    await repo.saveMeasurement(input(300, 6.2));
    await repo.saveMeasurement(input(200, 5.8));

    const result = await repo.listMeasurements();
    expect(result.map(({ measuredAt }) => measuredAt)).toEqual([300, 200, 100]);
    expect(result[0]?.value).toBe(6.2);
  });

  it('сохраняет данные при новом подключении к той же базе', async () => {
    const name = `sugar-test-${crypto.randomUUID()}`;
    const first = repository(name);
    const saved = await first.saveMeasurement(input(123456789, 7.4));
    first.close();

    const reopened = repository(name);
    expect(await reopened.listMeasurements()).toEqual([saved]);
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved.measuredAt).toBe(123456789);
  });

  it('создаёт независимые записи и удаляет только выбранную', async () => {
    const repo = repository();
    const first = await repo.saveMeasurement(input(100));
    const second = await repo.saveMeasurement(input(100));

    expect(first.id).not.toBe(second.id);
    await repo.deleteMeasurement(first.id);
    expect((await repo.listMeasurements()).map(({ id }) => id)).toEqual([second.id]);
  });

  it('не падает при удалении несуществующего id', async () => {
    const repo = repository();
    await expect(repo.deleteMeasurement('missing')).resolves.toBeUndefined();
  });

  it('сообщает понятную ошибку, если IndexedDB недоступна', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const repo = repository();
    await expect(repo.listMeasurements()).rejects.toThrow('IndexedDB недоступна');
  });
});
