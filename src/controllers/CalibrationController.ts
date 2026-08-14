import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { db, sendResponseCustom, sendResponseError, createError, nowWib } from '../utils/util';
import { CalibrationRepository } from '../repositories/CalibrationRepository';
import { CalibrationService } from '../services/CalibrationService';
import { evaluateStandardMeasurement, getCalibrationSpecification } from '../helpers/CalibrationCalculator';
import { ensureDefaultSolutionStandardsForDetail, getMasterSolutionStandards } from '../helpers/CalibrationDefaults';
import { buildCalibrationPdfFilename, renderCalibrationReportHtml } from '../helpers/CalibrationReportRenderer';

const calibrationRepository = new CalibrationRepository(db);
const calibrationService = new CalibrationService(calibrationRepository);

function formatStandardValue(value: number | string, parameterName: string, unit: string | null): string {
  const numericValue = Number(value);
  const formattedValue = parameterName === 'pH' && numericValue === 4
    ? '4.0'
    : String(numericValue);

  if (parameterName === 'DO') {
    return `${formattedValue}%`;
  }

  return parameterName === 'pH' || !unit ? formattedValue : `${formattedValue} ${unit}`;
}

function formatCalibrationDateRange(startDate: string | Date, endDate: string | Date): string {
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedStart = formatDate(startDate);
  const formattedEnd = formatDate(endDate);
  return formattedStart === formattedEnd ? formattedStart : `${formattedStart} – ${formattedEnd}`;
}

function formatReportDate(date: string | Date): string {
  const raw = typeof date === 'string' ? date : date.toISOString();
  const dateOnly = raw.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return raw;
}

function formatReportPlace(value: unknown): string {
  return String(value || '')
    .replace(/\b(kabupaten|kota)\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

type WaterSampleColumn = {
  names?: string[];
  field: string;
  label: string;
  unit: string;
};

const waterSampleColumns: WaterSampleColumn[] = [
  { field: 'suhu', label: 'Temp', unit: '(°C)' },
  { names: ['do'], field: 'do', label: 'DO', unit: '(mg/L)' },
  { names: ['tds'], field: 'tds', label: 'TDS', unit: '(mg/L)' },
  { names: ['turbidity'], field: 'tur', label: 'Turb', unit: '(NTU)' },
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

function getVisibleWaterSampleColumns(details: any[]): WaterSampleColumn[] {
  const selectedNames = new Set(details.map((detail) => String(detail.parameter_name || '').trim().toLowerCase()));
  return waterSampleColumns.filter((column) => !column.names || column.names.some((name) => selectedNames.has(name)));
}

function renderWaterSampleTable(details: any[], samples: any[]): { colgroup: string; headers: string; rows: string } {
  const columns = getVisibleWaterSampleColumns(details);
  const valueWidth = 85 / columns.length;
  return {
    colgroup: `<col class="sample-name-col"><col span="${columns.length}" style="width:${valueWidth}%">`,
    headers: `<th style="width:15%; text-align:left;">Sample Type</th>${columns.map((column) =>
      `<th><span class="header-label">${column.label}</span><span class="header-unit">${column.unit}</span></th>`
    ).join('')}`,
    rows: samples.map((sample) => `<tr>
      <td class="font-bold" style="text-align:left;">${sample.sample_name || '-'}</td>
      ${columns.map((column) => `<td>${formatReadingValue(sample[column.field])}</td>`).join('')}
    </tr>`).join('')
  };
}

function formatReadingValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : String(value);
}

function displayStandardUnit(parameterName: string, unit: string | null): string {
  return parameterName.toLowerCase() === 'ph' || !unit ? '' : ` ${unit}`;
}

function formatStandardLabel(standard: any, parameterName: string, unit: string | null): string {
  const name = String(standard.crm_name || '');
  if (/crm/i.test(name)) {
    return `CRM ${standard.crm_standard_value ?? name}${displayStandardUnit(parameterName, unit)}`;
  }
  return `${name || standard.crm_standard_value}${displayStandardUnit(parameterName, unit)}`;
}

function normalizeCoefficients(coefficients: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(coefficients).map(([key, value]) => [key.toLowerCase(), value])
  );
}

/**
 * QR codes can point to the frontend verification page. That page then loads
 * the public backend data from GET /api/verify/:verification_uuid.
 *
 * PUBLIC_CALIBRATION_FRONTEND_URL example: https://app.example.com
 * PUBLIC_CALIBRATION_BASE_URL remains supported for deployments that expose
 * the backend verification page directly, e.g. https://api.example.com/api.
 */
function getVerificationUrl(req: Request, verificationUuid: string): string {
  const isPublicUrl = (value: string) => {
    try {
      const hostname = new URL(value).hostname.toLowerCase();
      return hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1';
    } catch (_) {
      return false;
    }
  };
  const origin = String(req.headers.origin || '');
  const referer = String(req.headers.referer || '');
  const refererOrigin = referer ? (() => { try { return new URL(referer).origin; } catch (_) { return ''; } })() : '';
  const frontendBaseUrl = [process.env.PUBLIC_CALIBRATION_FRONTEND_URL, origin, refererOrigin]
    .find((value): value is string => Boolean(value && isPublicUrl(value)));
  if (frontendBaseUrl) return `${frontendBaseUrl.replace(/\/$/, '')}/verify/${verificationUuid}`;

  const configuredApiUrl = process.env.PUBLIC_CALIBRATION_BASE_URL;
  if (configuredApiUrl && isPublicUrl(configuredApiUrl)) {
    return `${configuredApiUrl.replace(/\/$/, '')}/verify/${verificationUuid}`;
  }

  const protocol = ((req.headers['x-forwarded-proto'] as string) || req.protocol).split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.get('host') || '').split(',')[0].trim();
  const requestApiUrl = `${process.env.PUBLIC_CALIBRATION_PROTOCOL || protocol}://${forwardedHost}/api`;
  if (forwardedHost && isPublicUrl(requestApiUrl)) return `${requestApiUrl}/verify/${verificationUuid}`;

  throw createError('PUBLIC_CALIBRATION_FRONTEND_URL must be configured with a public, non-local URL.', 'E_INTERNAL_SERVER_ERROR');
}

function formatCalibrationStatus(status: string | null): string {
  if (status === 'PASS') return '<span class="tag-pass">PASS</span>';
  if (status === 'FAILED') return '<span class="tag-fail">FAILED</span>';
  return '<span class="tag-pending">PENDING</span>';
}

function deriveCalibrationStatus(parameterName: string, standards: any[]): 'PASS' | 'FAILED' | null {
  const evaluableStandards = standards.filter((standard: any) => !/crm/i.test((standard.crm_name || '').toString()));
  let hasEvaluableStandard = false;
  let hasMissingResult = false;

  for (const standard of evaluableStandards) {
    const standardValue = Number(standard.crm_standard_value);
    hasEvaluableStandard = true;
    if (standard.calibration_result === null || standard.calibration_result === undefined) {
      hasMissingResult = true;
      continue;
    }
    const measurement = evaluateStandardMeasurement(
      parameterName,
      Number(standard.calibration_result),
      standardValue
    );
    if (measurement?.status === 'FAILED') return 'FAILED';
  }

  return hasEvaluableStandard && !hasMissingResult ? 'PASS' : null;
}

function findStandardByName(standards: any[], crmName: unknown): any | undefined {
  const requestedName = String(crmName ?? '').trim();
  const exactMatch = standards.find((standard: any) => String(standard.crm_name).trim() === requestedName);
  if (exactMatch) return exactMatch;

  const requestedValue = Number(requestedName);
  if (!requestedName || !Number.isFinite(requestedValue)) return undefined;

  return standards.find((standard: any) => {
    const standardValue = Number(standard.crm_name);
    return Number.isFinite(standardValue) && standardValue === requestedValue;
  });
}

class CalibrationController {

  /**
   * Master data for the calibration parameter selector.
   * GET /calibrations/parameters
   */
  async parameters(req: Request, res: Response) {
    try {
      const parameters = await db('master_parameters as parameter')
        .leftJoin(
          'master_calibration_solutions as solution',
          'solution.parameter_id',
          'parameter.id'
        )
        .select(
          'parameter.id',
          'parameter.name',
          'parameter.unit',
          'solution.solution_1',
          'solution.solution_2',
          'solution.solution_3'
        )
        .orderBy('parameter.id');

      return sendResponseCustom(res, {
        success: true,
        data: parameters.map((parameter: any) => {
          const standardValues = [
            parameter.solution_1,
            parameter.solution_2,
            parameter.solution_3
          ].filter((value) => value !== null && value !== undefined);

          return {
            id: parameter.id,
            name: parameter.name,
            unit: parameter.unit,
            standards: standardValues.map((value) => ({
              crm_name: String(Number(value)),
              crm_standard_value: Number(value)
            }))
          };
        })
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }
  
  /**
   * Create Draft Calibration
   * POST /calibrations
   */
  async create(req: Request, res: Response) {
    try {
      const { station_id, calibration_start_date, calibration_end_date, parameter_ids } = req.body;
      const user = (req as any).user;

      if (!station_id || !calibration_start_date || !calibration_end_date || !parameter_ids || !parameter_ids.length) {
        throw createError('Missing required fields. station_id, calibration_start_date, calibration_end_date, and parameter_ids are required.', 'E_BAD_REQUEST');
      }

      if (new Date(calibration_end_date) < new Date(calibration_start_date)) {
        throw createError('calibration_end_date must be on or after calibration_start_date.', 'E_BAD_REQUEST');
      }

      const officerId = user.user_id;

      const calibrationId = await calibrationService.createCalibrationDraft({
        station_id,
        calibration_start_date,
        calibration_end_date,
        parameter_ids
      }, officerId);

      const data = await db('calibrations')
        .where({ id: calibrationId })
        .select(
          '*',
          db.raw('calibration_start_date::text as calibration_start_date'),
          db.raw('calibration_end_date::text as calibration_end_date')
        )
        .first();
      const verificationUrl = getVerificationUrl(req, data.verification_uuid);
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 180,
        margin: 1
      });

      return sendResponseCustom(res, {
        success: true,
        message: 'Calibration draft created successfully',
        data: {
          ...data,
          verification_url: verificationUrl,
          qr_code_data_url: qrCodeDataUrl
        }
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Get Calibration List
   * GET /calibrations
   */
  async list(req: Request, res: Response) {
    try {
      const { limit = 20, offset = 0, status } = req.query;

      const query = db('calibrations')
        .join('stations', 'calibrations.station_id', '=', 'stations.id')
        .join('users', 'calibrations.officer_id', '=', 'users.id')
        .select(
          'calibrations.*',
          db.raw('calibrations.calibration_start_date::text as calibration_start_date'),
          db.raw('calibrations.calibration_end_date::text as calibration_end_date'),
          'stations.nama_stasiun as station_name',
          'users.username as officer_name'
        );

      if (status) {
        query.where('calibrations.status', status);
      }

      const calibrations = await query
        .orderBy('calibrations.created_at', 'desc')
        .limit(Number(limit))
        .offset(Number(offset));

      const [{ count }] = await db('calibrations')
        .modify((qb) => {
          if (status) qb.where('status', status);
        })
        .count('id as count');

      return sendResponseCustom(res, {
        success: true,
        data: calibrations,
        total: parseInt(count as string)
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Get Calibration Detail
   * GET /calibrations/:id
   */
  async detail(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const calibration = await db('calibrations')
        .join('stations', 'calibrations.station_id', '=', 'stations.id')
        .join('users', 'calibrations.officer_id', '=', 'users.id')
        .where('calibrations.id', id)
        .select(
          'calibrations.*',
          db.raw('calibrations.calibration_start_date::text as calibration_start_date'),
          db.raw('calibrations.calibration_end_date::text as calibration_end_date'),
          'stations.nama_stasiun as station_name',
          'stations.address as station_address',
          'stations.coordinate as station_coordinate',
          'stations.city_name as station_city',
          'users.username as officer_name'
        )
        .first();

      if (!calibration) {
        throw createError('Calibration report not found', 'E_NOT_FOUND');
      }

      const details = await db('calibration_details')
        .join('master_parameters', 'calibration_details.parameter_id', '=', 'master_parameters.id')
        .where('calibration_details.calibration_id', id)
        .select(
          'calibration_details.*',
          'master_parameters.name as parameter_name',
          'master_parameters.unit as parameter_unit'
        );

      // Fetch standard/CRM details for each parameter detail
      const detailIds = details.map((d: any) => d.id);
      let standards: any[] = [];
      if (detailIds.length > 0) {
        standards = await db('calibration_detail_standards')
          .whereIn('calibration_detail_id', detailIds);
      }

      const waterSamples = await db('water_samples')
        .where('calibration_id', id);
      const verificationUrl = getVerificationUrl(req, calibration.verification_uuid);
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 180,
        margin: 1
      });

      return sendResponseCustom(res, {
        success: true,
        data: {
          ...calibration,
          verification_url: verificationUrl,
          qr_code_data_url: qrCodeDataUrl,
          details: await Promise.all(details.map(async (d: any) => {
            const paramStandards = standards.filter((s: any) => s.calibration_detail_id === d.id);
            const masterStandards = await getMasterSolutionStandards(db, d.parameter_name);
            const canonicalStandards = masterStandards.map((masterStandard) => {
              const storedStandard = paramStandards.find((s: any) => s.crm_name === masterStandard.crm_name);
              return storedStandard ? {
                ...storedStandard,
                crm_standard_value: masterStandard.crm_standard_value
              } : {
                  id: null,
                  calibration_detail_id: d.id,
                  crm_name: masterStandard.crm_name,
                  crm_standard_value: masterStandard.crm_standard_value,
                  min_acceptable: null,
                  max_acceptable: null,
                  calibration_result: null
                };
            });
            return {
              ...d,
              calculation_result: deriveCalibrationStatus(d.parameter_name, canonicalStandards) || d.calculation_result || null,
              // Only expose standards configured in the fixed master table.
              standards: canonicalStandards
            };
          })),
          waterSamples
        }
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Save Draft / Staged Calibration Progress
   * PUT /calibrations/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { calibration_start_date, calibration_end_date, notes, details, waterSamples, parameter_ids } = req.body;

      const calibration = await db('calibrations').where({ id }).first();
      if (!calibration) {
        throw createError('Calibration report not found', 'E_NOT_FOUND');
      }

      if (calibration.status !== 'draft') {
        throw createError('Only drafts can be updated', 'E_BAD_REQUEST');
      }

      await db.transaction(async (trx) => {
        // Update header fields
        const headerUpdate: any = { updated_at: nowWib() };
        if (calibration_start_date !== undefined) headerUpdate.calibration_start_date = calibration_start_date;
        if (calibration_end_date !== undefined) headerUpdate.calibration_end_date = calibration_end_date;
        const effectiveStartDate = calibration_start_date || calibration.calibration_start_date;
        const effectiveEndDate = calibration_end_date || calibration.calibration_end_date;
        if (new Date(effectiveEndDate) < new Date(effectiveStartDate)) {
          throw createError('calibration_end_date must be on or after calibration_start_date.', 'E_BAD_REQUEST');
        }
        if (notes !== undefined) headerUpdate.notes = notes;

        await trx('calibrations').where({ id }).update(headerUpdate);

        // 1. Synchronize parameter details if parameter_ids is provided
        if (parameter_ids && Array.isArray(parameter_ids)) {
          const existingDetails = await trx('calibration_details').where('calibration_id', id);
          const existingParamIds = existingDetails.map((d: any) => d.parameter_id);

          const paramIdsToRemove = existingParamIds.filter(pid => !parameter_ids.includes(pid));
          if (paramIdsToRemove.length > 0) {
            const detailIdsToRemove = existingDetails
              .filter((d: any) => paramIdsToRemove.includes(d.parameter_id))
              .map((d: any) => d.id);
            await trx('calibration_detail_standards').whereIn('calibration_detail_id', detailIdsToRemove).del();
            await trx('calibration_details').whereIn('id', detailIdsToRemove).del();
          }

          const paramIdsToAdd = parameter_ids.filter(pid => !existingParamIds.includes(pid));
          if (paramIdsToAdd.length > 0) {
            const newDetailsData = paramIdsToAdd.map(pid => ({
              calibration_id: id,
              parameter_id: pid
            }));
            await trx('calibration_details').insert(newDetailsData);

            const insertedDetails = await trx('calibration_details')
              .join('master_parameters', 'calibration_details.parameter_id', '=', 'master_parameters.id')
              .select('calibration_details.id as detail_id', 'master_parameters.name as parameter_name')
              .where('calibration_details.calibration_id', id)
              .whereIn('calibration_details.parameter_id', paramIdsToAdd);

            for (const detail of insertedDetails) {
              await ensureDefaultSolutionStandardsForDetail(trx, detail.detail_id, detail.parameter_name);
            }
          }
        }

        // 2. Update details and synchronize CRM standards
        if (details && details.length > 0) {
          const detailIdsToFetch = details.map((d: any) => d.id).filter(Boolean);
          const dbDetailNames: any[] = detailIdsToFetch.length > 0
            ? await trx('calibration_details')
                .join('master_parameters', 'calibration_details.parameter_id', '=', 'master_parameters.id')
                .select('calibration_details.id', 'master_parameters.name as parameter_name')
                .whereIn('calibration_details.id', detailIdsToFetch)
            : [];
          const parameterNameMap = new Map(dbDetailNames.map((row: any) => [row.id, row.parameter_name]));

          for (const d of details) {
            const parameterName = d.parameter_name || parameterNameMap.get(d.id) || '';
            await ensureDefaultSolutionStandardsForDetail(trx, d.id, parameterName);
            const masterStandards = await getMasterSolutionStandards(trx, parameterName);
            const masterStandardsByName = new Map(
              masterStandards.map((standard) => [standard.crm_name, standard])
            );

            const evaluatedResult = d.standards && d.standards.length > 0
              ? deriveCalibrationStatus(parameterName, d.standards.map((standard: any) => {
                  const masterStandard = masterStandardsByName.get(standard.crm_name)
                    || findStandardByName(masterStandards, standard.crm_name);
                  return masterStandard ? { ...standard, crm_standard_value: masterStandard.crm_standard_value } : standard;
                }))
              : null;

            const detailUpdate: any = { updated_at: nowWib() };
            if (d.coeff_type) detailUpdate.coeff_type = d.coeff_type;
            if (d.coefficients) detailUpdate.coefficients = JSON.stringify(normalizeCoefficients(d.coefficients));
            if (d.crm_reference_value !== undefined) detailUpdate.crm_reference_value = d.crm_reference_value;
            if (d.crm_reading_value !== undefined) detailUpdate.crm_reading_value = d.crm_reading_value;
            detailUpdate.remark = getCalibrationSpecification(parameterName)?.label || d.remark || null;
            detailUpdate.calculation_result = evaluatedResult || d.calculation_result || null;

            await trx('calibration_details').where({ id: d.id, calibration_id: id }).update(detailUpdate);

            // Upsert standard/CRM values
            if (d.standards && d.standards.length > 0) {
              const existingStandards = await trx('calibration_detail_standards').where('calibration_detail_id', d.id);

              for (const s of d.standards) {
                const existingStandardById = s.id
                  ? existingStandards.find((standard: any) => standard.id === s.id)
                  : undefined;
                const masterStandard = masterStandardsByName.get(s.crm_name)
                  || findStandardByName(masterStandards, s.crm_name)
                  || (existingStandardById
                    ? findStandardByName(masterStandards, existingStandardById.crm_name)
                    : undefined);
                if (!masterStandard) {
                  continue;
                }

                const measurement = s.calibration_result !== null && s.calibration_result !== undefined
                  ? evaluateStandardMeasurement(parameterName, Number(s.calibration_result), masterStandard.crm_standard_value)
                  : null;
                const standardUpdate: any = {
                  crm_name: masterStandard.crm_name,
                  crm_standard_value: masterStandard.crm_standard_value,
                  min_acceptable: measurement ? measurement.min : null,
                  max_acceptable: measurement ? measurement.max : null,
                  calibration_result: s.calibration_result,
                  updated_at: nowWib()
                };

                const existingStandard = s.id
                  ? existingStandardById
                  : existingStandards.find((standard: any) => standard.crm_name === masterStandard.crm_name);

                if (existingStandard) {
                  await trx('calibration_detail_standards').where({ id: existingStandard.id, calibration_detail_id: d.id }).update(standardUpdate);
                } else {
                  await trx('calibration_detail_standards').insert({
                    calibration_detail_id: d.id,
                    ...standardUpdate,
                    created_at: nowWib()
                  });
                }
              }
            }
          }
        }

        // 3. Synchronize Water Samples
        if (waterSamples && Array.isArray(waterSamples)) {
          const existingWaterSamples = await trx('water_samples').where('calibration_id', id);
          const incomingSampleIds = waterSamples.map((ws: any) => ws.id).filter(Boolean);

          const samplesToDelete = existingWaterSamples.filter((ws: any) => !incomingSampleIds.includes(ws.id));
          if (samplesToDelete.length > 0) {
            const idsToDelete = samplesToDelete.map((ws: any) => ws.id);
            await trx('water_samples').whereIn('id', idsToDelete).del();
          }

          for (const ws of waterSamples) {
            const sampleData = {
              sample_name: ws.sample_name,
              suhu: ws.suhu,
              do: ws.do,
              tur: ws.tur,
              tds: ws.tds,
              ph: ws.ph,
              orp: ws.orp,
              tss: ws.tss,
              bod: ws.bod,
              cod: ws.cod,
              amonia: ws.amonia,
              nitrat: ws.nitrat,
              nitrit: ws.nitrit,
              kedalaman: ws.kedalaman,
              updated_at: nowWib()
            };

            if (ws.id) {
              await trx('water_samples').where({ id: ws.id, calibration_id: id }).update(sampleData);
            } else {
              await trx('water_samples').insert({
                calibration_id: id,
                ...sampleData,
                created_at: nowWib()
              });
            }
          }
        }
      });

      const updated = await db('calibrations').where({ id }).first();

      return sendResponseCustom(res, {
        success: true,
        message: 'Calibration draft updated successfully',
        data: updated
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Delete Calibration
   * DELETE /calibrations/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const calibration = await db('calibrations').where({ id }).first();
      if (!calibration) {
        throw createError('Calibration report not found', 'E_NOT_FOUND');
      }

      if (calibration.status !== 'draft') {
        throw createError('Only drafts can be deleted', 'E_BAD_REQUEST');
      }

      await db('calibrations').where({ id }).del();

      return sendResponseCustom(res, {
        success: true,
        message: 'Calibration report deleted successfully'
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Submit Calibration (Finalizes PASS/FAILED calculations and validation)
   * POST /calibrations/:id/submit
   */
  async submit(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const calibration = await db('calibrations').where({ id }).first();
      if (!calibration) {
        throw createError('Calibration report not found', 'E_NOT_FOUND');
      }

      if (calibration.status !== 'draft') {
        throw createError('Only drafts can be submitted', 'E_BAD_REQUEST');
      }

      // Check completeness: all details must have CRM standard results filled
      const details = await db('calibration_details as detail')
        .join('master_parameters as parameter', 'parameter.id', 'detail.parameter_id')
        .where('detail.calibration_id', id)
        .select('detail.*', 'parameter.name as parameter_name');
      if (!details.length) {
        throw createError('Cannot submit calibration with no parameters selected.', 'E_BAD_REQUEST');
      }

      const detailIds = details.map((d: any) => d.id);
      const standards = await db('calibration_detail_standards').whereIn('calibration_detail_id', detailIds);

      for (const d of details) {
        const paramStandards = standards.filter((s: any) => s.calibration_detail_id === d.id);
        if (!paramStandards.length) {
          throw createError(`Parameter detail ID ${d.id} is missing CRM standards.`, 'E_BAD_REQUEST');
        }
        for (const ps of paramStandards) {
          if (ps.calibration_result === null || ps.calibration_result === undefined) {
            throw createError(`Calibration result for CRM standard '${ps.crm_name}' is missing.`, 'E_BAD_REQUEST');
          }
        }
      }

      // Persist the server-derived result as part of the same finalization
      // transaction. Older reports may have complete standard readings while
      // calibration_details.calculation_result is still null.
      await db.transaction(async (trx) => {
        for (const detail of details) {
          const paramStandards = standards.filter((standard: any) => standard.calibration_detail_id === detail.id);
          const calculationResult = deriveCalibrationStatus(detail.parameter_name, paramStandards);
          if (!calculationResult) {
            throw createError(`Unable to calculate result for parameter '${detail.parameter_name}'.`, 'E_BAD_REQUEST');
          }
          await trx('calibration_details').where({ id: detail.id }).update({
            calculation_result: calculationResult,
            updated_at: nowWib()
          });
        }

        await trx('calibrations').where({ id }).update({
          status: 'submitted',
          updated_at: nowWib()
        });
      });

      return sendResponseCustom(res, {
        success: true,
        message: 'Calibration report submitted successfully',
        data: { id, status: 'submitted' }
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Approve Calibration
   * POST /calibrations/:id/approve
   */
  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const calibration = await db('calibrations').where({ id }).first();
      if (!calibration) {
        throw createError('Calibration report not found', 'E_NOT_FOUND');
      }

      if (calibration.status !== 'submitted') {
        throw createError('Only submitted calibration reports can be approved', 'E_BAD_REQUEST');
      }

      await db('calibrations').where({ id }).update({
        status: 'approved',
        updated_at: nowWib()
      });

      return sendResponseCustom(res, {
        success: true,
        message: 'Calibration report approved successfully',
        data: { id, status: 'approved' }
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Public Verification Read-Only Endpoint (Anonymous access)
   * GET /verify/:uuid
   */
  async verify(req: Request, res: Response) {
    try {
      const { uuid } = req.params;

      const calibration = await db('calibrations')
        .join('stations', 'calibrations.station_id', '=', 'stations.id') // Assuming stations table has id
        .join('users', 'calibrations.officer_id', '=', 'users.id') // Assuming users table has id
        .where('calibrations.verification_uuid', uuid)
        .select(
          'calibrations.report_no',
          db.raw('calibrations.calibration_start_date::text as calibration_start_date'),
          db.raw('calibrations.calibration_end_date::text as calibration_end_date'),
          'calibrations.notes',
          'calibrations.status',
          'calibrations.verification_uuid',
          'calibrations.created_at',
          'stations.nama_stasiun as station_name',
          'stations.address as station_address',
          'stations.coordinate as station_coordinate',
          'stations.city_name as station_city',
          'users.username as officer_name'
        )
        .first();

      if (!calibration) {
        if ((req.headers.accept || '').includes('text/html')) {
          return res.status(404).send(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Verification Not Found</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#1a202c;}h1{margin-bottom:12px;}p{line-height:1.6;}</style></head><body><h1>Data tidak ditemukan</h1><p>Kalibrasi dengan tautan ini tidak tersedia atau sudah kadaluwarsa.</p></body></html>`);
        }
        throw createError('Verification report not found', 'E_NOT_FOUND');
      }

      // Retrieve public details
      const rawCalibration = await db('calibrations').where('verification_uuid', uuid).first();
      const details = await db('calibration_details')
        .join('master_parameters', 'calibration_details.parameter_id', '=', 'master_parameters.id')
        .where('calibration_details.calibration_id', rawCalibration.id)
        .select(
          'calibration_details.id',
          'master_parameters.name as parameter_name',
          'master_parameters.unit as parameter_unit',
          'calibration_details.coeff_type',
          'calibration_details.coefficients',
          'calibration_details.crm_reference_value',
          'calibration_details.crm_reading_value',
          'calibration_details.calculation_result'
        );

      const detailIds = details.map((d: any) => d.id);
      let standards: any[] = [];
      if (detailIds.length > 0) {
        standards = await db('calibration_detail_standards')
          .whereIn('calibration_detail_id', detailIds)
          .select('calibration_detail_id', 'crm_name', 'crm_standard_value', 'calibration_result');
      }

      const waterSamples = await db('water_samples')
        .where('calibration_id', rawCalibration.id);

      const previewData = {
        ...calibration,
        details: details.map((d: any) => {
          const detailStandards = standards.filter((s: any) => s.calibration_detail_id === d.id);
          return {
            ...d,
            calculation_result: deriveCalibrationStatus(d.parameter_name, detailStandards) || d.calculation_result || null,
            standards: detailStandards
          };
        }),
        waterSamples
      };

      if ((req.headers.accept || '').includes('text/html')) {
        const fs = require('fs');
        const path = require('path');
        const templatePath = path.resolve(process.cwd(), 'src', 'views', 'Calibration_Report.html');
        let html = fs.readFileSync(templatePath, 'utf8');

        const cssPath = path.resolve(process.cwd(), 'src', 'views', 'Calibration_Report.css');
        if (fs.existsSync(cssPath)) {
          const cssContent = fs.readFileSync(cssPath, 'utf8');
          html = html.replace('<link rel="stylesheet" href="Calibration_Report.css">', `<style>${cssContent}</style>`);
        }

        const publicUrl = getVerificationUrl(req, calibration.verification_uuid);
        const qrImage = await QRCode.toDataURL(publicUrl, { errorCorrectionLevel: 'H', type: 'image/png', width: 93, margin: 1 });

        const calRows = previewData.details.map((d: any) => {
          const unit = d.parameter_unit || (d.parameter_name === 'pH' ? 'Unit' : '');
          const masterStandards = d.standards;
          const standardLines = masterStandards.map((s: any) =>
            formatStandardLabel(s, d.parameter_name, d.parameter_unit)
          );
          if (!standardLines.some((line) => /CRM\s/i.test(line)) && d.crm_reference_value !== null && d.crm_reference_value !== undefined) {
            standardLines.push(`CRM ${formatStandardValue(d.crm_reference_value, d.parameter_name, d.parameter_unit)}`);
          }
          const standardsColumn = standardLines.join('<br>') || '-';

          const readingLines: string[] = [];
          for (const s of masterStandards) {
            const name = (s.crm_name || '').toString();
            if (!/crm/i.test(name)) {
              if (s.calibration_result === null || s.calibration_result === undefined) {
                readingLines.push('-');
              } else {
                readingLines.push(formatReadingValue(s.calibration_result));
              }
            }
          }
          const crmStd = masterStandards.find((s: any) => /crm/i.test((s.crm_name || '').toString()));
          if (d.crm_reading_value !== null && d.crm_reading_value !== undefined) {
            readingLines.push(`${formatReadingValue(d.crm_reading_value)} ${unit}`.trim());
          } else if (crmStd && crmStd.calibration_result !== null && crmStd.calibration_result !== undefined) {
            readingLines.push(formatReadingValue(crmStd.calibration_result));
          }
          const readingsColumn = readingLines.join('<br>') || '-';

          let coeffText = '-';
          if (d.coefficients) {
            const coeffs = typeof d.coefficients === 'string' ? JSON.parse(d.coefficients) : d.coefficients;
            if (d.parameter_name === 'pH') {
              const pairs = [['k1', 'k2'], ['k3', 'k4'], ['k5', 'k6']];
              coeffText = pairs.map((pair) => pair
                .map((key) => coeffs[key] !== undefined ? `<strong>${key.toUpperCase()}:</strong> ${coeffs[key]}` : null)
                .filter(Boolean)
                .join(' | ')
              ).filter(Boolean).join('<br>') || '-';
            } else {
              coeffText = Object.entries(coeffs).map(([k, v]) => `<strong>${k.toUpperCase()}:</strong> ${v}`).join('<br>') || '-';
            }
          }

          const calculationStatus = deriveCalibrationStatus(d.parameter_name, masterStandards) || d.calculation_result || null;
          const resultColumn = formatCalibrationStatus(calculationStatus);

          return `
            <tr>
              <td class="font-bold">${d.parameter_name} Calibration</td>
              <td class="text-center">${standardsColumn}</td>
              <td class="text-center">${readingsColumn}</td>
              <td class="text-center">${coeffText}</td>
              <td class="text-center">${resultColumn}</td>
            </tr>
          `;
        }).join('');

        const sampleTable = renderWaterSampleTable(previewData.details, previewData.waterSamples);

        const formattedDate = formatCalibrationDateRange(
          calibration.calibration_start_date,
          calibration.calibration_end_date
        );
        const place = formatReportPlace(calibration.station_city || calibration.station_address);
        const placeDate = `${place}, ${formatReportDate(calibration.calibration_end_date)}`;

        html = renderCalibrationReportHtml(html, {
          reportNo: calibration.report_no,
          stationName: calibration.station_name,
          calibrationStartDate: calibration.calibration_start_date,
          calibrationEndDate: calibration.calibration_end_date,
          stationAddress: calibration.station_address,
          stationCoordinate: calibration.station_coordinate,
          stationCity: calibration.station_city,
          officerName: calibration.officer_name,
          notes: calibration.notes,
          qrCodeImage: qrImage,
          details: previewData.details.map((detail: any) => ({
            parameterName: detail.parameter_name,
            parameterUnit: detail.parameter_unit,
            standards: detail.standards.map((standard: any) => ({
              crmName: standard.crm_name,
              crmStandardValue: standard.crm_standard_value,
              calibrationResult: standard.calibration_result
            })),
            crmReferenceValue: detail.crm_reference_value,
            crmReadingValue: detail.crm_reading_value,
            coefficients: detail.coefficients,
            calculationStatus: deriveCalibrationStatus(detail.parameter_name, detail.standards) || detail.calculation_result || null
          })),
          waterSamples: previewData.waterSamples
        });

        return res.send(html);
      }

      return sendResponseCustom(res, {
        success: true,
        data: previewData
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Render HTML Calibration Report for Printing
   * GET /calibrations/:id/print
   */
  async print(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const fs = require('fs');
      const path = require('path');

      // 1. Fetch all data
      const calibration = await db('calibrations')
        .join('stations', 'calibrations.station_id', '=', 'stations.id')
        .join('users', 'calibrations.officer_id', '=', 'users.id')
        .where('calibrations.id', id)
        .select(
          'calibrations.*',
          'stations.nama_stasiun as station_name',
          'stations.address as station_address',
          'stations.coordinate as station_coordinate',
          'stations.city_name as station_city',
          'users.username as officer_name'
        )
        .first();

      if (!calibration) {
        return res.status(404).send('Laporan kalibrasi tidak ditemukan.');
      }

      const details = await db('calibration_details')
        .join('master_parameters', 'calibration_details.parameter_id', '=', 'master_parameters.id')
        .where('calibration_details.calibration_id', id)
        .select(
          'calibration_details.*',
          'master_parameters.name as parameter_name',
          'master_parameters.unit as parameter_unit'
        );

      const detailIds = details.map((d: any) => d.id);
      let standards: any[] = [];
      if (detailIds.length > 0) {
        standards = await db('calibration_detail_standards')
          .whereIn('calibration_detail_id', detailIds);
      }

      const waterSamples = await db('water_samples')
        .where('calibration_id', id);

      // 2. Read template
      const candidateTemplates = [
        path.resolve(process.cwd(), 'src/views/Calibration_Report.html'),
        path.resolve(process.cwd(), 'build/views/Calibration_Report.html')
      ];
      const templatePath = candidateTemplates.find((p) => fs.existsSync(p));
      if (!templatePath) {
        return res.status(500).send('Template laporan kalibrasi tidak ditemukan.');
      }
      let html = fs.readFileSync(templatePath, 'utf8');

      // 3. Generate public QR code image for the verification preview URL
      const publicUrl = getVerificationUrl(req, calibration.verification_uuid);
      const qrImage = await QRCode.toDataURL(publicUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 93,
        margin: 1,
      });

      // 3. Construct Calibration Details Table Rows
      let calRows = '';
      const renderDetails: any[] = [];
      for (const d of details) {
        const storedStandards = standards.filter((s: any) => s.calibration_detail_id === d.id);
        const masterStandards = await getMasterSolutionStandards(db, d.parameter_name);
        const paramStandards = masterStandards.map((masterStandard) => {
          const storedStandard = storedStandards.find((standard: any) => standard.crm_name === masterStandard.crm_name);
          return storedStandard ? {
            ...storedStandard,
            crm_standard_value: masterStandard.crm_standard_value
          } : masterStandard;
        });
        const unit = d.parameter_unit || (d.parameter_name === 'pH' ? 'Unit' : '');

        // crm_name is already a display-ready label from the master standard value.
        const standardLines = paramStandards.map((s: any) =>
          formatStandardLabel(s, d.parameter_name, d.parameter_unit)
        );
        if (!standardLines.some((line) => /CRM\s/i.test(line)) && d.crm_reference_value !== null && d.crm_reference_value !== undefined) {
          standardLines.push(`CRM ${formatStandardValue(d.crm_reference_value, d.parameter_name, d.parameter_unit)}`);
        }
        const standardsColumn = standardLines.join('<br>') || '-';

        // Hasil Pembacaan: list calibration_result for solutions and CRM reading (crm_reading_value)
        const readingLines: string[] = [];
        for (const s of paramStandards) {
          const name = (s.crm_name || '').toString();
          if (!/crm/i.test(name)) {
            if (s.calibration_result === null || s.calibration_result === undefined) {
              readingLines.push('-');
            } else {
              readingLines.push(formatReadingValue(s.calibration_result));
            }
          }
        }
        // CRM reading (explicit reading value preferred)
        const crmStd = paramStandards.find((s: any) => /crm/i.test((s.crm_name || '').toString()));
        if (d.crm_reading_value !== null && d.crm_reading_value !== undefined) {
          readingLines.push(`${formatReadingValue(d.crm_reading_value)} ${unit}`.trim());
        } else if (crmStd && (crmStd.calibration_result !== null && crmStd.calibration_result !== undefined)) {
          readingLines.push(formatReadingValue(crmStd.calibration_result));
        }
        const readingsColumn = readingLines.join('<br>') || '-';

        // Internal Coeff (K/B) - ensure pH displays K1..K6 if present
        let coeffText = '-';
        if (d.coefficients) {
          const coeffs = typeof d.coefficients === 'string' ? JSON.parse(d.coefficients) : d.coefficients;
          if (d.parameter_name === 'pH') {
            const pairs = [['k1', 'k2'], ['k3', 'k4'], ['k5', 'k6']];
            coeffText = pairs.map((pair) => pair
              .map((key) => coeffs[key] !== undefined ? `<strong>${key.toUpperCase()}:</strong> ${coeffs[key]}` : null)
              .filter(Boolean)
              .join(' | ')
            ).filter(Boolean).join('<br>') || '-';
          } else {
            coeffText = Object.entries(coeffs).map(([k, v]) => `<strong>${k.toUpperCase()}:</strong> ${v}`).join('<br>') || '-';
          }
        }

        const calculationStatus = deriveCalibrationStatus(d.parameter_name, paramStandards) || d.calculation_result || null;
        const resultColumn = formatCalibrationStatus(calculationStatus);

        renderDetails.push({
          parameterName: d.parameter_name,
          parameterUnit: d.parameter_unit,
          standards: paramStandards.map((standard: any) => ({
            crmName: standard.crm_name,
            crmStandardValue: standard.crm_standard_value,
            calibrationResult: standard.calibration_result
          })),
          crmReferenceValue: d.crm_reference_value,
          crmReadingValue: d.crm_reading_value,
          coefficients: d.coefficients,
          calculationStatus
        });

        calRows += `
          <tr>
            <td class="font-bold">${d.parameter_name} Calibration</td>
            <td class="text-center">${standardsColumn}</td>
            <td class="text-center">${readingsColumn}</td>
            <td class="text-center">${coeffText}</td>
            <td class="text-center">${resultColumn}</td>
          </tr>
        `;
      }

      // 4. Construct Water Samples Table Rows
      const sampleTable = renderWaterSampleTable(details, waterSamples);

      // 4a. Inline CSS if external stylesheet exists (so puppeteer can render correctly)
      try {
        const cssPath = path.resolve(path.dirname(templatePath), 'Calibration_Report.css');
        if (fs.existsSync(cssPath)) {
          const cssContent = fs.readFileSync(cssPath, 'utf8');
          html = html.replace('<link rel="stylesheet" href="Calibration_Report.css">', `<style>${cssContent}</style>`);
        }
      } catch (e) {
        // ignore CSS inlining errors and continue
      }

      // 5. Replace placeholders in HTML template
      const formattedDate = formatCalibrationDateRange(
        calibration.calibration_start_date,
        calibration.calibration_end_date
      );

      const place = formatReportPlace(calibration.station_city || calibration.station_address);
      const placeDate = `${place}, ${formatReportDate(calibration.calibration_end_date)}`;

      html = renderCalibrationReportHtml(html, {
        reportNo: calibration.report_no,
        stationName: calibration.station_name,
        calibrationStartDate: calibration.calibration_start_date,
        calibrationEndDate: calibration.calibration_end_date,
        stationAddress: calibration.station_address,
        stationCoordinate: calibration.station_coordinate,
        stationCity: calibration.station_city,
        officerName: calibration.officer_name,
        notes: calibration.notes,
        qrCodeImage: qrImage,
        details: renderDetails,
        waterSamples
      });

      // Generate PDF using puppeteer
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '12mm', right: '15mm', bottom: '12mm', left: '15mm' } });
        res.setHeader('Content-Type', 'application/pdf');
        const filename = buildCalibrationPdfFilename(calibration.report_no, id);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(pdfBuffer);
      } finally {
        await browser.close();
      }
    } catch (error: any) {
      return res.status(500).send('Gagal membuat PDF laporan kalibrasi.');
    }
  }
}

export default new CalibrationController();
