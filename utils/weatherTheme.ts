import { Ionicons } from '@expo/vector-icons';

/**
 * Shared weather theming: condition-based gradients (built from the app's
 * Primary / Secondary / Lime palette) and icon mapping. Reused by the home
 * widget and the full weather screen so the look stays consistent.
 */

interface Palette {
    primary: string;
    secondary: string;
    lime: string;
}

type IconName = keyof typeof Ionicons.glyphMap;

const code2 = (icon?: string) => (icon || '01d').slice(0, 2);
export const isNightIcon = (icon?: string) => !!icon && icon.endsWith('n');

/**
 * A tasteful 2–3 stop gradient for the given weather icon, mixing the brand
 * palette with condition-appropriate tones.
 */
export function getWeatherGradient(icon: string | undefined, p: Palette): [string, string, ...string[]] {
    const c = code2(icon);
    const night = isNightIcon(icon);

    switch (c) {
        case '01': // clear
            return night ? ['#0B1E3B', p.primary] : [p.secondary, p.primary];
        case '02': // few clouds
        case '03': // scattered clouds
            return night ? ['#182848', p.primary] : [p.primary, '#2C7A7B'];
        case '04': // broken / overcast
            return night ? ['#1F2937', '#0F3B3B'] : ['#475569', p.primary];
        case '09': // shower rain
        case '10': // rain
            return night ? ['#111827', '#0F3B4A'] : ['#1E3A5F', p.primary];
        case '11': // thunderstorm
            return ['#232526', '#2E2E38'];
        case '13': // snow
            return night ? ['#334155', p.primary] : ['#7FA6C9', p.primary];
        case '50': // mist / fog
            return night ? ['#2C3E50', p.primary] : ['#5C7A99', p.primary];
        default:
            return [p.primary, '#0F3B3B'];
    }
}

/** A bright accent (used for highlights/pills) that suits the condition. */
export function getWeatherAccent(icon: string | undefined, p: Palette): string {
    const c = code2(icon);
    if (c === '01') return isNightIcon(icon) ? p.lime : p.secondary;
    if (c === '09' || c === '10' || c === '11') return p.lime;
    return p.lime;
}

/** Map an OpenWeather icon code to an Ionicons name. */
export function getWeatherIconName(icon?: string): IconName {
    const c = code2(icon);
    const night = isNightIcon(icon);
    switch (c) {
        case '01': return night ? 'moon' : 'sunny';
        case '02': return night ? 'cloudy-night' : 'partly-sunny';
        case '03':
        case '04': return 'cloudy';
        case '09':
        case '10': return 'rainy';
        case '11': return 'thunderstorm';
        case '13': return 'snow';
        case '50': return 'cloud';
        default: return night ? 'moon' : 'sunny';
    }
}
