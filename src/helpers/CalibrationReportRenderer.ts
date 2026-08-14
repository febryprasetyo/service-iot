type ReportStandard = {
  crmName?: string | null;
  crmStandardValue?: number | string | null;
  calibrationResult?: number | string | null;
};

type ReportDetail = {
  parameterName: string;
  parameterUnit?: string | null;
  standards: ReportStandard[];
  crmReferenceValue?: number | string | null;
  crmReadingValue?: number | string | null;
  coefficients?: Record<string, unknown> | string | null;
  calculationStatus?: 'PASS' | 'FAILED' | null;
};

type RenderCalibrationReportInput = {
  reportNo: string;
  stationName: string;
  calibrationStartDate: string | Date;
  calibrationEndDate: string | Date;
  stationAddress?: string | null;
  stationCoordinate?: string | null;
  stationCity?: string | null;
  officerName?: string | null;
  notes?: string | null;
  qrCodeImage: string;
  details: ReportDetail[];
  waterSamples: any[];
};

type WaterSampleColumn = {
  names?: string[];
  field: string;
  label: string;
  unit: string;
};

const waterSampleColumns: WaterSampleColumn[] = [
  { field: 'suhu', label: 'Suhu', unit: '(°C)' },
  { names: ['do'], field: 'do', label: 'DO', unit: '(mg/L)' },
  { names: ['tds'], field: 'tds', label: 'TDS', unit: '(mg/L)' },
  { names: ['turbidity'], field: 'tur', label: 'Turbiditas', unit: '(NTU)' },
  { names: ['ph'], field: 'ph', label: 'pH', unit: 'Unit' },
  { names: ['orp'], field: 'orp', label: 'ORP', unit: '(mV)' },
  { names: ['cod'], field: 'cod', label: 'COD', unit: '(mg/L)' },
  { names: ['bod'], field: 'bod', label: 'BOD', unit: '(mg/L)' },
  { names: ['tss'], field: 'tss', label: 'TSS', unit: '(mg/L)' },
  { names: ['amonia', 'nh3'], field: 'amonia', label: 'NH3-N', unit: '(mg/L)' },
  { names: ['nitrat', 'no3'], field: 'nitrat', label: 'NO3-N', unit: '(mg/L)' },
  { names: ['nitrit', 'no2'], field: 'nitrit', label: 'NO2-N', unit: '(mg/L)' },
  { names: ['kedalaman', 'level', 'depth'], field: 'kedalaman', label: 'Kedalaman', unit: '(m)' }
];

function getDateParts(value: string | Date): { day: number; month: number; year: number } | null {
  const dateOnly = (typeof value === 'string' ? value : value.toISOString()).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!match) return null;

  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function formatIndonesianDate(value: string | Date): string {
  const parts = getDateParts(value);
  if (!parts) return String(value);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)));
}

export function formatCalibrationDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = getDateParts(startDate);
  const end = getDateParts(endDate);
  if (start && end && start.year === end.year && start.month === end.month) {
    if (start.day === end.day) return formatIndonesianDate(startDate);
    const monthYear = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(end.year, end.month - 1, end.day)));
    return `${start.day}–${end.day} ${monthYear}`;
  }
  return `${formatIndonesianDate(startDate)} – ${formatIndonesianDate(endDate)}`;
}

export function formatReportNumberValue(value: unknown): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2).replace('.', ',') : String(value ?? '-');
}

function withUnit(value: unknown, parameterName: string, unit: string | null | undefined): string {
  const formattedValue = formatReportNumberValue(value);
  return parameterName.toLowerCase() === 'ph' || !unit ? formattedValue : `${formattedValue} ${unit}`;
}

function formatStandardLabel(standard: ReportStandard, parameterName: string, unit: string | null | undefined): string {
  const prefix = /^crm\b/i.test(String(standard.crmName || '')) ? 'CRM ' : '';
  return `${prefix}${withUnit(standard.crmStandardValue, parameterName, unit)}`;
}

function formatCalibrationStatus(status: 'PASS' | 'FAILED' | null | undefined): string {
  if (status === 'PASS') return '<span class="tag-pass">Lulus</span>';
  if (status === 'FAILED') return '<span class="tag-fail">Tidak Lulus</span>';
  return '<span class="tag-pending">Menunggu</span>';
}

function formatReportPlace(value: unknown): string {
  return String(value || '')
    .replace(/\b(kabupaten|kota)\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatCoefficients(value: ReportDetail['coefficients'], parameterName: string): string {
  if (!value) return '-';
  const coefficients = typeof value === 'string' ? JSON.parse(value) : value;
  const entries = Object.entries(coefficients);
  if (parameterName === 'pH') {
    const pairs = [['k1', 'k2'], ['k3', 'k4'], ['k5', 'k6']];
    return pairs.map((pair) => pair
      .map((key) => coefficients[key] !== undefined
        ? `<strong>${key.toUpperCase()}:</strong> ${formatReportNumberValue(coefficients[key])}`
        : null)
      .filter(Boolean)
      .join(' | '))
      .filter(Boolean)
      .join('<br>') || '-';
  }

  return entries.map(([key, coefficient]) =>
    `<strong>${key.toUpperCase()}:</strong> ${formatReportNumberValue(coefficient)}`
  ).join('<br>') || '-';
}

function renderCalibrationRows(details: ReportDetail[]): string {
  return details.map((detail) => {
    const standards = detail.standards.some((standard) => /^crm\b/i.test(String(standard.crmName || '')))
      || detail.crmReferenceValue === null || detail.crmReferenceValue === undefined
      ? detail.standards
      : [...detail.standards, { crmName: 'CRM', crmStandardValue: detail.crmReferenceValue }];
    const standardsColumn = standards
      .map((standard) => formatStandardLabel(standard, detail.parameterName, detail.parameterUnit))
      .join('<br>') || '-';
    const readingLines = standards
      .filter((standard) => !/^crm\b/i.test(String(standard.crmName || '')))
      .map((standard) => formatReportNumberValue(standard.calibrationResult));
    const crmStandard = standards.find((standard) => /^crm\b/i.test(String(standard.crmName || '')));
    if (detail.crmReadingValue !== null && detail.crmReadingValue !== undefined) {
      readingLines.push(withUnit(detail.crmReadingValue, detail.parameterName, detail.parameterUnit));
    } else if (crmStandard && crmStandard.calibrationResult !== null && crmStandard.calibrationResult !== undefined) {
      readingLines.push(withUnit(crmStandard.calibrationResult, detail.parameterName, detail.parameterUnit));
    }

    return `<tr>
      <td class="font-bold">Kalibrasi ${detail.parameterName}</td>
      <td class="text-center">${standardsColumn}</td>
      <td class="text-center">${readingLines.join('<br>') || '-'}</td>
      <td class="text-center">${formatCoefficients(detail.coefficients, detail.parameterName)}</td>
      <td class="text-center">${formatCalibrationStatus(detail.calculationStatus)}</td>
    </tr>`;
  }).join('');
}

function renderWaterSampleTable(details: ReportDetail[], samples: any[]): { colgroup: string; headers: string; rows: string } {
  const selectedNames = new Set(details.map((detail) => detail.parameterName.trim().toLowerCase()));
  const columns = waterSampleColumns.filter((column) => !column.names || column.names.some((name) => selectedNames.has(name)));
  const valueWidth = 85 / columns.length;
  return {
    colgroup: `<col class="sample-name-col"><col span="${columns.length}" style="width:${valueWidth}%">`,
    headers: `<th style="width:15%; text-align:left;">Jenis Sampel</th>${columns.map((column) =>
      `<th><span class="header-label">${column.label}</span><span class="header-unit">${column.unit}</span></th>`
    ).join('')}`,
    rows: samples.map((sample) => `<tr>
      <td class="font-bold" style="text-align:left;">${sample.sample_name || '-'}</td>
      ${columns.map((column) => `<td>${formatReportNumberValue(sample[column.field])}</td>`).join('')}
    </tr>`).join('')
  };
}

export function buildCalibrationPdfFilename(reportNo: string | null | undefined, calibrationId: string): string {
  const safeReportNo = String(reportNo || `calibration_${calibrationId}`).replace(/[^a-z0-9A-Z-_\.]/g, '_');
  return `Laporan_Kalibrasi_${safeReportNo}.pdf`;
}

export function renderCalibrationReportHtml(template: string, input: RenderCalibrationReportInput): string {
  const sampleTable = renderWaterSampleTable(input.details, input.waterSamples);
  const place = formatReportPlace(input.stationCity || input.stationAddress);
  const placeDate = `${place}, ${formatIndonesianDate(input.calibrationEndDate)}`;

  return template
    .replace('{{REPORT_NO}}', input.reportNo)
    .replace(/{{STATION_NAME}}/g, input.stationName)
    .replace('{{CALIBRATION_DATE}}', formatCalibrationDateRange(input.calibrationStartDate, input.calibrationEndDate))
    .replace('{{STATION_ADDRESS}}', input.stationAddress || '-')
    .replace('{{STATION_COORDINATE}}', input.stationCoordinate || '-')
    .replace('{{CALIBRATION_ROWS}}', renderCalibrationRows(input.details))
    .replace('{{SAMPLE_COLGROUP}}', sampleTable.colgroup)
    .replace('{{SAMPLE_HEADERS}}', sampleTable.headers)
    .replace('{{SAMPLE_ROWS}}', sampleTable.rows)
    .replace('{{NOTES}}', input.notes || '<ul><li>Tidak ada catatan.</li></ul>')
    .replace('{{QR_CODE_IMAGE}}', input.qrCodeImage)
    .replace('{{OFFICER_NAME}}', input.officerName || '-')
    .replace(/{{PLACE_DATE}}/g, placeDate);
}
