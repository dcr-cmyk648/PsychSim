export type DomainErrorCode =
  | 'ACTION_NOT_FOUND'
  | 'ACTION_ALREADY_PURCHASED'
  | 'ENCOUNTER_LOCKED'
  | 'SERVICE_NOT_FOUND'
  | 'SERVICE_UNAVAILABLE'
  | 'LOCATION_NOT_FOUND'
  | 'FACILITY_NOT_FOUND'
  | 'FACILITY_LOCATION_INVALID'
  | 'INVALID_DIAGNOSIS_SELECTION'
  | 'INVALID_TREATMENT_SELECTION'
  | 'ENCOUNTER_NOT_SUBMITTED'
  | 'REPLAY_FAILED'
  | 'UPGRADE_NOT_FOUND'
  | 'UPGRADE_ALREADY_OWNED'
  | 'INSUFFICIENT_POINTS'
  | 'UPGRADE_PREREQUISITE_MISSING'
  | 'UPGRADE_NOT_ALLOWED'
  | 'UPGRADE_PRACTICE_MODE'
  | 'STAFF_NOT_OWNED'
  | 'STAFF_AUTOMATION_INVALID'
  | 'STAFF_CONFIGURATION_DUPLICATE'
  | 'STAFF_CONFIGURATION_INVALID'
  | 'STAFF_CONFIGURATION_CONFLICT';

export interface DomainError {
  code: DomainErrorCode;
  message: string;
  details?: Readonly<Record<string, string | number | boolean>>;
}

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: DomainError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T = never>(error: DomainError): Result<T> => ({ ok: false, error });
