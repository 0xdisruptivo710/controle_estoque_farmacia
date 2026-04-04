/**
 * Money — Monetary value in BRL (Brazilian Real)
 *
 * Immutable value object. Stores the amount as an integer number of cents
 * to avoid floating-point precision issues.
 */
export class Money {
  private readonly _cents: number;

  private constructor(cents: number) {
    if (!Number.isFinite(cents) || !Number.isInteger(cents)) {
      throw new Error('Money must be initialised with a finite integer (cents).');
    }
    this._cents = cents;
    Object.freeze(this);
  }

  // ── Public API ──────────────────────────────────────────────

  /** The amount expressed in cents (integer). */
  get cents(): number {
    return this._cents;
  }

  /** The amount expressed as a decimal (e.g. 19.90). */
  get decimal(): number {
    return this._cents / 100;
  }

  /** Returns true when the amount is zero. */
  isZero(): boolean {
    return this._cents === 0;
  }

  /** Returns true when the amount is negative. */
  isNegative(): boolean {
    return this._cents < 0;
  }

  /** Returns true when the amount is positive. */
  isPositive(): boolean {
    return this._cents > 0;
  }

  // ── Arithmetic ──────────────────────────────────────────────

  add(other: Money): Money {
    return new Money(this._cents + other._cents);
  }

  subtract(other: Money): Money {
    return new Money(this._cents - other._cents);
  }

  /**
   * Multiplies the monetary value by a scalar factor.
   * The result is rounded to the nearest cent.
   */
  multiply(factor: number): Money {
    return new Money(Math.round(this._cents * factor));
  }

  // ── Formatting ──────────────────────────────────────────────

  /**
   * Formats the value as BRL currency: R$ X.XXX,XX
   *
   * Examples:
   *   Money.fromCents(1990).format()    → "R$ 19,90"
   *   Money.fromCents(150000).format()  → "R$ 1.500,00"
   *   Money.fromCents(-500).format()    → "-R$ 5,00"
   */
  format(): string {
    const isNeg = this._cents < 0;
    const absCents = Math.abs(this._cents);
    const reais = Math.floor(absCents / 100);
    const centavos = absCents % 100;

    const reaisFormatted = reais.toLocaleString('pt-BR');
    const centavosFormatted = centavos.toString().padStart(2, '0');

    const formatted = `R$ ${reaisFormatted},${centavosFormatted}`;
    return isNeg ? `-${formatted}` : formatted;
  }

  // ── Comparison ──────────────────────────────────────────────

  equals(other: Money): boolean {
    return this._cents === other._cents;
  }

  greaterThan(other: Money): boolean {
    return this._cents > other._cents;
  }

  lessThan(other: Money): boolean {
    return this._cents < other._cents;
  }

  toString(): string {
    return this.format();
  }

  // ── Factories ───────────────────────────────────────────────

  /** Creates a Money instance from an integer number of cents. */
  static fromCents(cents: number): Money {
    return new Money(cents);
  }

  /**
   * Creates a Money instance from a decimal value (e.g. 19.90).
   * The value is rounded to the nearest cent.
   */
  static fromDecimal(value: number): Money {
    if (!Number.isFinite(value)) {
      throw new Error('Money.fromDecimal requires a finite number.');
    }
    return new Money(Math.round(value * 100));
  }

  /** Convenience: Money representing zero reais. */
  static zero(): Money {
    return new Money(0);
  }
}
