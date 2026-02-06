import { FormControl } from '@angular/forms';
import { cpfValidator } from './cpf.validator';

/** Builds a valid CPF (11 digits) using the same check-digit algorithm as the validator. */
function buildValidCpfDigits(): string {
  const base = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += base[i]! * (10 - i);
  }
  let first = (sum * 10) % 11;
  if (first === 10) first = 0;
  base.push(first);
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += base[i]! * (11 - i);
  }
  let second = (sum * 10) % 11;
  if (second === 10) second = 0;
  base.push(second);
  return base.join('');
}

describe('cpfValidator', () => {
  const validator = cpfValidator();

  it('returns null when value is empty', () => {
    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl(null))).toBeNull();
  });

  it('returns error when length is not 11 digits', () => {
    expect(validator(new FormControl('123'))).toEqual({
      cpf: { message: 'Informe um CPF com 11 dígitos.' },
    });
    expect(validator(new FormControl('123.456.789-0'))).toEqual({
      cpf: { message: 'Informe um CPF com 11 dígitos.' },
    });
  });

  it('returns error for invalid check digits', () => {
    expect(validator(new FormControl('11111111111'))).toEqual({
      cpf: { message: 'CPF inválido.' },
    });
    expect(validator(new FormControl('12345678900'))).toEqual({
      cpf: { message: 'CPF inválido.' },
    });
  });

  it('returns null for valid CPF (formatted)', () => {
    const valid = buildValidCpfDigits();
    const formatted = `${valid.slice(0, 3)}.${valid.slice(3, 6)}.${valid.slice(6, 9)}-${valid.slice(9)}`;
    expect(validator(new FormControl(formatted))).toBeNull();
  });

  it('returns null for valid CPF (digits only)', () => {
    const valid = buildValidCpfDigits();
    expect(validator(new FormControl(valid))).toBeNull();
  });
});
