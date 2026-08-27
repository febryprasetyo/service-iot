import { sanitizeCalibrationNotes } from './CalibrationReportRenderer';

type CalibrationPublicUrlEnvironment = {
  PUBLIC_CALIBRATION_FRONTEND_URL?: string;
  PUBLIC_CALIBRATION_BASE_URL?: string;
};

export const CALIBRATION_MESSAGES = {
  publicUrlConfigurationError: 'URL publik kalibrasi belum dikonfigurasi dengan alamat HTTP(S) publik yang valid.',
  requiredFields: 'Kolom station_id, calibration_start_date, calibration_end_date, dan parameter_ids wajib diisi.',
  invalidDateRange: 'calibration_end_date harus sama dengan atau setelah calibration_start_date.',
  reportNotFound: 'Laporan kalibrasi tidak ditemukan.',
  updateBeforeApprovalOnly: 'Laporan kalibrasi yang sudah disetujui tidak dapat diperbarui.',
  deleteDraftOnly: 'Hanya laporan berstatus draf yang dapat dihapus.',
  submitDraftOnly: 'Hanya laporan berstatus draf yang dapat diajukan.',
  noParameters: 'Laporan kalibrasi tidak dapat diajukan karena belum ada parameter yang dipilih.',
  parameterStandardsMissing: (detailId: number | string) => `Detail parameter dengan ID ${detailId} belum memiliki standar CRM.`,
  calibrationResultMissing: (standardName: string) => `Hasil kalibrasi untuk standar CRM '${standardName}' belum diisi.`,
  calculationUnavailable: (parameterName: string) => `Hasil kalibrasi untuk parameter '${parameterName}' tidak dapat dihitung.`,
  approvalSubmittedOnly: 'Hanya laporan kalibrasi yang telah diajukan yang dapat disetujui.',
  verificationNotFound: 'Laporan verifikasi kalibrasi tidak ditemukan.',
  draftCreated: 'Draf kalibrasi berhasil dibuat.',
  draftUpdated: 'Draf kalibrasi berhasil diperbarui.',
  reportUpdated: 'Laporan kalibrasi berhasil diperbarui.',
  reportDeleted: 'Laporan kalibrasi berhasil dihapus.',
  reportSubmitted: 'Laporan kalibrasi berhasil diajukan.',
  reportApproved: 'Laporan kalibrasi berhasil disetujui.',
  internalError: 'Terjadi kesalahan internal saat memproses kalibrasi.'
};

export function isCalibrationEditableStatus(status: unknown): boolean {
  return status === 'draft' || status === 'submitted';
}

export function canDeleteCalibration(roleId: string | undefined, status: string): boolean {
  if (roleId === 'adm') return true;
  return status === 'draft';
}

export function getCalibrationDetailLookup(
  calibrationId: string,
  detail: { id?: number; parameter_id?: number }
): { calibration_id: string; id?: number; parameter_id?: number } {
  return detail.id && detail.id > 0
    ? { id: detail.id, calibration_id: calibrationId }
    : { calibration_id: calibrationId, parameter_id: detail.parameter_id };
}

export function getCalibrationCompletenessError(details: any[], standards: any[]): string | null {
  if (!details.length) return CALIBRATION_MESSAGES.noParameters;

  for (const detail of details) {
    const detailStandards = standards.filter((standard) => standard.calibration_detail_id === detail.id);
    if (!detailStandards.length) return CALIBRATION_MESSAGES.parameterStandardsMissing(detail.id);

    const missingResult = detailStandards.find(
      (standard) => standard.calibration_result === null || standard.calibration_result === undefined
    );
    if (missingResult) return CALIBRATION_MESSAGES.calibrationResultMissing(missingResult.crm_name);
  }

  return null;
}

export const CALIBRATION_AUTH_MESSAGES = {
  expiredOrInvalid: 'Token akses telah kedaluwarsa atau tidak valid.',
  accessDenied: 'Anda tidak memiliki izin untuk mengakses endpoint kalibrasi ini.',
  invalid: 'Token akses tidak valid.'
};

function isPrivateIpv4(parts: number[]): boolean {
  const [first, second] = parts;
  return first === 0
    || first === 10
    || first === 127
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || (first === 198 && (second === 18 || second === 19))
    || first >= 224;
}

function isPublicHostname(hostnameValue: string): boolean {
  const hostname = hostnameValue.replace(/^\[|\]$/g, '').toLowerCase();
  const reservedSuffixes = ['.localhost', '.local', '.internal', '.lan', '.home', '.home.arpa'];
  if (!hostname || hostname === 'localhost' || reservedSuffixes.some((suffix) => hostname.endsWith(suffix))) {
    return false;
  }

  const ipv4Parts = hostname.split('.').map(Number);
  const isIpv4 = ipv4Parts.length === 4
    && ipv4Parts.every((part, index) => Number.isInteger(part)
      && part >= 0
      && part <= 255
      && String(part) === hostname.split('.')[index]);
  if (isIpv4) return !isPrivateIpv4(ipv4Parts);

  if (hostname.includes(':')) {
    return hostname !== '::' && hostname !== '::1'
      && !hostname.startsWith('::ffff:')
      && !/^f[cd]/i.test(hostname)
      && !/^fe[89ab]/i.test(hostname);
  }

  return hostname.includes('.');
}

function normalizePublicBaseUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)
      || parsed.username
      || parsed.password
      || !isPublicHostname(parsed.hostname)) return null;
    return value.replace(/\/+$/, '');
  } catch (_) {
    return null;
  }
}

export function getVerificationUrl(
  _request: unknown,
  verificationUuid: string,
  environment: CalibrationPublicUrlEnvironment = {
    PUBLIC_CALIBRATION_FRONTEND_URL: process.env.PUBLIC_CALIBRATION_FRONTEND_URL,
    PUBLIC_CALIBRATION_BASE_URL: process.env.PUBLIC_CALIBRATION_BASE_URL
  }
): string {
  const configuredFrontendUrl = environment.PUBLIC_CALIBRATION_FRONTEND_URL;
  const configuredBaseUrl = configuredFrontendUrl || environment.PUBLIC_CALIBRATION_BASE_URL;
  const publicBaseUrl = normalizePublicBaseUrl(configuredBaseUrl);
  if (!publicBaseUrl) {
    const error: any = new Error(CALIBRATION_MESSAGES.publicUrlConfigurationError);
    error.code = 'E_INTERNAL_SERVER_ERROR';
    error.expose = true;
    throw error;
  }

  return `${publicBaseUrl}/verify/${verificationUuid}`;
}

export function sanitizeCalibrationWriteNotes(notes: string): string;
export function sanitizeCalibrationWriteNotes(notes: null): null;
export function sanitizeCalibrationWriteNotes(notes: string | null): string | null;
export function sanitizeCalibrationWriteNotes(notes: string | null): string | null {
  return sanitizeCalibrationNotes(notes);
}

export function sanitizeCalibrationRecordNotes<T extends { notes?: string | null }>(record: T): T {
  if (!Object.prototype.hasOwnProperty.call(record, 'notes')) return record;
  return {
    ...record,
    notes: sanitizeCalibrationNotes(record.notes)
  };
}

export function localizeCalibrationControllerError(error: any): any {
  const clientErrorCodes = new Set(['E_BAD_REQUEST', 'E_NOT_FOUND', 'E_UNAUTHORIZED']);
  if (error?.expose || clientErrorCodes.has(error?.code)) return error;

  const localizedError: any = new Error(CALIBRATION_MESSAGES.internalError);
  localizedError.code = 'E_INTERNAL';
  localizedError.expose = true;
  return localizedError;
}

/**
 * Safely parses decimal inputs that may be formatted with either a dot (.) or a comma (,).
 * Returns a valid finite number or null if empty/invalid.
 */
export function parseDecimalInput(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
