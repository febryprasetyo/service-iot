/**
 * Master nilai larutan kalibrasi yang digunakan sebagai referensi tetap.
 * Setiap parameter memiliki maksimal tiga larutan; larutan yang tidak
 * digunakan disimpan sebagai NULL.
 */
exports.up = async function(knex) {
  await knex.schema.createTable('master_calibration_solutions', (table) => {
    table.increments('id').primary();
    table
      .integer('parameter_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('master_parameters')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table.decimal('solution_1', 14, 4).nullable();
    table.decimal('solution_2', 14, 4).nullable();
    table.decimal('solution_3', 14, 4).nullable();
    table.timestamps(true, true);
  });

  const solutionsByParameter = {
    DO: [0, 100, null],
    Turbidity: [4, 20, null],
    TDS: [1.413, 12.89, null],
    COD: [10, 100, null],
    BOD: [10, 100, null],
    pH: [4.0, 7.01, 10.01],
    TSS: [50, null, null],
    Amonia: [1, null, null],
    Nitrat: [10, 100, null], // NO3
    Nitrit: [10, 100, null] // NO2
  };

  const parameterNames = Object.keys(solutionsByParameter);
  const parameters = await knex('master_parameters')
    .whereIn('name', parameterNames)
    .select('id', 'name');

  if (parameters.length !== parameterNames.length) {
    const foundNames = parameters.map((parameter) => parameter.name);
    const missingNames = parameterNames.filter((name) => !foundNames.includes(name));
    throw new Error(
      `Master parameter tidak ditemukan untuk larutan kalibrasi: ${missingNames.join(', ')}`
    );
  }

  await knex('master_calibration_solutions').insert(
    parameters.map((parameter) => {
      const [solution1, solution2, solution3] = solutionsByParameter[parameter.name];

      return {
        parameter_id: parameter.id,
        solution_1: solution1,
        solution_2: solution2,
        solution_3: solution3
      };
    })
  );
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('master_calibration_solutions');
};
