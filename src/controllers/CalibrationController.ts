import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { db, sendResponseCustom, sendResponseError, createError, nowWib } from '../utils/util';
import { CalibrationRepository } from '../repositories/CalibrationRepository';
import { CalibrationService } from '../services/CalibrationService';
import { evaluateStandardMeasurement, getCalibrationSpecification } from '../helpers/CalibrationCalculator';
import { ensureDefaultSolutionStandardsForDetail, getMasterSolutionStandards } from '../helpers/CalibrationDefaults';
import { getCalibrationPdfResponseContract, renderCalibrationReportHtml } from '../helpers/CalibrationReportRenderer';
import {
  CALIBRATION_MESSAGES,
  getVerificationUrl,
  isCalibrationEditableStatus,
  localizeCalibrationControllerError,
  sanitizeCalibrationRecordNotes,
  sanitizeCalibrationWriteNotes
} from '../helpers/CalibrationApiContract';

const calibrationRepository = new CalibrationRepository(db);
const calibrationService = new CalibrationService(calibrationRepository);

function normalizeCoefficients(coefficients: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(coefficients).map(([key, value]) => [key.toLowerCase(), value])
  );
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
      return sendResponseError(res, localizeCalibrationControllerError(error));
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
        throw createError(CALIBRATION_MESSAGES.requiredFields, 'E_BAD_REQUEST');
      }

      if (new Date(calibration_end_date) < new Date(calibration_start_date)) {
        throw createError(CALIBRATION_MESSAGES.invalidDateRange, 'E_BAD_REQUEST');
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
        message: CALIBRATION_MESSAGES.draftCreated,
        data: {
          ...sanitizeCalibrationRecordNotes(data),
          verification_url: verificationUrl,
          qr_code_data_url: qrCodeDataUrl
        }
      });
    } catch (error: any) {
      return sendResponseError(res, localizeCalibrationControllerError(error));
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
        data: calibrations.map((calibration: any) => sanitizeCalibrationRecordNotes(calibration)),
        total: parseInt(count as string)
      });
    } catch (error: any) {
      return sendResponseError(res, localizeCalibrationControllerError(error));
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
        throw createError(CALIBRATION_MESSAGES.reportNotFound, 'E_NOT_FOUND');
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
          ...sanitizeCalibrationRecordNotes(calibration),
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
      return sendResponseError(res, localizeCalibrationControllerError(error));
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
        throw createError(CALIBRATION_MESSAGES.reportNotFound, 'E_NOT_FOUND');
      }

      if (!isCalibrationEditableStatus(calibration.status)) {
        throw createError(CALIBRATION_MESSAGES.updateBeforeApprovalOnly, 'E_BAD_REQUEST');
      }

      await db.transaction(async (trx) => {
        // Update header fields
        const headerUpdate: any = { updated_at: nowWib() };
        if (calibration_start_date !== undefined) headerUpdate.calibration_start_date = calibration_start_date;
        if (calibration_end_date !== undefined) headerUpdate.calibration_end_date = calibration_end_date;
        const effectiveStartDate = calibration_start_date || calibration.calibration_start_date;
        const effectiveEndDate = calibration_end_date || calibration.calibration_end_date;
        if (new Date(effectiveEndDate) < new Date(effectiveStartDate)) {
          throw createError(CALIBRATION_MESSAGES.invalidDateRange, 'E_BAD_REQUEST');
        }
        if (notes !== undefined) headerUpdate.notes = sanitizeCalibrationWriteNotes(notes);

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
        message: calibration.status === 'draft' ? CALIBRATION_MESSAGES.draftUpdated : CALIBRATION_MESSAGES.reportUpdated,
        data: sanitizeCalibrationRecordNotes(updated)
      });
    } catch (error: any) {
      return sendResponseError(res, localizeCalibrationControllerError(error));
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
        throw createError(CALIBRATION_MESSAGES.reportNotFound, 'E_NOT_FOUND');
      }

      if (calibration.status !== 'draft') {
        throw createError(CALIBRATION_MESSAGES.deleteDraftOnly, 'E_BAD_REQUEST');
      }

      await db('calibrations').where({ id }).del();

      return sendResponseCustom(res, {
        success: true,
        message: CALIBRATION_MESSAGES.reportDeleted
      });
    } catch (error: any) {
      return sendResponseError(res, localizeCalibrationControllerError(error));
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
        throw createError(CALIBRATION_MESSAGES.reportNotFound, 'E_NOT_FOUND');
      }

      if (calibration.status !== 'draft') {
        throw createError(CALIBRATION_MESSAGES.submitDraftOnly, 'E_BAD_REQUEST');
      }

      // Check completeness: all details must have CRM standard results filled
      const details = await db('calibration_details as detail')
        .join('master_parameters as parameter', 'parameter.id', 'detail.parameter_id')
        .where('detail.calibration_id', id)
        .select('detail.*', 'parameter.name as parameter_name');
      if (!details.length) {
        throw createError(CALIBRATION_MESSAGES.noParameters, 'E_BAD_REQUEST');
      }

      const detailIds = details.map((d: any) => d.id);
      const standards = await db('calibration_detail_standards').whereIn('calibration_detail_id', detailIds);

      for (const d of details) {
        const paramStandards = standards.filter((s: any) => s.calibration_detail_id === d.id);
        if (!paramStandards.length) {
          throw createError(CALIBRATION_MESSAGES.parameterStandardsMissing(d.id), 'E_BAD_REQUEST');
        }
        for (const ps of paramStandards) {
          if (ps.calibration_result === null || ps.calibration_result === undefined) {
            throw createError(CALIBRATION_MESSAGES.calibrationResultMissing(ps.crm_name), 'E_BAD_REQUEST');
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
            throw createError(CALIBRATION_MESSAGES.calculationUnavailable(detail.parameter_name), 'E_BAD_REQUEST');
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
        message: CALIBRATION_MESSAGES.reportSubmitted,
        data: { id, status: 'submitted' }
      });
    } catch (error: any) {
      return sendResponseError(res, localizeCalibrationControllerError(error));
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
        throw createError(CALIBRATION_MESSAGES.reportNotFound, 'E_NOT_FOUND');
      }

      if (calibration.status !== 'submitted') {
        throw createError(CALIBRATION_MESSAGES.approvalSubmittedOnly, 'E_BAD_REQUEST');
      }

      await db('calibrations').where({ id }).update({
        status: 'approved',
        updated_at: nowWib()
      });

      return sendResponseCustom(res, {
        success: true,
        message: CALIBRATION_MESSAGES.reportApproved,
        data: { id, status: 'approved' }
      });
    } catch (error: any) {
      return sendResponseError(res, localizeCalibrationControllerError(error));
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
          return res.status(404).send(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Verifikasi Kalibrasi Tidak Ditemukan</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#1a202c;}h1{margin-bottom:12px;}p{line-height:1.6;}</style></head><body><h1>Data tidak ditemukan</h1><p>Kalibrasi dengan tautan ini tidak tersedia atau sudah kedaluwarsa.</p></body></html>`);
        }
        throw createError(CALIBRATION_MESSAGES.verificationNotFound, 'E_NOT_FOUND');
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
        ...sanitizeCalibrationRecordNotes(calibration),
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
      return sendResponseError(res, localizeCalibrationControllerError(error));
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
        return res.status(404).send(getCalibrationPdfResponseContract(null, id).notFoundMessage);
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
        return res.status(500).send(getCalibrationPdfResponseContract(null, id).templateNotFoundMessage);
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

      // 3. Prepare report details with canonical standard values.
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
        const calculationStatus = deriveCalibrationStatus(d.parameter_name, paramStandards) || d.calculation_result || null;

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

      }

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
        const responseContract = getCalibrationPdfResponseContract(calibration.report_no, id);
        res.setHeader('Content-Type', responseContract.contentType);
        res.setHeader('Content-Disposition', responseContract.contentDisposition);
        return res.send(pdfBuffer);
      } finally {
        await browser.close();
      }
    } catch (error: any) {
      return res.status(500).send(getCalibrationPdfResponseContract(null, req.params.id).renderErrorMessage);
    }
  }
}

export default new CalibrationController();
