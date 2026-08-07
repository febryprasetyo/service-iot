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
