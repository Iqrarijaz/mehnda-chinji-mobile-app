/**
 * Returns a WhatsApp-ready international number (digits only, no +) when the
 * given number looks like a mobile number that can use WhatsApp, otherwise
 * null. Used to auto-show the WhatsApp button only for capable numbers.
 *
 * Handles Pakistani mobile formats (03xxxxxxxxx / +923xxxxxxxxx / 3xxxxxxxxx)
 * and any explicitly international number given with a leading "+".
 */
export const toWhatsAppNumber = (raw?: string): string | null => {
    if (!raw) return null;
    const digits = raw.replace(/[^\d]/g, '');

    // Pakistan mobile: 03xxxxxxxxx -> 923xxxxxxxxx
    if (/^03\d{9}$/.test(digits)) return `92${digits.slice(1)}`;
    // Pakistan mobile without leading 0: 3xxxxxxxxx
    if (/^3\d{9}$/.test(digits)) return `92${digits}`;
    // Already in international PK mobile form: 923xxxxxxxxx
    if (/^923\d{9}$/.test(digits)) return digits;
    // Any explicitly international number (given with a leading +).
    if (raw.trim().startsWith('+') && digits.length >= 11 && digits.length <= 15) return digits;

    return null;
};

/** True when the number can be reached on WhatsApp (per the heuristic above). */
export const supportsWhatsApp = (raw?: string): boolean => toWhatsAppNumber(raw) !== null;
