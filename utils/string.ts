export const capitalizeString = (str?: string): string => {
    if (!str || typeof str !== 'string') return '';
    const words = str.toLowerCase().split(' ');
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};
