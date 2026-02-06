import { FormControl } from '@angular/forms';
import { phoneValidator } from './phone.validator';

describe('phoneValidator', () => {
  const validator = phoneValidator();

  it('returns null when value is empty', () => {
    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl(null))).toBeNull();
  });

  it('returns error when length is not 10 or 11 digits', () => {
    expect(validator(new FormControl('119999'))).toEqual({
      phone: { message: 'Informe um telefone com 10 ou 11 dígitos.' },
    });
  });

  it('returns error for invalid DDD', () => {
    expect(validator(new FormControl('01999998888'))).toEqual({
      phone: { message: 'Informe um DDD válido (11 a 99).' },
    });
    expect(validator(new FormControl('10999998888'))).toEqual({
      phone: { message: 'Informe um DDD válido (11 a 99).' },
    });
  });

  it('returns error for 11-digit number not starting with 9 after DDD', () => {
    expect(validator(new FormControl('11899998888'))).toEqual({
      phone: { message: 'Celular deve começar com 9 após o DDD.' },
    });
  });

  it('returns null for valid 10-digit phone', () => {
    expect(validator(new FormControl('1133334444'))).toBeNull();
    expect(validator(new FormControl('(11) 3333-4444'))).toBeNull();
  });

  it('returns null for valid 11-digit cell', () => {
    expect(validator(new FormControl('11999998888'))).toBeNull();
    expect(validator(new FormControl('(11) 99999-8888'))).toBeNull();
  });
});
