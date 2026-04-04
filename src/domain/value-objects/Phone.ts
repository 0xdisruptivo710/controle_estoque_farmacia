/**
 * Phone — Brazilian telephone number
 *
 * Immutable value object. Stores only the 10 or 11 numeric digits internally.
 * 10 digits = landline: (XX) XXXX-XXXX
 * 11 digits = mobile:   (XX) XXXXX-XXXX
 */
export class Phone {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
    Object.freeze(this);
  }

  // ── Public API ──────────────────────────────────────────────

  /** The raw digit-only string (10 or 11 characters). */
  get value(): string {
    return this._value;
  }

  /**
   * Formatted representation:
   *   11 digits → (XX) XXXXX-XXXX
   *   10 digits → (XX) XXXX-XXXX
   */
  format(): string {
    const v = this._value;
    const ddd = v.slice(0, 2);

    if (v.length === 11) {
      return `(${ddd}) ${v.slice(2, 7)}-${v.slice(7)}`;
    }

    return `(${ddd}) ${v.slice(2, 6)}-${v.slice(6)}`;
  }

  equals(other: Phone): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this.format();
  }

  // ── Factory ─────────────────────────────────────────────────

  /**
   * Creates a Phone value object from any string input.
   * Strips non-digit characters and validates the length (10 or 11 digits).
   *
   * @throws {Error} if the input is not a valid Brazilian phone number.
   */
  static create(raw: string): Phone {
    const digits = raw.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 11) {
      throw new Error(
        'Brazilian phone number must contain 10 digits (landline) or 11 digits (mobile).',
      );
    }

    const ddd = parseInt(digits.slice(0, 2), 10);
    if (ddd < 11 || ddd > 99) {
      throw new Error('Invalid DDD (area code). Must be between 11 and 99.');
    }

    // Mobile numbers (11 digits) must start with 9 after the DDD
    if (digits.length === 11 && digits[2] !== '9') {
      throw new Error('11-digit Brazilian phone numbers must have 9 as the first digit after the DDD.');
    }

    return new Phone(digits);
  }
}
