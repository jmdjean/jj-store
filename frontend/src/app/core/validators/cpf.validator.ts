import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Brazilian CPF check digit calculation (weighted sum).
 */
function calculateCpfDigit(digits: number[], startWeight: number): number {
  let sum = 0;
  for (let index = 0; index < startWeight - 1; index += 1) {
    sum += digits[index]! * (startWeight - index);
  }
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
}

/**
 * Returns true when the 11-digit string is valid per Brazilian CPF algorithm.
 */
function isCpfValid(digits: string): boolean {
  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }
  const arr = digits.split('').map((c) => Number(c));
  const first = calculateCpfDigit(arr, 10);
  const second = calculateCpfDigit(arr, 11);
  return arr[9] === first && arr[10] === second;
}

/**
 * Validates CPF: 11 digits and Brazilian check-digit algorithm.
 * Control value can be raw digits or formatted (e.g. 000.000.000-00); digits are extracted.
 */
export function cpfValidator(): ValidatorFn {
  return (control: AbstractControl<string | null | undefined>): ValidationErrors | null => {
    const value = control.value;
    const digits = typeof value === 'string' ? value.replace(/\D/g, '') : '';

    if (digits.length === 0) {
      return null;
    }

    if (digits.length !== 11) {
      return { cpf: { message: 'Informe um CPF com 11 dígitos.' } };
    }

    if (!isCpfValid(digits)) {
      return { cpf: { message: 'CPF inválido.' } };
    }

    return null;
  };
}
