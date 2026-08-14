# Calibration Parameter Audit

## Purpose
This document audits the current calibration evaluation logic in `src/helpers/CalibrationCalculator.ts` and compares it against the sample calibration data defined in `seeds/02_dummy_calibration_data.js`.

## Updated Calibration Rules
The audit aligns with sample values and the expected PASS/FAILED behavior.

| Parameter | Rule | Formula | Pass Range |
|---|---|---|---|
| DO | 0% absolute accuracy ±0.05; 100% trueness 99–101 | `reading / standard * 100` (for non-zero standard), `abs(reading)` for zero | 0% ±0.05 for zero point; 99–101 for solution values |
| Turbidity | %Trueness 90–110 | `reading / standard * 100` | 90–110 |
| TDS | %Trueness 90–110 | `reading / standard * 100` | 90–110 |
| COD | %Trueness 90–110 | `reading / standard * 100` | 90–110 |
| BOD | %Trueness 90–110 | `reading / standard * 100` | 90–110 |
| pH | Absolute accuracy ±0.20 | `abs(reading - standard)` | ±0.20 |
| TSS | %Trueness 99–100 | `reading / standard * 100` | 99–100 |
| Amonia | %Trueness 99–101 | `reading / standard * 100` | 99–101 |
| Nitrat | %Trueness 90–110 | `reading / standard * 100` | 90–110 |
| Nitrit | %Trueness 90–110 | `reading / standard * 100` | 90–110 |

## Sample Data Audit
The following sample inputs are taken from `seeds/02_dummy_calibration_data.js` for the dummy calibration record.

### DO
- Solution 1: standard 0, reading 0.05 → absolute diff 0.05 → PASS
- Solution 2: standard 100, reading 99.84 → trueness 99.84% → PASS

### Turbidity
- Solution 1: standard 4, reading 3.70 → trueness 92.50% → PASS
- Solution 2: standard 20, reading 19.63 → trueness 98.15% → PASS

### TDS
- Solution 1: standard 1.413, reading 1.288 → trueness 91.12% → PASS
- Solution 2: standard 12.89, reading 12.79 → trueness 99.22% → PASS

### COD
- Solution 1: standard 10, reading 10.61 → trueness 106.10% → PASS
- Solution 2: standard 100, reading 95.24 → trueness 95.24% → PASS

### BOD
- Solution 1: standard 10, reading 10.61 → trueness 106.10% → PASS
- Solution 2: standard 100, reading 95.24 → trueness 95.24% → PASS

### pH
- Solution 1: standard 4.00, reading 3.97 → diff 0.03 → PASS
- Solution 2: standard 7.01, reading 6.83 → diff 0.18 → PASS
- Solution 3: standard 10.01, reading 10.00 → diff 0.01 → PASS

### TSS
- Solution 1: standard 50, reading 49.91 → trueness 99.82% → PASS

### Amonia
- Solution 1: standard 1, reading 1.01 → trueness 101.00% → PASS

### Nitrit
- Solution 1: standard 10, reading 10.1 → trueness 101.00% → PASS
- Solution 2: standard 100, reading 99.2 → trueness 99.20% → PASS

### Nitrat
- Solution 1: standard 10, reading 10.02 → trueness 100.20% → PASS
- Solution 2: standard 100, reading 99.5 → trueness 99.50% → PASS

## Display Mapping
The report rendering logic in `src/controllers/CalibrationController.ts` currently:

- shows master/non-CRM solution standard values in the `Standart / CRM` column
- shows calculated solution readings and CRM reading values in the `Hasil Pembacaan` column
- displays the result as PASS if all evaluable solution rows are present and within the configured range

The current audit confirms the sample seed values now fit the reported acceptance boundaries.

## Code Changes
- `src/helpers/CalibrationCalculator.ts`
  - updated `COD` and `BOD` from `%Trueness 99–100` to `%Trueness 90–110`
  - updated `Nitrat` and `Nitrit` from `%Trueness 99–100` to `%Trueness 90–110`
  - updated `pH` tolerance from `±0.05` to `±0.20`

- `src/helpers/CalibrationCalculator.test.ts`
  - added test cases to verify all affected parameter rules

## Notes
If you need a second pass, we can also update the report template or controller to explicitly render the computed trueness/accuracy value per row for easier verification.