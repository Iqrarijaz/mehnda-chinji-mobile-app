/**
 * Shared layout tokens — radius & spacing scales for the premium
 * flat design language. Existing keys are preserved.
 */
export const Layout = {
    borderRadius: 18,
    headerBorderRadius: 28,
    cardBorderRadius: 22,
};

export const Radius = {
    sm: 12,
    md: 16,
    lg: 22,
    xl: 28,
    /** Large premium card radius. */
    card: 22,
    pill: 999,
} as const;

export const Spacing = {
    half: 2,
    one: 4,
    two: 8,
    twoAndHalf: 12,
    three: 16,
    four: 24,
    five: 32,
    six: 64,
} as const;
