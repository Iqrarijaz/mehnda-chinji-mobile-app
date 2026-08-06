// ── Brand ─────────────────────────────────────────────────────────────────
// #006666 (primary teal) and #FF9B51/#FCBD48 (secondary/lime) stay
// recognizable in both themes — dark mode tints them rather than inverting
// them, so the app never stops looking like Rehbar.
const tintColorLight = '#25343F';
const tintColorDark = '#F1F5F9';

export interface ThemeColors {
    text: string;
    textSecondary: string;
    placeholder: string;
    disabled: string;
    icon: string;
    lime: string;

    background: string;
    surface: string;
    card: string;
    cardBg: string;
    inputBackground: string;
    modalBackground: string;
    toastBackground: string;

    tint: string;
    tabIconDefault: string;
    tabIconSelected: string;

    primary: string;
    secondary: string;
    accent: string;
    white: string;

    success: string;
    warning: string;
    danger: string;

    border: string;
    divider: string;
    shadow: string;

    overlay: string;
    backdrop: string;

    skeletonBase: string;
    skeletonHighlight: string;
    ripple: string;

    statusBarStyle: 'light' | 'dark';
    navigationBar: string;
}

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
    light: {
        // Core
        text: '#222831',
        textSecondary: '#64748B',
        placeholder: '#94A3B8',
        disabled: '#B7C0CC',
        icon: '#475569',
        lime: '#7BC043',

        background: '#FFFFFF',
        surface: '#F5F7F8', // one step up from background — section wrappers, screen chrome
        card: '#FFFFFF',
        cardBg: 'rgba(0,0,0,0.035)', // translucent card background
        inputBackground: '#F1F5F9',
        modalBackground: '#FFFFFF',
        toastBackground: '#FFFFFF',

        tint: tintColorLight,
        tabIconDefault: '#475569',
        tabIconSelected: tintColorLight,

        primary: '#006666',
        secondary: '#FF9B51',
        accent: '#FCBD48',
        white: '#FFFFFF',

        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',

        border: '#D6DEE3',
        divider: '#E7ECF0',
        shadow: 'rgba(15, 23, 42, 0.08)',

        overlay: 'rgba(15, 23, 42, 0.45)', // scrim over images/cards
        backdrop: 'rgba(15, 23, 42, 0.55)', // full-screen dimming behind modals/sheets

        skeletonBase: '#E7ECF0',
        skeletonHighlight: '#F5F7F8',
        ripple: 'rgba(0, 102, 102, 0.10)',

        statusBarStyle: 'dark',
        navigationBar: '#FFFFFF',
    },
    dark: {
        // Core
        text: '#F1F5F9',
        textSecondary: '#94A3B8',
        placeholder: '#64748B',
        disabled: '#475569',
        icon: '#94A3B8',
        lime: '#8FD35C', // lifted slightly for AA contrast on near-black

        background: '#0B0F10',
        surface: '#14191A', // one step up from background
        card: '#1B2122',
        cardBg: 'rgba(255,255,255,0.06)',
        inputBackground: 'rgba(255,255,255,0.06)',
        modalBackground: '#1B2122',
        toastBackground: '#1F2626',

        tint: tintColorDark,
        tabIconDefault: '#94A3B8',
        tabIconSelected: tintColorDark,

        primary: '#1F8A8A', // lifted from brand teal so it reads on dark surfaces (AA)
        secondary: '#FFAD6B',
        accent: '#FCC968',
        white: '#FFFFFF',

        success: '#4ADE80',
        warning: '#FBBF24',
        danger: '#F87171',

        border: '#242C2D',
        divider: '#1E2526',
        shadow: 'rgba(0, 0, 0, 0.4)',

        overlay: 'rgba(0, 0, 0, 0.55)',
        backdrop: 'rgba(0, 0, 0, 0.65)',

        skeletonBase: '#1E2526',
        skeletonHighlight: '#2A3233',
        ripple: 'rgba(31, 138, 138, 0.18)',

        statusBarStyle: 'light',
        navigationBar: '#0B0F10',
    },
};
