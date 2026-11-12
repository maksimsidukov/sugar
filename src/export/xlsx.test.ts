import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { toLocalDateKey } from '../domain/date-range';
import type { Measurement } from '../domain/measurement';
import { buildReportWorkbook, exportMeasurements } from './xlsx';

const generatedAt = new Date(2026, 10, 12, 15, 30).getTime();
const inside = new Date(2026, 10, 12, 8, 5).getTime();
const later = new Date(2026, 10, 12, 10, 20).getTime();
const outside = new Date(2026, 9, 20, 9).getTime();

function item(id: string, type: Measurement['type'], value: number, measuredAt: number): Measurement {
  return { id, type, value, measuredAt };
}

const filter = { all: false, ranges: [{ start: '2026-11-12', end: '2026-11-12' }] };
const items = [
  item('later', 'after-1h', 7.2, later),
  item('outside', 'fasting', 6.6, outside),
  item('inside', 'fasting', 5.6, inside),
];

describe('XLSX-отчёт', () => {
  it('содержит только выбранные записи в хронологическом порядке и настройки печати', async () => {
    const workbook = await buildReportWorkbook(items, filter, generatedAt);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(['Измерения', 'Сводка']);

    const sheet = workbook.getWorksheet('Измерения')!;
    expect(sheet.getCell('A1').value).toBe('Дневник сахара в крови');
    expect(sheet.getRow(5).values).toEqual([undefined, 'Дата', 'Время', 'Тип', 'Сахар (ммоль/л)']);
    expect(sheet.getCell('C6').value).toBe('Натощак');
    expect(sheet.getCell('D6').value).toBe(5.6);
    expect(sheet.getCell('D6').numFmt).toBe('0.0');
    expect(sheet.getCell('C7').value).toBe('1 ч после еды');
    expect(sheet.getCell('D7').value).toBe(7.2);
    expect(sheet.getRow(8).values).toHaveLength(0);
    expect(sheet.getCell('A6').numFmt).toBe('DD.MM.YYYY');
    expect(sheet.getCell('B6').numFmt).toBe('HH:mm');
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 5 });
    expect(sheet.autoFilter).toMatchObject({ from: { row: 5, column: 1 }, to: { row: 5, column: 4 } });
    expect(sheet.pageSetup).toMatchObject({
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: '5:5',
    });

    const summary = workbook.getWorksheet('Сводка')!;
    expect(summary.getCell('B3').value).toBe(2);
    expect(summary.getCell('B6').value).toBe(1);
    expect(summary.getCell('C6').value).toBe(5.6);
    expect(summary.getCell('C8').value).toBe('—');
  });

  it('создаёт валидный XLSX и сохраняет локальные дату и время после roundtrip', async () => {
    const result = await exportMeasurements(items, filter, generatedAt);
    expect(result.filename).toBe('sugar-report-2026-11-12.xlsx');
    expect(result.blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await result.blob.arrayBuffer());
    const sheet = workbook.getWorksheet('Измерения')!;
    const date = sheet.getCell('A6').value as Date;
    const time = sheet.getCell('B6').value as Date;
    expect(date).toBeInstanceOf(Date);
    expect(toLocalDateKey(date.getTime())).toBe('2026-11-12');
    expect(time.getHours()).toBe(8);
    expect(time.getMinutes()).toBe(5);
  });

  it('остаётся читаемым для пустого периода без NaN', async () => {
    const workbook = await buildReportWorkbook(items, { all: false, ranges: [] }, generatedAt);
    const sheet = workbook.getWorksheet('Измерения')!;
    const summary = workbook.getWorksheet('Сводка')!;
    expect(sheet.getRow(5).values).toEqual([undefined, 'Дата', 'Время', 'Тип', 'Сахар (ммоль/л)']);
    expect(sheet.getRow(6).values).toHaveLength(0);
    expect(summary.getCell('B3').value).toBe(0);
    expect(summary.getCell('B6').value).toBe(0);
    expect(summary.getCell('C6').value).toBe('—');
    expect([6, 7, 8].map((row) => summary.getCell(`C${row}`).value)).toEqual(['—', '—', '—']);
  });
});
