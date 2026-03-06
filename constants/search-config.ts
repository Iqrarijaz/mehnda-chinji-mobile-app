export interface SearchNavResult {
    id: string;
    label: string;
    route: string;
    icon: string;
}

export interface SearchCategoryResult {
    id: string;
    label: string;
    icon: string;
    color: string;
    keywords: string[];
}

export const SEARCH_NAV_ITEMS: SearchNavResult[] = [
    { id: 'emergency', label: 'Emergency', route: '/listing/emergency', icon: 'alert-circle' },
    { id: 'blood', label: 'Blood Donors', route: '/(tabs)/blood', icon: 'water' },
    { id: 'settings', label: 'Settings', route: '/settings', icon: 'settings-outline' },
    { id: 'profile', label: 'Profile', route: '/profile', icon: 'person-outline' },
    { id: 'support', label: 'Support & FAQ', route: '/support', icon: 'help-circle-outline' },
];

export const SEARCH_CATEGORIES_CONFIG: SearchCategoryResult[] = [
    {
        id: 'emergency',
        label: 'Emergency',
        icon: 'alert-circle',
        color: '#F87171',
        keywords: ['emergency', 'police', 'ambulance', 'fire', 'hospital', 'help', 'accident']
    },
    {
        id: 'education',
        label: 'Education',
        icon: 'school',
        color: '#3B82F6',
        keywords: ['education', 'school', 'college', 'admission', 'university', 'study', 'teacher']
    },
    {
        id: 'religious',
        label: 'Religious',
        icon: 'book',
        color: '#10B981',
        keywords: ['religious', 'mosque', 'masjid', 'prayer', 'namaz', 'timings', 'quran']
    },
    {
        id: 'health',
        label: 'Health',
        icon: 'medkit',
        color: '#EF4444',
        keywords: ['health', 'doctor', 'clinic', 'hospital', 'pain', 'medicine', 'pharmacy', 'checkup']
    },
    {
        id: 'govt',
        label: 'Govt Offices',
        icon: 'business',
        color: '#6366F1',
        keywords: ['govt', 'office', 'nadra', 'police station', 'utility', 'bill', 'official']
    },
];

export const POPULAR_SEARCHES = [
    "Blood Donors",
    "Govt School",
    "Masjid Timings",
    "Clinic",
    "Police Station"
];
