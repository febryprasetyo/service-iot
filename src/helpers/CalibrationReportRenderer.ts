import sanitizeHtml from 'sanitize-html';

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
  { names: ['ph'], field: 'ph', label: 'pH', unit: 'Satuan' },
  { names: ['orp'], field: 'orp', label: 'ORP', unit: '(mV)' },
  { names: ['cod'], field: 'cod', label: 'COD', unit: '(mg/L)' },
  { names: ['bod'], field: 'bod', label: 'BOD', unit: '(mg/L)' },
  { names: ['tss'], field: 'tss', label: 'TSS', unit: '(mg/L)' },
  { names: ['amonia', 'nh3', 'nh3-n', 'amonia (nh3-n)'], field: 'amonia', label: 'Amonia (NH3-N)', unit: '(mg/L)' },
  { names: ['nitrat', 'no3', 'no3-n', 'nitrat (no3-n)'], field: 'nitrat', label: 'Nitrat (NO3-N)', unit: '(mg/L)' },
  { names: ['nitrit', 'no2', 'no2-n', 'nitrit (no2-n)'], field: 'nitrit', label: 'Nitrit (NO2-N)', unit: '(mg/L)' },
  { names: ['kedalaman', 'level', 'depth'], field: 'kedalaman', label: 'Kedalaman', unit: '(m)' }
];

const calibrationMonths = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
] as const;

const calibrationNumberFormat = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false
});

function getDateParts(value: string | Date): { day: number; month: number; year: number } | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    const parsed = new Date(parts.year, parts.month - 1, parts.day);
    if (
      parsed.getFullYear() !== parts.year
      || parsed.getMonth() + 1 !== parts.month
      || parsed.getDate() !== parts.day
    ) return null;
    return parts;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return { year: parsed.getFullYear(), month: parsed.getMonth() + 1, day: parsed.getDate() };
}

function formatDateParts(parts: { day: number; month: number; year: number }): string {
  return `${parts.day} ${calibrationMonths[parts.month - 1]} ${parts.year}`;
}

export function formatIndonesianDate(value: string | Date): string {
  const parts = getDateParts(value);
  return parts ? formatDateParts(parts) : String(value);
}

export function formatCalibrationDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = getDateParts(startDate);
  const end = getDateParts(endDate);
  if (!start || !end) return `${formatIndonesianDate(startDate)}–${formatIndonesianDate(endDate)}`;
  if (start && end && start.year === end.year && start.month === end.month) {
    if (start.day === end.day) return formatIndonesianDate(startDate);
    return `${start.day}–${end.day} ${calibrationMonths[start.month - 1]} ${start.year}`;
  }
  if (start.year === end.year) {
    return `${start.day} ${calibrationMonths[start.month - 1]}–${end.day} ${calibrationMonths[end.month - 1]} ${start.year}`;
  }
  return `${formatDateParts(start)}–${formatDateParts(end)}`;
}

export function formatReportNumberValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? calibrationNumberFormat.format(numericValue) : String(value ?? '-');
}

function escapeHtml(value: unknown): string {
  return String(value ?? '-').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character] as string));
}

export function sanitizeCalibrationNotes(notes: string): string;
export function sanitizeCalibrationNotes(notes: null): null;
export function sanitizeCalibrationNotes(notes: undefined): undefined;
export function sanitizeCalibrationNotes(notes: string | null | undefined): string | null | undefined {
  if (notes === null || notes === undefined) return notes;
  return sanitizeHtml(notes, {
    allowedTags: ['p', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'ul', 'ol', 'li', 'br'],
    allowedAttributes: {},
    allowedSchemes: [],
    allowedSchemesByTag: {},
    disallowedTagsMode: 'discard',
    nonTextTags: ['style', 'script', 'textarea', 'option']
  });
}

function withUnit(value: unknown, parameterName: string, unit: string | null | undefined): string {
  const formattedValue = formatReportNumberValue(value);
  if (formattedValue === '-') return formattedValue;
  return parameterName.toLowerCase() === 'ph' || !unit ? formattedValue : `${formattedValue} ${unit}`;
}

export function formatCalibrationStandard(
  standardName: string | null | undefined,
  standardValue: number | string | null | undefined,
  parameterName: string,
  unit: string | null | undefined
): string {
  const trimmedName = String(standardName ?? '').trim();
  const isCrm = /^crm\b/i.test(trimmedName);
  const fallbackName = trimmedName.replace(/^crm\b\s*/i, '');
  const displayValue = standardValue === null || standardValue === undefined
    ? fallbackName || '-'
    : formatReportNumberValue(standardValue);
  const displayUnit = displayValue === '-' || parameterName.toLowerCase() === 'ph' || !unit ? '' : ` ${unit}`;
  return `${isCrm ? 'CRM ' : ''}${displayValue}${displayUnit}`.trim();
}

function formatStandardLabel(standard: ReportStandard, parameterName: string, unit: string | null | undefined): string {
  return escapeHtml(formatCalibrationStandard(standard.crmName, standard.crmStandardValue, parameterName, unit));
}

function formatCalibrationStatus(status: 'PASS' | 'FAILED' | null | undefined): string {
  if (status === 'PASS') return '<span class="tag-pass">Lulus</span>';
  if (status === 'FAILED') return '<span class="tag-fail">Tidak Lulus</span>';
  return '<span class="tag-pending">Menunggu</span>';
}

export function formatReportPlace(value: unknown): string {
  return String(value || '')
    .trim()
    .replace(/^(kabupaten|kota)\s+/i, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

const calibrationParameterLabels: Record<string, string> = {
  AMONIA: 'Amonia (NH3-N)',
  'AMONIA (NH3-N)': 'Amonia (NH3-N)',
  NH3: 'Amonia (NH3-N)',
  'NH3-N': 'Amonia (NH3-N)',
  NITRAT: 'Nitrat (NO3-N)',
  'NITRAT (NO3-N)': 'Nitrat (NO3-N)',
  NO3: 'Nitrat (NO3-N)',
  'NO3-N': 'Nitrat (NO3-N)',
  NITRIT: 'Nitrit (NO2-N)',
  'NITRIT (NO2-N)': 'Nitrit (NO2-N)',
  NO2: 'Nitrit (NO2-N)',
  'NO2-N': 'Nitrit (NO2-N)'
};

export function formatCalibrationParameterName(value: string): string {
  const trimmedValue = value.trim();
  return calibrationParameterLabels[trimmedValue.toUpperCase()] || trimmedValue;
}

function formatCoefficients(value: ReportDetail['coefficients'], parameterName: string): string {
  if (!value) return '-';
  const coefficients = typeof value === 'string' ? JSON.parse(value) : value;
  const entries = Object.entries(coefficients);
  if (parameterName === 'pH') {
    const pairs = [['k1', 'k2'], ['k3', 'k4'], ['k5', 'k6']];
    return pairs.map((pair) => pair
      .map((key) => coefficients[key] !== undefined
        ? `<strong>${escapeHtml(key.toUpperCase())}:</strong> ${escapeHtml(formatReportNumberValue(coefficients[key]))}`
        : null)
      .filter(Boolean)
      .join(' | '))
      .filter(Boolean)
      .join('<br>') || '-';
  }

  return entries.map(([key, coefficient]) =>
    `<strong>${escapeHtml(key.toUpperCase())}:</strong> ${escapeHtml(formatReportNumberValue(coefficient))}`
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
      .map((standard) => escapeHtml(formatReportNumberValue(standard.calibrationResult)));
    const crmStandard = standards.find((standard) => /^crm\b/i.test(String(standard.crmName || '')));
    if (detail.crmReadingValue !== null && detail.crmReadingValue !== undefined) {
      readingLines.push(escapeHtml(withUnit(detail.crmReadingValue, detail.parameterName, detail.parameterUnit)));
    } else if (crmStandard && crmStandard.calibrationResult !== null && crmStandard.calibrationResult !== undefined) {
      readingLines.push(escapeHtml(withUnit(crmStandard.calibrationResult, detail.parameterName, detail.parameterUnit)));
    }

    return `<tr>
      <td class="font-bold">Kalibrasi ${escapeHtml(formatCalibrationParameterName(detail.parameterName))}</td>
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
      <td class="font-bold" style="text-align:left;">${escapeHtml(sample.sample_name || '-')}</td>
      ${columns.map((column) => `<td>${escapeHtml(formatReportNumberValue(sample[column.field]))}</td>`).join('')}
    </tr>`).join('')
  };
}

export function buildCalibrationPdfFilename(reportNo: string | null | undefined, calibrationId: string): string {
  const safeReportNo = String(reportNo || `kalibrasi_${calibrationId}`).replace(/[^a-z0-9A-Z-_\.]/g, '_');
  return `Laporan_Kalibrasi_${safeReportNo}.pdf`;
}

export function getCalibrationPdfResponseContract(reportNo: string | null | undefined, calibrationId: string) {
  const filename = buildCalibrationPdfFilename(reportNo, calibrationId);
  return {
    contentType: 'application/pdf',
    contentDisposition: `attachment; filename="${filename}"`,
    notFoundMessage: 'Laporan kalibrasi tidak ditemukan.',
    templateNotFoundMessage: 'Template laporan kalibrasi tidak ditemukan.',
    renderErrorMessage: 'Gagal membuat PDF laporan kalibrasi.'
  };
}

export function getCalibrationHtmlResponseContract() {
  return {
    contentType: 'text/html; charset=utf-8',
    contentDisposition: 'inline'
  };
}

export function renderCalibrationReportHtml(template: string, input: RenderCalibrationReportInput): string {
  const sampleTable = renderWaterSampleTable(input.details, input.waterSamples);
  const place = formatReportPlace(input.stationCity || input.stationAddress);
  const formattedEndDate = formatIndonesianDate(input.calibrationEndDate);
  const placeDate = place ? `${place}, ${formattedEndDate}` : formattedEndDate;

  return template
    .replace('{{REPORT_NO}}', () => escapeHtml(input.reportNo))
    .replace(/{{STATION_NAME}}/g, () => escapeHtml(input.stationName))
    .replace('{{CALIBRATION_DATE}}', () => escapeHtml(formatCalibrationDateRange(input.calibrationStartDate, input.calibrationEndDate)))
    .replace('{{STATION_ADDRESS}}', () => escapeHtml(input.stationAddress || '-'))
    .replace('{{STATION_COORDINATE}}', () => escapeHtml(input.stationCoordinate || '-'))
    .replace('{{CALIBRATION_ROWS}}', renderCalibrationRows(input.details))
    .replace('{{SAMPLE_COLGROUP}}', sampleTable.colgroup)
    .replace('{{SAMPLE_HEADERS}}', sampleTable.headers)
    .replace('{{SAMPLE_ROWS}}', sampleTable.rows)
    .replace('{{NOTES}}', () => sanitizeCalibrationNotes(input.notes) || '<ul><li>Tidak ada catatan.</li></ul>')
    .replace('{{QR_CODE_IMAGE}}', () => escapeHtml(input.qrCodeImage))
    .replace('{{OFFICER_NAME}}', () => escapeHtml(input.officerName || '-'))
    .replace(/{{PLACE_DATE}}/g, () => escapeHtml(placeDate));
}
