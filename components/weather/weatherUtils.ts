// Shared helpers for weather components.
// (Condition gradients + accent colours now live in utils/weatherTheme.ts, which
// draws from the Primary / Secondary / Lime brand palette.)

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
