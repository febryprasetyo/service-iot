jest.mock('../utils/logger', () => ({
  init: () => ({ info: jest.fn(), error: jest.fn(), debug: jest.fn() }),
  getLogger: () => ({ info: jest.fn(), error: jest.fn(), debug: jest.fn() })
}));

import {
  CALIBRATION_AUTH_MESSAGES,
  CALIBRATION_MESSAGES,
  getCalibrationCompletenessError,
  getVerificationUrl,
  isCalibrationEditableStatus,
  localizeCalibrationControllerError,
  sanitizeCalibrationRecordNotes,
  sanitizeCalibrationWriteNotes
} from './CalibrationApiContract';
import { sendResponseError } from '../utils/util';

describe('calibration API notes contract', () => {
  const hostileNotes = '<p onclick="alert(1)">Catatan <strong data-secret="x">aman</strong><u>garis bawah</u><img src=x onerror="alert(2)"><script>alert(3)</script></p><ol style="color:red"><li>urut</li></ol>';
  const safeNotes = '<p>Catatan <strong>aman</strong><u>garis bawah</u></p><ol><li>urut</li></ol>';

  it('sanitizes hostile notes before a calibration write while preserving editor formatting', () => {
    expect(sanitizeCalibrationWriteNotes(hostileNotes)).toBe(safeNotes);
    expect(sanitizeCalibrationWriteNotes(null)).toBeNull();
  });

  it('sanitizes legacy hostile notes at a JSON response boundary without mutating the database record', () => {
    const storedRecord = { id: 'cal-7', status: 'draft', notes: hostileNotes };

    expect(sanitizeCalibrationRecordNotes(storedRecord)).toEqual({
      id: 'cal-7',
      status: 'draft',
      notes: safeNotes
    });
    expect(storedRecord.notes).toBe(hostileNotes);
    expect(sanitizeCalibrationRecordNotes({ id: 'cal-8', notes: null })).toEqual({ id: 'cal-8', notes: null });
  });
});

describe('calibration verification URL contract', () => {
  const hostileRequest = {
    headers: {
      origin: 'https://penyerang.example',
      referer: 'https://referer-penyerang.example/calibration',
      'x-forwarded-host': 'proxy-penyerang.example',
      'x-forwarded-proto': 'https'
    },
    protocol: 'https',
    get: jest.fn().mockReturnValue('host-penyerang.example')
  } as any;

  it('uses the authoritative frontend configuration regardless of hostile request headers', () => {
    expect(getVerificationUrl(hostileRequest, 'uuid-123', {
      PUBLIC_CALIBRATION_FRONTEND_URL: 'https://kalibrasi.example.com/'
    })).toBe('https://kalibrasi.example.com/verify/uuid-123');
  });

  it('uses only the explicit backend compatibility configuration when the frontend URL is absent', () => {
    expect(getVerificationUrl(hostileRequest, 'uuid-456', {
      PUBLIC_CALIBRATION_BASE_URL: 'https://api.example.com/api/'
    })).toBe('https://api.example.com/api/verify/uuid-456');
  });

  it.each([
    [{}, 'missing configuration'],
    [{ PUBLIC_CALIBRATION_FRONTEND_URL: 'http://localhost:3000' }, 'localhost'],
    [{ PUBLIC_CALIBRATION_FRONTEND_URL: 'http://127.0.0.1:3000' }, 'IPv4 loopback'],
    [{ PUBLIC_CALIBRATION_FRONTEND_URL: 'https://[::1]' }, 'IPv6 loopback'],
    [{ PUBLIC_CALIBRATION_FRONTEND_URL: 'https://[fd00::1]' }, 'private IPv6'],
    [{ PUBLIC_CALIBRATION_FRONTEND_URL: 'https://[::ffff:127.0.0.1]' }, 'IPv4-mapped loopback'],
    [{ PUBLIC_CALIBRATION_FRONTEND_URL: 'http://192.168.10.7' }, 'private IPv4'],
    [{ PUBLIC_CALIBRATION_FRONTEND_URL: 'https://calibration.local' }, 'local domain'],
    [{ PUBLIC_CALIBRATION_FRONTEND_URL: 'https://calibration.internal' }, 'internal domain'],
    [{ PUBLIC_CALIBRATION_FRONTEND_URL: 'javascript:alert(1)' }, 'non-HTTP scheme'],
    [{ PUBLIC_CALIBRATION_FRONTEND_URL: 'https://internal' }, 'single-label host']
  ])('rejects %s as a non-public QR target (%s)', (environment, _description) => {
    expect(() => getVerificationUrl(hostileRequest, 'uuid-789', environment)).toThrow(
      'URL publik kalibrasi belum dikonfigurasi dengan alamat HTTP(S) publik yang valid.'
    );
  });

  it('rejects an invalid authoritative frontend URL instead of silently falling back', () => {
    expect(() => getVerificationUrl(hostileRequest, 'uuid-999', {
      PUBLIC_CALIBRATION_FRONTEND_URL: 'http://localhost:3000',
      PUBLIC_CALIBRATION_BASE_URL: 'https://api.example.com/api'
    })).toThrow('URL publik kalibrasi belum dikonfigurasi dengan alamat HTTP(S) publik yang valid.');
  });

  it('returns the missing public URL error in Indonesian at the JSON response boundary', () => {
    const response: any = {};
    response.status = jest.fn().mockReturnValue(response);
    response.json = jest.fn().mockReturnValue(response);

    try {
      getVerificationUrl(hostileRequest, 'uuid-error', {});
    } catch (error) {
      sendResponseError(response, error);
    }

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: 'URL publik kalibrasi belum dikonfigurasi dengan alamat HTTP(S) publik yang valid.'
    });
  });
});

describe('calibration Indonesian message contract', () => {
  it('allows updates before approval and locks approved reports', () => {
    expect(isCalibrationEditableStatus('draft')).toBe(true);
    expect(isCalibrationEditableStatus('submitted')).toBe(true);
    expect(isCalibrationEditableStatus('approved')).toBe(false);
  });

  it('rejects approval when a submitted revision is no longer complete', () => {
    const details = [{ id: 7 }];

    expect(getCalibrationCompletenessError([], [])).toBe(
      'Laporan kalibrasi tidak dapat diajukan karena belum ada parameter yang dipilih.'
    );
    expect(getCalibrationCompletenessError(details, [])).toBe(
      'Detail parameter dengan ID 7 belum memiliki standar CRM.'
    );
    expect(getCalibrationCompletenessError(details, [{ calibration_detail_id: 7, crm_name: 'CRM 5.51', calibration_result: null }])).toBe(
      "Hasil kalibrasi untuk standar CRM 'CRM 5.51' belum diisi."
    );
    expect(getCalibrationCompletenessError(details, [{ calibration_detail_id: 7, crm_name: 'CRM 5.51', calibration_result: 5.4 }])).toBeNull();
  });

  it('provides professional validation and workflow messages without changing data field names', () => {
    expect(CALIBRATION_MESSAGES.requiredFields).toBe(
      'Kolom station_id, calibration_start_date, calibration_end_date, dan parameter_ids wajib diisi.'
    );
    expect(CALIBRATION_MESSAGES.invalidDateRange).toBe(
      'calibration_end_date harus sama dengan atau setelah calibration_start_date.'
    );
    expect(CALIBRATION_MESSAGES.reportNotFound).toBe('Laporan kalibrasi tidak ditemukan.');
    expect(CALIBRATION_MESSAGES.updateBeforeApprovalOnly).toBe('Laporan kalibrasi yang sudah disetujui tidak dapat diperbarui.');
    expect(CALIBRATION_MESSAGES.deleteDraftOnly).toBe('Hanya laporan berstatus draf yang dapat dihapus.');
    expect(CALIBRATION_MESSAGES.submitDraftOnly).toBe('Hanya laporan berstatus draf yang dapat diajukan.');
    expect(CALIBRATION_MESSAGES.noParameters).toBe(
      'Laporan kalibrasi tidak dapat diajukan karena belum ada parameter yang dipilih.'
    );
    expect(CALIBRATION_MESSAGES.parameterStandardsMissing(54)).toBe(
      'Detail parameter dengan ID 54 belum memiliki standar CRM.'
    );
    expect(CALIBRATION_MESSAGES.calibrationResultMissing('CRM 5.51')).toBe(
      "Hasil kalibrasi untuk standar CRM 'CRM 5.51' belum diisi."
    );
    expect(CALIBRATION_MESSAGES.calculationUnavailable('DO')).toBe(
      "Hasil kalibrasi untuk parameter 'DO' tidak dapat dihitung."
    );
    expect(CALIBRATION_MESSAGES.approvalSubmittedOnly).toBe(
      'Hanya laporan kalibrasi yang telah diajukan yang dapat disetujui.'
    );
    expect(CALIBRATION_MESSAGES.verificationNotFound).toBe(
      'Laporan verifikasi kalibrasi tidak ditemukan.'
    );
  });

  it('provides Indonesian success and calibration authorization messages', () => {
    expect(CALIBRATION_MESSAGES.draftCreated).toBe('Draf kalibrasi berhasil dibuat.');
    expect(CALIBRATION_MESSAGES.draftUpdated).toBe('Draf kalibrasi berhasil diperbarui.');
    expect(CALIBRATION_MESSAGES.reportUpdated).toBe('Laporan kalibrasi berhasil diperbarui.');
    expect(CALIBRATION_MESSAGES.reportDeleted).toBe('Laporan kalibrasi berhasil dihapus.');
    expect(CALIBRATION_MESSAGES.reportSubmitted).toBe('Laporan kalibrasi berhasil diajukan.');
    expect(CALIBRATION_MESSAGES.reportApproved).toBe('Laporan kalibrasi berhasil disetujui.');
    expect(CALIBRATION_MESSAGES.internalError).toBe('Terjadi kesalahan internal saat memproses kalibrasi.');
    expect(CALIBRATION_AUTH_MESSAGES).toEqual({
      expiredOrInvalid: 'Token akses telah kedaluwarsa atau tidak valid.',
      accessDenied: 'Anda tidak memiliki izin untuk mengakses endpoint kalibrasi ini.',
      invalid: 'Token akses tidak valid.'
    });
  });

  it('keeps localized client errors but replaces unexpected internal details with safe Indonesian copy', () => {
    const clientError = Object.assign(new Error(CALIBRATION_MESSAGES.reportNotFound), { code: 'E_NOT_FOUND' });
    expect(localizeCalibrationControllerError(clientError)).toBe(clientError);

    const localizedInternalError: any = localizeCalibrationControllerError(new Error('password authentication failed'));
    expect(localizedInternalError).toMatchObject({
      code: 'E_INTERNAL',
      expose: true,
      message: 'Terjadi kesalahan internal saat memproses kalibrasi.'
    });
    expect(localizedInternalError.message).not.toContain('password authentication failed');
  });
});
