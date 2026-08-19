import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { db, sendResponseCustom, sendResponseError, createError, nowWib } from '../utils/util';
import { CalibrationRepository } from '../repositories/CalibrationRepository';
import { CalibrationService } from '../services/CalibrationService';
import { evaluateStandardMeasurement, getCalibrationSpecification } from '../helpers/CalibrationCalculator';
import { ensureDefaultSolutionStandardsForDetail, getMasterSolutionStandards } from '../helpers/CalibrationDefaults';
import { getCalibrationPdfResponseContract, renderCalibrationReportHtml } from '../helpers/CalibrationReportRenderer';
import {
  generateSignedPreviewUrl,
  verifyMediaSignature,
  ensureDirectoryExistence,
  computeSha256Checksum
} from '../helpers/CalibrationDocumentationHelper';
import {
  CALIBRATION_MESSAGES,
  getCalibrationCompletenessError,
  getCalibrationDetailLookup,
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
    const standardValue = Number(standard.crm_standard_value ?? standard.crm_name);
    return Number.isFinite(standardValue) && standardValue === requestedValue;
  });
}

export class CalibrationController {
  /**
   * Get Master Parameters and Solutions for Calibration
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
      const user = req.user as { user_id: string; role_id: string } | undefined;
      const isEngineer = user?.role_id === 'eng';

      const query = db('calibrations')
        .join('stations', 'calibrations.station_id', '=', 'stations.id')
        .join('users', 'calibrations.officer_id', '=', 'users.id')
        .select(
          'calibrations.id',
          'calibrations.report_no',
          'calibrations.station_id',
          db.raw('calibrations.calibration_start_date::text as calibration_start_date'),
          db.raw('calibrations.calibration_end_date::text as calibration_end_date'),
          'calibrations.notes',
          'calibrations.status',
          'calibrations.verification_uuid',
          'calibrations.created_at',
          'stations.nama_stasiun as station_name',
          'users.username as officer_name'
        )
        .orderBy('calibrations.created_at', 'desc')
        .limit(Number(limit))
        .offset(Number(offset));

      if (status) {
        query.where('calibrations.status', status);
      }

      const calibrations = await query;

      const [{ count }] = await db('calibrations')
        .modify((qb) => {
          if (status) qb.where('status', status);
          if (isEngineer && user?.user_id) qb.where('officer_id', user.user_id);
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

      // Fetch standard/CRM details and documentations for each parameter detail
      const detailIds = details.map((d: any) => d.id);
      let standards: any[] = [];
      let documentations: any[] = [];
      if (detailIds.length > 0) {
        standards = await db('calibration_detail_standards')
          .whereIn('calibration_detail_id', detailIds);
        documentations = await db('calibration_documentations')
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
              standards: canonicalStandards,
              documentation: documentations
                .filter((doc: any) => doc.calibration_detail_id === d.id)
                .map((doc: any) => ({
                  id: doc.id,
                  calibration_detail_id: doc.calibration_detail_id,
                  parameter_id: d.parameter_id,
                  photo_type: doc.photo_type,
                  preview_url: generateSignedPreviewUrl(req, doc.id),
                  mime_type: doc.mime_type || 'image/webp',
                  file_size: doc.file_size,
                  width: doc.width || null,
                  height: doc.height || null,
                  checksum: `sha256:${doc.checksum}`,
                  uploaded_at: doc.created_at
                }))
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

      let calibrationStatus: string;

      await db.transaction(async (trx) => {
        const calibration = await trx('calibrations').where({ id }).forUpdate().first();
        if (!calibration) {
          throw createError(CALIBRATION_MESSAGES.reportNotFound, 'E_NOT_FOUND');
        }
        if (!isCalibrationEditableStatus(calibration.status)) {
          throw createError(CALIBRATION_MESSAGES.updateBeforeApprovalOnly, 'E_BAD_REQUEST');
        }
        calibrationStatus = calibration.status;

        const updatedCalibrationFields: any = {
          notes: sanitizeCalibrationWriteNotes(notes),
          updated_at: nowWib()
        };

        if (calibration_start_date) updatedCalibrationFields.calibration_start_date = calibration_start_date;
        if (calibration_end_date) updatedCalibrationFields.calibration_end_date = calibration_end_date;

        if (updatedCalibrationFields.calibration_start_date && updatedCalibrationFields.calibration_end_date) {
          if (new Date(updatedCalibrationFields.calibration_end_date) < new Date(updatedCalibrationFields.calibration_start_date)) {
            throw createError(CALIBRATION_MESSAGES.invalidDateRange, 'E_BAD_REQUEST');
          }
        }

        await trx('calibrations').where({ id }).update(updatedCalibrationFields);

        // 1b. Handle parameter sync if parameter_ids provided
        if (parameter_ids && Array.isArray(parameter_ids)) {
          const currentDetails = await trx('calibration_details').where({ calibration_id: id });
          const currentParamIds = currentDetails.map((d: any) => d.parameter_id);

          const paramsToRemove = currentDetails.filter((d: any) => !parameter_ids.includes(d.parameter_id));
          if (paramsToRemove.length > 0) {
            await trx('calibration_details').whereIn('id', paramsToRemove.map((d: any) => d.id)).delete();
          }

          const paramsToAdd = parameter_ids.filter((pId: number) => !currentParamIds.includes(pId));
          if (paramsToAdd.length > 0) {
            const newDetailsData = paramsToAdd.map((paramId: number) => ({
              calibration_id: id,
              parameter_id: paramId
            }));
            await trx('calibration_details').insert(newDetailsData);

            const insertedDetails = await trx('calibration_details')
              .join('master_parameters', 'calibration_details.parameter_id', '=', 'master_parameters.id')
              .select('calibration_details.id as detail_id', 'master_parameters.name as parameter_name')
              .where('calibration_details.calibration_id', id)
              .whereIn('calibration_details.parameter_id', paramsToAdd);

            for (const newDetail of insertedDetails) {
              await ensureDefaultSolutionStandardsForDetail(trx, newDetail.detail_id, newDetail.parameter_name);
            }
          }
        }

        // 2. Update Details & Standards
        if (details && Array.isArray(details)) {
          for (const d of details) {
            const currentDetail = await trx('calibration_details as detail')
              .join('master_parameters as parameter', 'parameter.id', 'detail.parameter_id')
              .where('detail.calibration_id', id)
              .modify((qb) => {
                if (d.id && d.id > 0) {
                  qb.where('detail.id', d.id);
                } else if (d.parameter_id) {
                  qb.where('detail.parameter_id', d.parameter_id);
                }
              })
              .select('detail.*', 'parameter.name as parameter_name')
              .first();

            if (!currentDetail) continue;

            const detailId = currentDetail.id;
            const updatedFields: any = { updated_at: nowWib() };
            if (d.coeff_type !== undefined) updatedFields.coeff_type = d.coeff_type;
            if (d.coefficients !== undefined) {
              updatedFields.coefficients = typeof d.coefficients === 'object' && d.coefficients !== null
                ? JSON.stringify(normalizeCoefficients(d.coefficients))
                : d.coefficients;
            }
            if (d.remark !== undefined) updatedFields.remark = d.remark;
            if (d.crm_reference_value !== undefined) updatedFields.crm_reference_value = d.crm_reference_value;
            if (d.crm_reading_value !== undefined) updatedFields.crm_reading_value = d.crm_reading_value;

            if (d.standards && Array.isArray(d.standards)) {
              const currentStandards = await trx('calibration_detail_standards')
                .where({ calibration_detail_id: detailId });
              const masterStandards = await getMasterSolutionStandards(trx, currentDetail.parameter_name);

              for (const std of d.standards) {
                const existingStandard = findStandardByName(currentStandards, std.crm_name);
                const masterStandard = findStandardByName(masterStandards, std.crm_name);
                const standardValue = masterStandard?.crm_standard_value ?? existingStandard?.crm_standard_value ?? null;
                const standardName = masterStandard?.crm_name ?? existingStandard?.crm_name ?? String(std.crm_name);

                if (existingStandard) {
                  const stdUpdatedFields: any = {
                    crm_name: standardName,
                    crm_standard_value: standardValue,
                    updated_at: nowWib()
                  };
                  if (std.calibration_result !== undefined) stdUpdatedFields.calibration_result = std.calibration_result;
                  await trx('calibration_detail_standards')
                    .where({ id: existingStandard.id })
                    .update(stdUpdatedFields);
                } else if (masterStandard) {
                  await trx('calibration_detail_standards').insert({
                    calibration_detail_id: detailId,
                    crm_name: standardName,
                    crm_standard_value: standardValue,
                    calibration_result: std.calibration_result ?? null,
                    created_at: nowWib(),
                    updated_at: nowWib()
                  });
                }
              }

              const refreshedStandards = await trx('calibration_detail_standards')
                .where({ calibration_detail_id: detailId });
              const canonicalRefreshedStandards = masterStandards.map((masterStandard) => {
                const matchedStandard = refreshedStandards.find((standard: any) => standard.crm_name === masterStandard.crm_name);
                return matchedStandard ? {
                  ...matchedStandard,
                  crm_standard_value: masterStandard.crm_standard_value
                } : masterStandard;
              });

              updatedFields.calculation_result = deriveCalibrationStatus(currentDetail.parameter_name, canonicalRefreshedStandards);
            }

            await trx('calibration_details')
              .where({ id: detailId })
              .update(updatedFields);
          }
        }

        // 3. Update Water Samples
        if (waterSamples && Array.isArray(waterSamples)) {
          const incomingIds = waterSamples.filter((ws: any) => ws.id).map((ws: any) => ws.id);
          await trx('water_samples')
            .where({ calibration_id: id })
            .whereNotIn('id', incomingIds)
            .delete();

          for (const ws of waterSamples) {
            const sampleFields = {
              sample_name: ws.sample_name,
              suhu: ws.suhu !== undefined ? ws.suhu : null,
              do: ws.do !== undefined ? ws.do : null,
              tur: ws.tur !== undefined ? ws.tur : null,
              tds: ws.tds !== undefined ? ws.tds : null,
              ph: ws.ph !== undefined ? ws.ph : null,
              orp: ws.orp !== undefined ? ws.orp : null,
              tss: ws.tss !== undefined ? ws.tss : null,
              bod: ws.bod !== undefined ? ws.bod : null,
              cod: ws.cod !== undefined ? ws.cod : null,
              amonia: ws.amonia !== undefined ? ws.amonia : null,
              nitrat: ws.nitrat !== undefined ? ws.nitrat : null,
              nitrit: ws.nitrit !== undefined ? ws.nitrit : null,
              kedalaman: ws.kedalaman !== undefined ? ws.kedalaman : null,
              updated_at: nowWib()
            };

            if (ws.id) {
              await trx('water_samples')
                .where({ id: ws.id, calibration_id: id })
                .update(sampleFields);
            } else {
              await trx('water_samples').insert({
                ...sampleFields,
                calibration_id: id,
                created_at: nowWib()
              });
            }
          }
        }
      });

      return sendResponseCustom(res, {
        success: true,
        message: calibrationStatus! === 'draft'
          ? CALIBRATION_MESSAGES.draftUpdated
          : CALIBRATION_MESSAGES.reportUpdated,
        data: { id, updated_at: nowWib() }
      });
    } catch (error: any) {
      return sendResponseError(res, localizeCalibrationControllerError(error));
    }
  }

  /**
   * Delete Draft Calibration
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

      // Clean up files on disk if any
      const docs = await db('calibration_documentations').where({ calibration_id: id });
      for (const doc of docs) {
        if (doc.storage_key && fs.existsSync(doc.storage_key)) {
          try { fs.unlinkSync(doc.storage_key); } catch (e) {}
        }
      }

      await db('calibrations').where({ id }).delete();

      return sendResponseCustom(res, {
        success: true,
        message: CALIBRATION_MESSAGES.reportDeleted
      });
    } catch (error: any) {
      return sendResponseError(res, localizeCalibrationControllerError(error));
    }
  }

  /**
   * Submit Draft Calibration
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

      // Validate Before photo documentation completeness
      const documentations = await db('calibration_documentations')
        .where('calibration_id', id)
        .andWhere('photo_type', 'before');

      for (const d of details) {
        const hasBeforePhoto = documentations.some((doc: any) => doc.calibration_detail_id === d.id);
        if (!hasBeforePhoto) {
          throw createError(`Foto dokumentasi 'Before Calibration' untuk parameter '${d.parameter_name}' wajib diunggah sebelum diajukan.`, 'E_BAD_REQUEST');
        }
      }

      // Persist the server-derived result as part of the same finalization transaction
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

      await db.transaction(async (trx) => {
        const calibration = await trx('calibrations').where({ id }).forUpdate().first();
        if (!calibration) {
          throw createError(CALIBRATION_MESSAGES.reportNotFound, 'E_NOT_FOUND');
        }
        if (calibration.status !== 'submitted') {
          throw createError(CALIBRATION_MESSAGES.approvalSubmittedOnly, 'E_BAD_REQUEST');
        }

        const details = await trx('calibration_details as detail')
          .join('master_parameters as parameter', 'parameter.id', 'detail.parameter_id')
          .where('detail.calibration_id', id)
          .select('detail.*', 'parameter.name as parameter_name');
        const detailIds = details.map((detail: any) => detail.id);
        const standards = detailIds.length
          ? await trx('calibration_detail_standards').whereIn('calibration_detail_id', detailIds)
          : [];
        const completenessError = getCalibrationCompletenessError(details, standards);
        if (completenessError) {
          throw createError(completenessError, 'E_BAD_REQUEST');
        }

        for (const detail of details) {
          const detailStandards = standards.filter((standard: any) => standard.calibration_detail_id === detail.id);
          const calculationResult = deriveCalibrationStatus(detail.parameter_name, detailStandards);
          if (!calculationResult) {
            throw createError(CALIBRATION_MESSAGES.calculationUnavailable(detail.parameter_name), 'E_BAD_REQUEST');
          }
          await trx('calibration_details').where({ id: detail.id }).update({
            calculation_result: calculationResult,
            updated_at: nowWib()
          });
        }

        await trx('calibrations').where({ id }).update({
          status: 'approved',
          updated_at: nowWib()
        });
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
   * Upload Photo Documentation for a Detail Slot
   * POST /calibrations/:id/details/:detailId/documentation/:slot
   */
  async uploadDocumentation(req: Request, res: Response) {
    try {
      const { id, detailId, slot } = req.params;
      const photoType = String(slot).toLowerCase();

      if (photoType !== 'before' && photoType !== 'after') {
        throw createError("Slot foto hanya boleh 'before' atau 'after'.", 'E_BAD_REQUEST');
      }

      const files = (req as any).files as any[] | undefined;
      const rawFile = (req as any).file || (files && (files.find((f: any) => f.fieldname === 'file') || files[0]));

      if (!rawFile || !rawFile.buffer) {
        throw createError('File foto dokumentasi wajib diunggah.', 'E_BAD_REQUEST');
      }

      const calibration = await db('calibrations').where({ id }).first();
      if (!calibration) {
        throw createError(CALIBRATION_MESSAGES.reportNotFound, 'E_NOT_FOUND');
      }

      if (calibration.status === 'approved') {
        return res.status(409).json({
          success: false,
          message: 'Laporan kalibrasi yang sudah disetujui tidak dapat diubah fotonya.'
        });
      }

      const detail = await db('calibration_details')
        .where({ id: detailId, calibration_id: id })
        .first();

      if (!detail) {
        throw createError('Detail parameter kalibrasi tidak ditemukan.', 'E_NOT_FOUND');
      }

      const checksum = computeSha256Checksum(rawFile.buffer);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const docUuid = (crypto as any).randomUUID ? (crypto as any).randomUUID() : require('uuid').v4();
      
      const fileName = `${photoType}-${docUuid}.webp`;
      const relativeStoragePath = path.join('storage', 'calibration-docs', String(year), month, id, String(detailId), fileName);
      const absoluteStoragePath = path.resolve(process.cwd(), relativeStoragePath);

      ensureDirectoryExistence(absoluteStoragePath);
      fs.writeFileSync(absoluteStoragePath, rawFile.buffer);

      // Check for existing documentation record in this slot
      const existingDoc = await db('calibration_documentations')
        .where({ calibration_detail_id: detailId, photo_type: photoType })
        .first();

      let savedDocId = docUuid;

      if (existingDoc) {
        if (existingDoc.storage_key && existingDoc.storage_key !== absoluteStoragePath && fs.existsSync(existingDoc.storage_key)) {
          try { fs.unlinkSync(existingDoc.storage_key); } catch (e) {}
        }

        await db('calibration_documentations')
          .where({ id: existingDoc.id })
          .update({
            storage_key: absoluteStoragePath,
            mime_type: rawFile.mimetype || 'image/webp',
            file_size: rawFile.size || rawFile.buffer.length,
            checksum,
            updated_at: nowWib()
          });
        savedDocId = existingDoc.id;
      } else {
        const user = (req as any).user;
        const [inserted] = await db('calibration_documentations')
          .insert({
            id: docUuid,
            calibration_id: id,
            calibration_detail_id: Number(detailId),
            parameter_id: detail.parameter_id,
            photo_type: photoType,
            storage_key: absoluteStoragePath,
            mime_type: rawFile.mimetype || 'image/webp',
            file_size: rawFile.size || rawFile.buffer.length,
            checksum,
            uploaded_by: user?.username || user?.user_data?.username || 'Petugas',
            created_at: nowWib(),
            updated_at: nowWib()
          })
          .returning('*');

        if (inserted && inserted.id) {
          savedDocId = inserted.id;
        }
      }

      const docRecord = await db('calibration_documentations').where({ id: savedDocId }).first();

      return sendResponseCustom(res, {
        success: true,
        message: 'Foto dokumentasi kalibrasi berhasil disimpan.',
        data: {
          id: docRecord.id,
          calibration_detail_id: Number(detailId),
          parameter_id: detail.parameter_id,
          photo_type: photoType,
          preview_url: generateSignedPreviewUrl(req, docRecord.id),
          mime_type: docRecord.mime_type || 'image/webp',
          file_size: docRecord.file_size,
          width: docRecord.width || null,
          height: docRecord.height || null,
          checksum: `sha256:${docRecord.checksum}`,
          uploaded_at: docRecord.created_at
        }
      });
    } catch (error: any) {
      return sendResponseError(res, localizeCalibrationControllerError(error));
    }
  }

  /**
   * Delete Photo Documentation for a Detail Slot
   * DELETE /calibrations/:id/details/:detailId/documentation/:slot
   */
  async deleteDocumentation(req: Request, res: Response) {
    try {
      const { id, detailId, slot } = req.params;
      const photoType = String(slot).toLowerCase();

      const calibration = await db('calibrations').where({ id }).first();
      if (!calibration) {
        throw createError(CALIBRATION_MESSAGES.reportNotFound, 'E_NOT_FOUND');
      }

      if (calibration.status === 'approved') {
        return res.status(409).json({
          success: false,
          message: 'Laporan kalibrasi yang sudah disetujui tidak dapat diubah fotonya.'
        });
      }

      const existingDoc = await db('calibration_documentations')
        .where({ calibration_detail_id: detailId, photo_type: photoType })
        .first();

      if (existingDoc) {
        if (existingDoc.storage_key && fs.existsSync(existingDoc.storage_key)) {
          try { fs.unlinkSync(existingDoc.storage_key); } catch (e) {}
        }
        await db('calibration_documentations').where({ id: existingDoc.id }).delete();
      }

      return sendResponseCustom(res, {
        success: true,
        message: 'Foto dokumentasi kalibrasi berhasil dihapus.'
      });
    } catch (error: any) {
      return sendResponseError(res, localizeCalibrationControllerError(error));
    }
  }

  /**
   * Public Media Streaming with Signature Verification
   * GET /api/calibration-media/:docId
   */
  async streamMedia(req: Request, res: Response) {
    try {
      const { docId } = req.params;
      const { expires, signature } = req.query;

      if (!verifyMediaSignature(docId, String(expires), String(signature))) {
        return res.status(403).json({
          success: false,
          message: 'Tautan gambar tidak valid atau sudah kedaluwarsa.'
        });
      }

      const doc = await db('calibration_documentations').where({ id: docId }).first();
      if (!doc || !doc.storage_key || !fs.existsSync(doc.storage_key)) {
        return res.status(404).json({
          success: false,
          message: 'Foto dokumentasi tidak ditemukan di penyimpanan server.'
        });
      }

      res.setHeader('Content-Type', doc.mime_type || 'image/webp');
      res.setHeader('Cache-Control', 'private, max-age=86400');
      fs.createReadStream(doc.storage_key).pipe(res);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat gambar dokumentasi.'
      });
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
        .join('stations', 'calibrations.station_id', '=', 'stations.id')
        .join('users', 'calibrations.officer_id', '=', 'users.id')
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
      let documentations: any[] = [];
      if (detailIds.length > 0) {
        standards = await db('calibration_detail_standards')
          .whereIn('calibration_detail_id', detailIds)
          .select('calibration_detail_id', 'crm_name', 'crm_standard_value', 'calibration_result');
        documentations = await db('calibration_documentations')
          .whereIn('calibration_detail_id', detailIds);
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
            standards: detailStandards,
            documentation: documentations
              .filter((doc: any) => doc.calibration_detail_id === d.id)
              .map((doc: any) => ({
                id: doc.id,
                calibration_detail_id: doc.calibration_detail_id,
                parameter_id: d.parameter_id,
                photo_type: doc.photo_type,
                preview_url: generateSignedPreviewUrl(req, doc.id),
                mime_type: doc.mime_type || 'image/webp',
                file_size: doc.file_size,
                width: doc.width || null,
                height: doc.height || null,
                checksum: `sha256:${doc.checksum}`,
                uploaded_at: doc.created_at
              }))
          };
        }),
        waterSamples
      };

      if ((req.headers.accept || '').includes('text/html')) {
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
          details: previewData.details.map((detail: any) => {
            const paramDocs = documentations.filter((doc: any) => doc.calibration_detail_id === detail.id);
            const docsMapped = paramDocs.map((doc: any) => {
              let base64Data = null;
              if (doc.storage_key && fs.existsSync(doc.storage_key)) {
                try {
                  const fileBuf = fs.readFileSync(doc.storage_key);
                  base64Data = `data:${doc.mime_type || 'image/webp'};base64,${fileBuf.toString('base64')}`;
                } catch (e) {}
              }
              return {
                id: doc.id,
                photoType: doc.photo_type,
                base64Data,
                previewUrl: generateSignedPreviewUrl(req, doc.id),
                checksum: doc.checksum,
                uploadedAt: doc.created_at
              };
            });

            return {
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
              calculationStatus: deriveCalibrationStatus(detail.parameter_name, detail.standards) || detail.calculation_result || null,
              documentation: docsMapped
            };
          }),
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
      let documentations: any[] = [];
      if (detailIds.length > 0) {
        standards = await db('calibration_detail_standards')
          .whereIn('calibration_detail_id', detailIds);
        documentations = await db('calibration_documentations')
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

      // 3. Prepare report details with canonical standard values and documentation photos
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

        const paramDocs = documentations.filter((doc: any) => doc.calibration_detail_id === d.id);
        const docsMapped = paramDocs.map((doc: any) => {
          let base64Data = null;
          if (doc.storage_key && fs.existsSync(doc.storage_key)) {
            try {
              const fileBuf = fs.readFileSync(doc.storage_key);
              base64Data = `data:${doc.mime_type || 'image/webp'};base64,${fileBuf.toString('base64')}`;
            } catch (e) {}
          }
          return {
            id: doc.id,
            photoType: doc.photo_type,
            base64Data,
            previewUrl: generateSignedPreviewUrl(req, doc.id),
            checksum: doc.checksum,
            uploadedAt: doc.created_at
          };
        });

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
          calculationStatus,
          documentation: docsMapped
        });
      }

      // 4a. Inline CSS if external stylesheet exists
      try {
        const cssPath = path.resolve(path.dirname(templatePath), 'Calibration_Report.css');
        if (fs.existsSync(cssPath)) {
          const cssContent = fs.readFileSync(cssPath, 'utf8');
          html = html.replace('<link rel="stylesheet" href="Calibration_Report.css">', `<style>${cssContent}</style>`);
        }
      } catch (e) {
        // ignore CSS inlining errors
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
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '12mm', right: '15mm', bottom: '15mm', left: '15mm' },
          displayHeaderFooter: true,
          headerTemplate: '<div></div>',
          footerTemplate: `
            <div style="font-size: 8pt; font-family: Helvetica, Arial, sans-serif; width: 100%; display: flex; justify-content: space-between; padding: 0 15mm; color: #555;">
              <span>PT CAHAYA MAS CEMERLANG — LAPORAN KALIBRASI RESMI</span>
              <span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>
            </div>
          `
        });
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
