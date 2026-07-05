export const PLACE_CATEGORY_MAPPING: Record<string, string> = {
    education: 'Education',
    religious: 'Religious',
    health: 'Health',
    govt: 'Govt Offices',
    emergency: 'Emergency',
    banks: 'Banks',
    travel: 'Travel',
};

export interface CategoryInfo {
    id: string;
    label: string;
    icon: any;
}

export const CATEGORIES_CONFIG: CategoryInfo[] = [
    { id: 'emergency', label: 'Emergency', icon: require('@/assets/icons/emergency.webp') },
    { id: 'education', label: 'Education', icon: require('@/assets/icons/education_icon.webp') },
    { id: 'religious', label: 'Religious', icon: require('@/assets/icons/religious.webp') },
    { id: 'health', label: 'Health', icon: require('@/assets/icons/health.webp') },
    { id: 'govt', label: 'Govt Offices', icon: require('@/assets/icons/govt_office.webp') },
    { id: 'banks', label: 'Banks', icon: require('@/assets/icons/bank.webp') },
    { id: 'travel', label: 'Travel', icon: require('@/assets/icons/travel.webp') },
];

export const MORE_CATEGORIES_CONFIG: CategoryInfo[] = [

];

export const PLACE_CATEGORIES = CATEGORIES_CONFIG.map(cat => ({
    key: cat.label,
    value: cat.id.toUpperCase()
}));
