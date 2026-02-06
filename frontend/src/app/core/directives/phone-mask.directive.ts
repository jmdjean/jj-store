import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

const PHONE_MAX_LENGTH = 11;
const FIXED_PATTERN = /^(\d{0,2})(\d{0,4})(\d{0,4})$/;
const CELL_PATTERN = /^(\d{0,2})(\d{0,5})(\d{0,4})$/;

/**
 * Formats the host input value as Brazilian phone: (00) 00000-0000 or (00) 0000-0000.
 * Writes the formatted string to the bound form control so validators receive digits after strip.
 */
@Directive({
  selector: 'input[appPhoneMask]',
  standalone: true,
})
export class PhoneMaskDirective {
  private readonly el = inject(ElementRef<HTMLInputElement>);
  private readonly ngControl = inject(NgControl, { optional: true } as const);

  readonly updateControl = input<boolean>();

  @HostListener('input')
  onInput(): void {
    const inputEl = this.el.nativeElement;
    const raw = (inputEl.value ?? '').replace(/\D/g, '').slice(0, PHONE_MAX_LENGTH);
    const formatted = this.formatPhone(raw);
    this.setInputValue(inputEl, formatted);

    if ((this.updateControl() ?? true) && this.ngControl?.control) {
      this.ngControl.control.setValue(formatted, { emitEvent: false });
      this.ngControl.control.updateValueAndValidity({ emitEvent: false });
    }
  }

  @HostListener('blur')
  onBlur(): void {
    const inputEl = this.el.nativeElement;
    const raw = (inputEl.value ?? '').replace(/\D/g, '');
    const formatted = raw.length >= 10 ? this.formatPhone(raw) : inputEl.value ?? '';
    this.setInputValue(inputEl, formatted);
  }

  private formatPhone(digits: string): string {
    const d = digits.replace(/\D/g, '');
    if (d.length <= 2) {
      return d.length ? `(${d}` : '';
    }
    if (d.length <= 6) {
      const m = d.match(FIXED_PATTERN);
      if (m) {
        return `(${m[1]}) ${m[2]}`;
      }
    }
    if (d.length <= 7) {
      const m = d.match(FIXED_PATTERN);
      if (m) {
        return `(${m[1]}) ${m[2]}-${m[3] ?? ''}`;
      }
    }
    if (d.length <= 10) {
      const m = d.match(FIXED_PATTERN);
      if (m) {
        return `(${m[1]}) ${m[2]}-${m[3] ?? ''}`;
      }
    }
    const m = d.match(CELL_PATTERN);
    if (m) {
      const part2 = m[2] ? ` ${m[2]}` : '';
      const part3 = m[3] ? `-${m[3]}` : '';
      return `(${m[1]})${part2}${part3}`;
    }
    return d;
  }

  private setInputValue(inputEl: HTMLInputElement, value: string): void {
    const start = inputEl.selectionStart ?? 0;
    inputEl.value = value;
    const newCursor = Math.min(start, value.length);
    inputEl.setSelectionRange(newCursor, newCursor);
  }
}
