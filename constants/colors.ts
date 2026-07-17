/**
 * App-wide color tokens — premium grocery-style design language.
 * Deep teal-green primary ("forest"), fresh action green ("lime"),
 * butter-cream accent, on a soft off-white background.
 *
 * Existing keys (text, background, tint, icon, primary, secondary, card,
 * border, textSecondary, white, tabIcon*) are preserved so every consumer
 * keeps working; new semantic tokens extend the system.
 */

const forest = '#003D36';
const forestLight = '#0C4F47';
const lime = '#7BC043';
const limeDark = '#4B8B27';
const limeSoft = '#E9F6DA';
const orange = '#F0803C';
const orangeSoft = '#FDE7D6';
const cream = '#FDEEB5';
const pink = '#FBD9D6';

const tintColorLight = forest;
const tintColorDark = '#FFFFFF';

export const Colors = {
    light: {
        text: '#0C2B26',
        background: '#F8FAF8',
        tint: tintColorLight,
        icon: '#6B7B73',
        tabIconDefault: '#6B7B73',
        tabIconSelected: tintColorLight,
        primary: forest,
        primaryLight: forestLight,
        secondary: orange,
        white: '#FFFFFF',
        card: '#FFFFFF',
        border: '#ECECEC',
        textSecondary: '#6B7B73',
        // ── Extended design-system tokens ──
        /** Fresh action green — add buttons, steppers, positive highlights. */
        lime,
        /** Darker green for icons/text on light-green surfaces. */
        limeDark,
        /** Very light green wash — active chips, steppers, highlights. */
        limeSoft,
        /** Butter-cream accent — warm chips, icon wells. */
        cream,
        /** Soft warm wash. */
        orangeSoft,
        /** Soft pink — promotional surfaces. */
        pink,
        /** Subtle filled surface for inputs (borderless design). */
        field: '#F1F4F1',
        /** Text/icons on dark green surfaces. */
        onPrimary: '#FFFFFF',
        /** Muted text on dark green surfaces. */
        onPrimaryMuted: '#A9C4BC',
        danger: '#FF5A5F',
        success: lime,
    },
    dark: {
        text: '#F1F5F9',
        background: '#0B1512',
        tint: tintColorDark,
        icon: '#8FA79E',
        tabIconDefault: '#8FA79E',
        tabIconSelected: tintColorDark,
        primary: forest,
        primaryLight: forestLight,
        secondary: orange,
        white: '#FFFFFF',
        card: '#12211C',
        border: '#1E2E28',
        textSecondary: '#8FA79E',
        // ── Extended design-system tokens ──
        lime,
        limeDark,
        limeSoft: '#1C3320',
        cream: '#3A3320',
        orangeSoft: '#3A2A1D',
        pink: '#3A2426',
        field: '#16261F',
        onPrimary: '#FFFFFF',
        onPrimaryMuted: '#A9C4BC',
        danger: '#FF5A5F',
        success: lime,
    },
};
