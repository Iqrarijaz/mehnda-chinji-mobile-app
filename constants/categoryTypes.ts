export const CATEGORY_TYPES: Record<string, string[]> = {
    education: ['school', 'college', 'academy', 'university', 'library', 'coaching center', 'other'],
    religious: ['mosque', 'madrasa', 'imam bargah', 'shrine', 'janaz-gah', 'other'],
    health: ['hospital', 'clinic', 'pharmacy', 'laboratory', 'medical store', 'other'],
    govt: ['office', 'post office', 'police station', 'court', 'union council', 'other'],
    emergency: ['fire station', 'ambulance', 'rescue', 'blood bank', 'other'],
    banks: ['bank', 'atm', 'microfinance', 'other'],
    travel: ['bus service', 'car service', 'other'],
};

export const getCategoryTypes = (category: string): string[] => {
    return CATEGORY_TYPES[category.toLowerCase()] || [];
};
