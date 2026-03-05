/**
 * Form data normalization utilities.
 *
 * Converts empty strings to null for nullable fields before submission.
 * This ensures explicit null semantics: null = clear field, value = update field.
 */

/**
 * Normalize a string field for submission.
 * Converts empty strings (after trimming) to null.
 *
 * @param value - The string value or null
 * @returns null if empty/whitespace, trimmed string otherwise
 */
export function normalizeStringField(value: string | null): string | null {
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
}

/**
 * Normalize an array field for submission.
 * Keeps null and [] as distinct states:
 * - null = clear the field (database NULL)
 * - [] = empty array (explicitly no items)
 *
 * @param value - The array value or null
 * @returns The value as-is (no conversion)
 */
export function normalizeArrayField<T>(value: T[] | null): T[] | null {
    return value;
}
