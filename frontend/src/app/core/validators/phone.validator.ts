import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const DDD_MIN = 11;
const DDD_MAX = 99;
const CELL_NINTH_DIGIT = 9;

/**
 * Validates Brazilian phone: 10 or 11 digits, DDD 11–99, and for 11 digits the 3rd digit must be 9 (cell).
 * Control value can be formatted (e.g. (11) 99999-9999); digits are extracted.
 */
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl<string | null | undefined>): ValidationErrors | null => {
    const value = control.value;
    const digits = typeof value === 'string' ? value.replace(/\D/g, '') : '';

    if (digits.length === 0) {
      return null;
    }

    if (digits.length !== 10 && digits.length !== 11) {
      return { phone: { message: 'Informe um telefone com 10 ou 11 dígitos.' } };
    }

    const ddd = Number(digits.slice(0, 2));
    if (ddd < DDD_MIN || ddd > DDD_MAX) {
      return { phone: { message: 'Informe um DDD válido (11 a 99).' } };
    }

    if (digits.length === 11) {
      const ninth = Number(digits[2]);
      if (ninth !== CELL_NINTH_DIGIT) {
        return { phone: { message: 'Celular deve começar com 9 após o DDD.' } };
      }
    }

    return null;
  };
}
