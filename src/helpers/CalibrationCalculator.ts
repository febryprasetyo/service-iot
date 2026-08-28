/**
 * Calculates the %Trueness of a reading based on a CRM standard.
 * Formula: %Trueness = (reading / standard) * 100
 * @param reading The value read by the instrument.
 * @param standard The CRM standard value.
 * @returns The trueness percentage (returns 0 if standard is 0 to avoid division by zero).
 */
export function calculateTrueness(reading: number, standard: number): number {
  if (standard === 0) return 0;
  return (reading / standard) * 100;
}

/**
 * Evaluates whether a calibration result reading falls within the acceptable range.
 * @param reading The value read by the instrument.
 * @param minAcceptable The minimum acceptable boundary.
 * @param maxAcceptable The maximum acceptable boundary.
 * @returns 'PASS' if within boundaries (inclusive), otherwise 'FAILED'.
 */
export function evaluateCalibrationResult(
  reading: number,
  minAcceptable: number,
  maxAcceptable: number
): 'PASS' | 'FAILED' {
  if (reading >= minAcceptable && reading <= maxAcceptable) {
    return 'PASS';
  }
  return 'FAILED';
}

/**
 * Formats a coefficient number to 6 decimal digits.
 * @param value The number or string to format.
 * @returns String representation formatted to 6 decimal places.
 */
export function formatCoefficient(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num.toFixed(6);
}

export interface CalibrationSpecification {
  label: string;
  method: 'trueness' | 'accuracy';
  min?: number;
  max?: number;
  tolerance?: number;
}

const CALIBRATION_SPECIFICATIONS: Record<string, CalibrationSpecification> = {
  DO: { label: '0% Accuracy ±0.05%; 100% %Trueness 90–110%', method: 'trueness', min: 90, max: 110 },
  Turbidity: { label: '%Trueness 90–110%', method: 'trueness', min: 90, max: 110 },
  TDS: { label: '%Trueness 90–110%', method: 'trueness', min: 90, max: 110 },
  COD: { label: '%Trueness 90–110%', method: 'trueness', min: 90, max: 110 },
  BOD: { label: '%Trueness 90–110%', method: 'trueness', min: 90, max: 110 },
  pH: { label: 'Accuracy ±0.05', method: 'accuracy', tolerance: 0.05 },
  TSS: { label: '%Trueness 90–110%', method: 'trueness', min: 90, max: 110 },
  Amonia: { label: '%Trueness 90–110%', method: 'trueness', min: 90, max: 110 },
  Nitrat: { label: '%Trueness 90–110%', method: 'trueness', min: 90, max: 110 },
  Nitrit: { label: '%Trueness 90–110%', method: 'trueness', min: 90, max: 110 }
};

export function getCalibrationSpecification(parameterName: string): CalibrationSpecification | null {
  const normalized = parameterName.trim();
  if (CALIBRATION_SPECIFICATIONS[normalized]) return CALIBRATION_SPECIFICATIONS[normalized];
  if (/^amonia/i.test(normalized) || /^nh3/i.test(normalized)) return CALIBRATION_SPECIFICATIONS['Amonia'];
  if (/^tss/i.test(normalized)) return CALIBRATION_SPECIFICATIONS['TSS'];
  if (/^nitrat/i.test(normalized) || /^no3/i.test(normalized)) return CALIBRATION_SPECIFICATIONS['Nitrat'];
  if (/^nitrit/i.test(normalized) || /^no2/i.test(normalized)) return CALIBRATION_SPECIFICATIONS['Nitrit'];
  if (/^suhu/i.test(normalized) || /^temp/i.test(normalized)) return { label: 'Accuracy ±0.5°C', method: 'accuracy', tolerance: 0.5 };
  return null;
}

export function evaluateStandardMeasurement(
  parameterName: string,
  reading: number,
  standard: number
): { status: 'PASS' | 'FAILED'; value: number; min: number; max: number } | null {
  const specification = getCalibrationSpecification(parameterName);
  if (!specification) return null;

  // DO zero point is assessed as absolute accuracy, not %Trueness.
  if (parameterName === 'DO' && standard === 0) {
    const value = Math.abs(reading);
    return {
      status: evaluateCalibrationResult(value, 0, 0.05),
      value,
      min: -0.05,
      max: 0.05
    };
  }

  if (specification.method === 'trueness') {
    const value = calculateTrueness(reading, standard);
    return {
      status: evaluateCalibrationResult(value, specification.min!, specification.max!),
      value,
      min: specification.min!,
      max: specification.max!
    };
  }

  const value = Math.abs(reading - standard);
  return {
    status: evaluateCalibrationResult(value, 0, specification.tolerance!),
    value,
    min: standard - specification.tolerance!,
    max: standard + specification.tolerance!
  };
}
