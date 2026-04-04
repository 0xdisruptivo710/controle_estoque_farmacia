/**
 * CPF — Brazilian Individual Taxpayer Registry
 *
 * Immutable value object. Stores only the 11 numeric digits internally.
 * Validates the two check-digits using the standard modular algorithm.
 */
export class CPF {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
    Object.freeze(this);
  }

  // ── Public API ──────────────────────────────────────────────

  /** The raw 11-digit CPF string (no formatting). */
  get value(): string {
    return this._value;
  }

  /** Formatted representation: xxx.xxx.xxx-xx */
  format(): string {
    const v = this._value;
    return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9, 11)}`;
  }

  equals(other: CPF): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this.format();
  }

  // ── Factory ─────────────────────────────────────────────────

  /**
   * Creates a CPF value object from any string input.
   * Strips non-digit characters, then validates length and check digits.
   *
   * @throws {Error} if the input is not a valid CPF.
   */
  /**
   * Creates a CPF value object from any string input.
   * Strips non-digit characters, then validates length.
   * Check-digit validation is optional (strict mode).
   *
   * @param raw - The CPF string (with or without formatting)
   * @param strict - If true, validates check digits. Default: false.
   * @throws {Error} if the input format is invalid.
   */
  static create(raw: string, strict = false): CPF {
    const digits = raw.replace(/\D/g, '');

    if (digits.length !== 11) {
      throw new Error('CPF deve conter exatamente 11 digitos.');
    }

    if (CPF.isAllSameDigit(digits)) {
      throw new Error('CPF com todos os digitos iguais e invalido.');
    }

    if (strict && !CPF.validateCheckDigits(digits)) {
      throw new Error('Digitos verificadores do CPF sao invalidos.');
    }

    return new CPF(digits);
  }

  /** Validates check digits without throwing. */
  static isValid(raw: string): boolean {
    try {
      const digits = raw.replace(/\D/g, '');
      if (digits.length !== 11 || CPF.isAllSameDigit(digits)) return false;
      return CPF.validateCheckDigits(digits);
    } catch {
      return false;
    }
  }

  // ── Validation helpers ──────────────────────────────────────

  /** Returns true when every character in the string is the same. */
  private static isAllSameDigit(digits: string): boolean {
    return digits.split('').every((d) => d === digits[0]);
  }

  /**
   * Standard Brazilian CPF validation algorithm.
   *
   * For the first check digit (position 9):
   *   sum = d[0]*10 + d[1]*9 + ... + d[8]*2
   *   remainder = (sum * 10) % 11; if remainder === 10, use 0
   *
   * For the second check digit (position 10):
   *   sum = d[0]*11 + d[1]*10 + ... + d[9]*2
   *   remainder = (sum * 10) % 11; if remainder === 10, use 0
   */
  private static validateCheckDigits(digits: string): boolean {
    const nums = digits.split('').map(Number);

    // First check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += nums[i] * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== nums[9]) return false;

    // Second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += nums[i] * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== nums[10]) return false;

    return true;
  }
}
