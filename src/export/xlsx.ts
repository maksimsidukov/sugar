import type ExcelJS from 'exceljs';
import { describeFilter, filterMeasurements, toLocalDateKey, type DateFilter } from '../domain/date-range';
import { MEASUREMENT_TYPES, type Measurement, type MeasurementType } from '../domain/measurement';
import { sortMeasurements, summarize } from '../domain/stats';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface ExportedReport {
  filename: string;
  blob: Blob;
}

async function createWorkbook(): Promise<ExcelJS.Workbook> {
  const ExcelJSModule = (await import('exceljs')).default;
  return new ExcelJSModule.Workbook();
}

export async function buildReportWorkbook(
  items: Measurement[],
  filter: DateFilter,
  generatedAt: number,
): Promise<ExcelJS.Workbook> {
  const workbook = await createWorkbook();
  workbook.creator = 'Сахар — дневник глюкозы';
  workbook.lastModifiedBy = 'Сахар — дневник глюкозы';
  workbook.created = new Date(generatedAt);
  workbook.modified = new Date(generatedAt);

  const filtered = sortMeasurements(filterMeasurements(items, filter), 'asc');
  const summary = summarize(filtered);
  const sheet = workbook.addWorksheet('Измерения', {
    views: [{ state: 'frozen', ySplit: 5 }],
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      printTitlesRow: '5:5',
      margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  sheet.columns = [
    { width: 15 },
    { width: 12 },
    { width: 25 },
    { width: 21 },
  ];
  sheet.mergeCells('A1:D1');
  sheet.getCell('A1').value = 'Дневник сахара в крови';
  sheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF173E35' } };
  sheet.getRow(1).height = 30;
  sheet.getCell('A2').value = 'Период';
  sheet.mergeCells('B2:D2');
  sheet.getCell('B2').value = describeFilter(filter);
  sheet.getCell('A3').value = 'Сформирован';
  sheet.mergeCells('B3:D3');
  sheet.getCell('B3').value = formatGeneratedAt(generatedAt);
  sheet.getCell('A2').font = sheet.getCell('A3').font = { bold: true, color: { argb: 'FF5E6B67' } };
  sheet.getRow(4).height = 10;

  const header = sheet.getRow(5);
  header.values = ['Дата', 'Время', 'Тип', 'Сахар (ммоль/л)'];
  header.height = 24;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF176B5B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF0F5145' } } };
  });
  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 4 } };

  filtered.forEach((item, index) => {
    const row = sheet.getRow(index + 6);
    row.values = [new Date(item.measuredAt), new Date(item.measuredAt), MEASUREMENT_TYPES[item.type].label, item.value];
    row.getCell(1).numFmt = 'DD.MM.YYYY';
    row.getCell(2).numFmt = 'HH:mm';
    row.getCell(4).numFmt = '0.0';
    row.getCell(4).alignment = { horizontal: 'center' };
    row.height = 21;
    if (index % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F0' } };
      });
    }
  });

  sheet.pageSetup.printArea = `A1:D${Math.max(5, filtered.length + 5)}`;
  sheet.headerFooter.oddFooter = '&CСтраница &P из &N';
  addSummarySheet(workbook, summary, generatedAt);
  return workbook;
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  summary: ReturnType<typeof summarize>,
  generatedAt: number,
): void {
  const sheet = workbook.addWorksheet('Сводка', {
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.2, footer: 0.2 },
    },
  });
  sheet.columns = [{ width: 27 }, { width: 18 }, { width: 23 }];
  sheet.mergeCells('A1:C1');
  sheet.getCell('A1').value = 'Сводка';
  sheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF173E35' } };
  sheet.getCell('A2').value = 'Сформирована';
  sheet.getCell('B2').value = formatGeneratedAt(generatedAt);
  sheet.getCell('A3').value = 'Всего измерений';
  sheet.getCell('A3').font = { bold: true };
  sheet.getCell('B3').value = summary.total;

  const header = sheet.getRow(5);
  header.values = ['Тип', 'Количество', 'Среднее (ммоль/л)'];
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF176B5B' } };
    cell.alignment = { horizontal: 'center' };
  });

  (Object.keys(MEASUREMENT_TYPES) as MeasurementType[]).forEach((type, index) => {
    const row = sheet.getRow(index + 6);
    const typeSummary = summary.byType[type];
    row.values = [MEASUREMENT_TYPES[type].label, typeSummary.count, typeSummary.average ?? '—'];
    if (typeSummary.average !== null) row.getCell(3).numFmt = '0.0';
  });
  sheet.headerFooter.oddFooter = '&CСтраница &P из &N';
}

export async function exportMeasurements(
  items: Measurement[],
  filter: DateFilter,
  now = Date.now(),
): Promise<ExportedReport> {
  const workbook = await buildReportWorkbook(items, filter, now);
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    filename: `sugar-report-${toLocalDateKey(now)}.xlsx`,
    blob: new Blob([new Uint8Array(buffer)], { type: XLSX_MIME }),
  };
}

function formatGeneratedAt(timestamp: number): string {
  const date = new Date(timestamp);
  const day = toLocalDateKey(timestamp).split('-').reverse().join('.');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${hours}:${minutes}`;
}
