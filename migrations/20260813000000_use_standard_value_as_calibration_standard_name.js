/**
 * Replaces positional labels ("Solution 1", "Solution 2") with the fixed
 * master standard value. The API can then display crm_name directly without
 * requiring the frontend to translate a solution index into its value.
 */
exports.up = async function(knex) {
  const standards = await knex('calibration_detail_standards')
    .select('id', 'crm_standard_value');

  for (const standard of standards) {
    if (standard.crm_standard_value === null || standard.crm_standard_value === undefined) continue;
    await knex('calibration_detail_standards')
      .where({ id: standard.id })
      .update({ crm_name: String(Number(standard.crm_standard_value)) });
  }
};

exports.down = async function(knex) {
  const standards = await knex('calibration_detail_standards')
    .select('id', 'calibration_detail_id')
    .orderBy('calibration_detail_id')
    .orderBy('id');
  const sequenceByDetail = new Map();

  for (const standard of standards) {
    const sequence = (sequenceByDetail.get(standard.calibration_detail_id) || 0) + 1;
    sequenceByDetail.set(standard.calibration_detail_id, sequence);
    await knex('calibration_detail_standards')
      .where({ id: standard.id })
      .update({ crm_name: `Solution ${sequence}` });
  }
};
