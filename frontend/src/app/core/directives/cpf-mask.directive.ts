import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

const CPF_LENGTH = 11;
const CPF_MASK_PATTERN = /^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/;

/**
 * Formats the host input value as Brazilian CPF: 000.000.000-00.
 * Writes only digits to the bound form control.
 */
@Directive({
  selector: 'input[appCpfMask]',
  standalone: true,
})
export class CpfMaskDirective {
  private readonly el = inject(ElementRef<HTMLInputElement>);
  private readonly ngControl = inject(NgControl, { optional: true } as const);

  /** When true, the directive updates the control value; when false, only the display is formatted. */
  readonly updateControl = input<boolean>();

  @HostListener('input')
  onInput(): void {
    const inputEl = this.el.nativeElement;
    const raw = (inputEl.value ?? '').replace(/\D/g, '').slice(0, CPF_LENGTH);
    const formatted = this.formatCpf(raw);
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
    const formatted = raw.length === CPF_LENGTH ? this.formatCpf(raw) : inputEl.value ?? '';
    this.setInputValue(inputEl, formatted);
  }

  private formatCpf(digits: string): string {
    const d = digits.replace(/\D/g, '');
    const match = d.match(CPF_MASK_PATTERN);
    if (!match) {
      return d;
    }
    const a = match[1] ?? '';
    const b = match[2] ?? '';
    const c = match[3] ?? '';
    const d2 = match[4] ?? '';
    if (!a) return '';
    if (!b) return a;
    if (!c) return `${a}.${b}`;
    if (!d2) return `${a}.${b}.${c}`;
    return `${a}.${b}.${c}-${d2}`;
  }

  private setInputValue(inputEl: HTMLInputElement, value: string): void {
    const start = inputEl.selectionStart ?? 0;
    inputEl.value = value;
    const newCursor = Math.min(start, value.length);
    inputEl.setSelectionRange(newCursor, newCursor);
  }
}
