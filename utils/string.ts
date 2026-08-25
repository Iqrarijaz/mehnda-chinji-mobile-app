export const capitalizeString = (str?: string | null): string => {
    if (!str || typeof str !== 'string') return '';
    return str
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
