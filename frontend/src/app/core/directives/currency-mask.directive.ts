import { Directive, ElementRef, HostListener, inject, input, OnDestroy, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

const PT_BR_DECIMAL = ',';
const PT_BR_THOUSANDS = '.';

/**
 * Formats the host input as Brazilian currency (R$ 1.234,56) and keeps the bound control value as number (reais).
 */
@Directive({
  selector: 'input[appCurrencyMask]',
  standalone: true,
})
export class CurrencyMaskDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLInputElement>);
  private readonly ngControl = inject(NgControl, { optional: true } as const);
  private valueChangesSub?: Subscription;

  readonly updateControl = input<boolean>();

  ngOnInit(): void {
    if (this.ngControl?.valueChanges) {
      this.valueChangesSub = this.ngControl.valueChanges.subscribe((value: number | null) => {
        const num = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
        this.el.nativeElement.value = this.formatNumberToDisplay(num);
      });
    }
    const initial = this.ngControl?.value;
    const num = typeof initial === 'number' && !Number.isNaN(initial) ? initial : 0;
    this.el.nativeElement.value = this.formatNumberToDisplay(num);
  }

  ngOnDestroy(): void {
    this.valueChangesSub?.unsubscribe();
  }

  @HostListener('input')
  onInput(): void {
    const inputEl = this.el.nativeElement;
    const parsed = this.parseDisplayToNumber(inputEl.value ?? '');
    const formatted = this.formatNumberToDisplay(parsed);
    this.setInputValue(inputEl, formatted);

    if ((this.updateControl() ?? true) && this.ngControl?.control) {
      this.ngControl.control.setValue(parsed, { emitEvent: false });
      this.ngControl.control.updateValueAndValidity({ emitEvent: false });
    }
  }

  @HostListener('focus')
  onFocus(): void {
    const inputEl = this.el.nativeElement;
    const value = this.ngControl?.value;
    const num = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    this.setInputValue(inputEl, this.formatNumberToDisplay(num));
  }

  @HostListener('blur')
  onBlur(): void {
    const inputEl = this.el.nativeElement;
    const parsed = this.parseDisplayToNumber(inputEl.value ?? '');
    const formatted = this.formatNumberToDisplay(parsed);
    this.setInputValue(inputEl, formatted);

    if ((this.updateControl() ?? true) && this.ngControl?.control) {
      this.ngControl.control.setValue(parsed, { emitEvent: false });
    }
  }

  /** Parses Brazilian formatted string (e.g. "1.234,56") to number in reais. */
  private parseDisplayToNumber(display: string): number {
    const noSymbol = display.replace(/R\$\s?/g, '').trim();
    const noThousands = noSymbol.replace(new RegExp(`\\${PT_BR_THOUSANDS}`, 'g'), '');
    const normalized = noThousands.replace(PT_BR_DECIMAL, '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  /** Formats number (reais) to Brazilian display string. */
  private formatNumberToDisplay(value: number): string {
    const fixed = value.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const intWithDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, PT_BR_THOUSANDS);
    return `R$ ${intWithDots}${PT_BR_DECIMAL}${decPart ?? '00'}`;
  }

  private setInputValue(inputEl: HTMLInputElement, value: string): void {
    inputEl.value = value;
  }
}
