export const PLACE_CATEGORY_MAPPING: Record<string, string> = {
    education: 'Education',
    religious: 'Religious',
    health: 'Health',
    govt: 'Govt Offices',
    emergency: 'Emergency',
    // travel: 'Travel',
};

export interface CategoryInfo {
    id: string;
    label: string;
    icon: string;
    color: string;
}

export const CATEGORIES_CONFIG: CategoryInfo[] = [
    { id: 'emergency', label: 'Emergency', icon: 'alert-circle', color: '#F87171' },
    { id: 'education', label: 'Education', icon: 'school', color: '#3B82F6' },
    { id: 'religious', label: 'Religious', icon: 'book', color: '#10B981' },
    { id: 'health', label: 'Health', icon: 'medkit', color: '#EF4444' },
    { id: 'govt', label: 'Govt Offices', icon: 'business', color: '#6366F1' },
    // { id: 'travel', label: 'Travel', icon: 'bus', color: '#60A5FA' },
];

export const PLACE_CATEGORIES = CATEGORIES_CONFIG.map(cat => ({
    key: cat.label,
    value: cat.id.toUpperCase()
}));
