export interface MasterParameter {
  id: number;
  name: string;
  unit: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type CalibrationStatus = 'draft' | 'submitted' | 'approved';

export interface Calibration {
  id: string; // UUID
  report_no: string;
  station_id: number;
  calibration_start_date: Date;
  calibration_end_date: Date;
  notes: string | null;
  officer_id: number;
  status: CalibrationStatus;
  verification_uuid: string; // UUID
  created_at?: Date;
  updated_at?: Date;
}

export interface CalibrationDetail {
  id: number;
  calibration_id: string; // UUID
  parameter_id: number;
  coeff_type: string | null;
  coefficients: Record<string, any> | null;
  calculation_result: 'PASS' | 'FAILED' | null;
  crm_reference_value: number | null;
  crm_reading_value: number | null;
  remark: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CalibrationDetailStandard {
  id: number;
  calibration_detail_id: number;
  crm_name: string;
  crm_standard_value: number | null;
  min_acceptable: number | null;
  max_acceptable: number | null;
  calibration_result: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface WaterSample {
  id: number;
  calibration_id: string; // UUID
  sample_name: string;
  suhu: number | null;
  do: number | null;
  tur: number | null;
  tds: number | null;
  ph: number | null;
  orp: number | null;
  tss: number | null;
  bod: number | null;
  cod: number | null;
  amonia: number | null;
  nitrat: number | null;
  nitrit: number | null;
  kedalaman: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateCalibrationPayload {
  station_id: number;
  calibration_start_date: string;
  calibration_end_date: string;
  notes?: string;
  parameter_ids: number[];
}
