import { Knex } from 'knex';

export interface CalibrationStandardDefinition {
  crm_name: string;
  crm_standard_value: number;
}

export function formatSolutionStandardName(value: number | string): string {
  return String(Number(value));
}

export function isDefaultSolutionStandardName(name: string): boolean {
  return /^-?\d+(?:\.\d+)?$/.test(name);
}

/**
 * Returns the fixed standard solutions from the database master table.
 * Calibration records must not define their own CRM reference values.
 */
export async function getMasterSolutionStandards(
  trx: Knex.Transaction,
  parameterName: string
): Promise<CalibrationStandardDefinition[]> {
  const solution = await trx('master_calibration_solutions as solution')
    .join('master_parameters as parameter', 'parameter.id', 'solution.parameter_id')
    .where('parameter.name', parameterName)
    .select('solution.solution_1', 'solution.solution_2', 'solution.solution_3')
    .first();

  if (!solution) {
    return [];
  }

  return [solution.solution_1, solution.solution_2, solution.solution_3]
    .map((value, index) => value === null || value === undefined
      ? null
      : {
          crm_name: formatSolutionStandardName(value),
          crm_standard_value: Number(value)
        })
    .filter((standard): standard is CalibrationStandardDefinition => standard !== null);
}

export async function ensureDefaultSolutionStandardsForDetail(
  trx: Knex.Transaction,
  detailId: number,
  parameterName: string
): Promise<void> {
  const masterStandards = await getMasterSolutionStandards(trx, parameterName);
  if (!masterStandards.length) {
    return;
  }

  const existingStandards = await trx('calibration_detail_standards')
    .where({ calibration_detail_id: detailId });

  for (const standard of masterStandards) {
    const existing = existingStandards.find((row: any) => row.crm_name === standard.crm_name);
    if (existing) {
      const currentValue = existing.crm_standard_value !== null ? Number(existing.crm_standard_value) : null;
      if (currentValue !== standard.crm_standard_value) {
        await trx('calibration_detail_standards')
          .where({ id: existing.id })
          .update({
            crm_standard_value: standard.crm_standard_value,
            updated_at: new Date()
          });
      }
    } else {
      await trx('calibration_detail_standards').insert({
        calibration_detail_id: detailId,
        crm_name: standard.crm_name,
        crm_standard_value: standard.crm_standard_value,
        min_acceptable: null,
        max_acceptable: null,
        calibration_result: null
      });
    }
  }
}
