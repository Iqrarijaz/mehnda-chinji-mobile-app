// Shared constants and helpers for weather components
export const PRIMARY = '#006666';
export const BG_GRADIENT: readonly [string, string] = ['#006666', '#004d4d'];

export function getIconName(icon: string): string {
    if (icon.startsWith('01')) return icon.endsWith('n') ? 'moon' : 'sunny';
    if (icon.startsWith('02')) return icon.endsWith('n') ? 'cloudy-night' : 'partly-sunny';
    if (icon.startsWith('03') || icon.startsWith('04')) return 'cloudy';
    if (icon.startsWith('09') || icon.startsWith('10')) return 'rainy';
    if (icon.startsWith('11')) return 'thunderstorm';
    if (icon.startsWith('13')) return 'snow';
    if (icon.startsWith('50')) return 'cloud';
    return icon.endsWith('n') ? 'moon' : 'sunny';
}
